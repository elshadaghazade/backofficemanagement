import { Prisma } from "@/lib/generated/prisma/client";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

const prisma = getPrisma();

const createAdmin = async () => {
    const email = 'admin@example.com';

    const adminUser: Prisma.UserCreateInput = {
        firstName: 'admin',
        lastName: 'admin',
        createdAt: new Date(),
        email,
        status: 'active',
        password: await bcrypt.hash('admin', 12)
    }

    const exists = await prisma.user.count({
        where: { email }
    }) > 0;

    if (exists) {
        return;
    }

    await prisma.user.create({
        data: adminUser,
        select: { id: true }
    });
}

const startSeeding = async () => {
    await Promise.all([createAdmin()]);
}

startSeeding().catch(err => {
    logger.error(`Seed error: ${err}`);
});