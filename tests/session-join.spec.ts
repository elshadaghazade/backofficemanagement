import { test, expect, type Page } from "@playwright/test";

const openUsersPage = async (page: Page) => {
    await page.goto("/dashboard/users");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({ timeout: 15_000 });
};

const startSessionForFirstUser = async (page: Page) => {
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    const fullName = (await firstRow.locator("td").first().innerText()).trim();

    await firstRow.getByRole("button", { name: /start session/i }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/session link created/i)).toBeVisible();

    const urlMatch = await modal.textContent();
    const m = urlMatch?.match(/https?:\/\/[^\s]+/);
    if (!m) {
        throw new Error("Join URL not found in modal text");
    }
    const joinUrl = m[0];

    expect(joinUrl).toMatch(/^https?:\/\/.+/);

    return { fullName, joinUrl };
}

test.describe("Session join link", () => {
    test("Admin creates join link; unauth user opens link and is logged in and sees updated welcome text", async ({
        page,
        browser,
    }) => {

        await openUsersPage(page);
        const { joinUrl } = await startSessionForFirstUser(page);

        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();

        await userPage.goto(joinUrl);

        await expect(userPage.getByRole("button", { name: /sign out/i })).toBeVisible();

        await expect(userPage.getByText(new RegExp(`Welcome,`, "i"))).toBeVisible();

        await userContext.close();
    });
});