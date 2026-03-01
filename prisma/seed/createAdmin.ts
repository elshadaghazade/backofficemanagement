import { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const createAdmin = async () => {
    const prisma = getPrisma();
    const email = 'admin@example.com';

    const adminUser: Prisma.UserCreateInput = {
        firstName: 'admin',
        lastName: 'admin',
        createdAt: new Date(),
        email,
        status: 'active',
        role: 'admin',
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