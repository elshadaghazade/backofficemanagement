import { createAdmin } from "./createAdmin";
import { createSampleUsers } from "./createSampleUsers";

const startSeeding = async () => {
    await Promise.all([
        createAdmin(),
        createSampleUsers()
    ]);
}

startSeeding().catch(err => {
    console.error(`Seed error: ${err}`);
});