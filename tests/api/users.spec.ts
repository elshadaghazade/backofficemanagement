import { test, expect, APIRequestContext } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASS = "admin";

const signin = async (request: APIRequestContext, email: string, password: string) => {
    const res = await request.post("/api/auth/signin", { data: { email, password } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("accessToken");
    return body.accessToken as string;
}

const signupOrSigninUser = async (request: APIRequestContext, user: {
    firstName: string; lastName: string; email: string; password: string;
}) => {
    const signup = await request.post("/api/auth/signup", { data: user });

    if (signup.status() === 201) {
        const body = await signup.json();
        expect(body).toHaveProperty("accessToken");
        return body.accessToken as string;
    }

    if (signup.status() === 409) {
        return await signin(request, user.email, user.password);
    }

    if (signup.status() === 422) {
        const body = await signup.json();
        throw new Error(
            `Signup validation failed: ${JSON.stringify(body.fieldErrors, null, 2)}`
        );
    }

    const text = await signup.text();
    throw new Error(`Unexpected signup status ${signup.status()}: ${text}`);
}

function authedHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test.describe("Dashboard API", () => {
    test("only admin can modify content", async ({ request }) => {
        const userToken = await signupOrSigninUser(request, {
            firstName: 'Elshad',
            lastName: 'Aghayev',
            email: 'anewuser@example.com',
            password: 'P@ssword555'
        });

        const res = await request.put("/api/dashboard", {
            headers: authedHeaders(userToken),
            data: { content: "<div><h1>Hacked</h1></div>" },
        });

        expect(res.status()).toBe(403);

        const body = await res.json();
        expect(body).toEqual({ error: "Forbidden" });
    });

    test("admin PUT content - normal user GET returns same content", async ({ request }) => {
        const adminToken = await signin(request, ADMIN_EMAIL, ADMIN_PASS);
        const userToken = await signupOrSigninUser(request, {
            firstName: 'Elshad',
            lastName: 'Aghayev',
            email: 'anewuser@gmail.com',
            password: 'P@ssword555'
        });

        const content = `<div><h1>Welcome</h1><p>${Date.now()}</p></div>`;

        const putRes = await request.put("/api/dashboard", {
            headers: authedHeaders(adminToken),
            data: { content },
        });

        expect(putRes.ok()).toBeTruthy();
        const putBody = await putRes.json();
        expect(putBody.content).toBe(content);

        const getRes = await request.get("/api/dashboard", {
            headers: authedHeaders(userToken),
        });

        expect(getRes.ok()).toBeTruthy();
        const getBody = await getRes.json();
        expect(getBody.content).toBe(content);
    });

    test("signup: weak password - 422 with fieldErrors.password", async ({ request }) => {
        const res = await request.post("/api/auth/signup", {
            data: {
                firstName: "Elshad",
                lastName: "Aghayev",
                email: `weak-${Date.now()}@example.com`,
                password: "weakpass",
            },
        });

        expect(res.status()).toBe(422);

        const body = await res.json();
        expect(body.error).toBe("validation failed.");
        expect(body.fieldErrors).toBeTruthy();
        expect(body.fieldErrors.fieldErrors?.password?.length).toBeGreaterThan(0);
    });

    test("non-admin - 403 Forbidden", async ({ request }) => {
        const userToken = await signupOrSigninUser(request, {
            firstName: 'Elshad',
            lastName: 'Aghayev',
            email: 'anewuser@gmail.com',
            password: 'P@ssword555'
        });

        const res = await request.get("/api/users?page=0", {
            headers: authedHeaders(userToken),
        });

        expect(res.status()).toBe(403);
        expect(await res.json()).toEqual({ error: "Forbidden" });
    });

    test("admin - 200 and payload looks correct", async ({ request }) => {
        const adminToken = await signin(request, ADMIN_EMAIL, ADMIN_PASS);

        const res = await request.get("/api/users?page=0", {
            headers: authedHeaders(adminToken),
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        expect(body).toHaveProperty("data");
        expect(Array.isArray(body.data)).toBe(true);

        expect(body).toHaveProperty("totalUsers");
        expect(typeof body.totalUsers).toBe("number");

        expect(body).toHaveProperty("currentPage", 0);
        expect(body).toHaveProperty("nextPage");
        expect(body).toHaveProperty("totalPages");
        expect(typeof body.totalPages).toBe("number");

        if (body.data.length > 0) {
            const u = body.data[0];
            expect(u).toHaveProperty("id");
            expect(u).toHaveProperty("firstName");
            expect(u).toHaveProperty("lastName");
            expect(u).toHaveProperty("email");
            expect(u).toHaveProperty("status");
            expect(u).toHaveProperty("role"); // nullable
            expect(u).toHaveProperty("loginsCount");
            expect(u).toHaveProperty("createdAt");
            expect(u).toHaveProperty("updatedAt");
        }
    });

    test("admin: invalid page - 400", async ({ request }) => {
        const adminToken = await signin(request, ADMIN_EMAIL, ADMIN_PASS);

        const res = await request.get("/api/users?page=abc", {
            headers: authedHeaders(adminToken),
        });

        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty("error");
    });

    test("admin: list excludes current admin user", async ({ request }) => {
        const loginRes = await request.post("/api/auth/signin", {
            data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginBody = await loginRes.json();
        const adminToken = loginBody.accessToken as string;
        const adminId = loginBody.user?.id as string;

        const res = await request.get("/api/users?page=0", {
            headers: authedHeaders(adminToken),
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();

        const ids = (body.data as Array<{ id: string }>).map((x) => x.id);
        expect(ids).not.toContain(adminId);
    });
});