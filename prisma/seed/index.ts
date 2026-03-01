import { createAdmin } from "./createAdmin";
import { createSampleUsers } from "./createSampleUsers";

const startSeeding = async () => {
    try {
        await Promise.all([
            createAdmin(),
            createSampleUsers()
        ]);
    } catch (err: any) {
        console.error("Seed error:", err.toString());
        process.exit(0);
    }
}

startSeeding().catch(err => {
    console.error(`Seed error: ${err}`);
});