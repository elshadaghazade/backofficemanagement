import { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { faker } from '@faker-js/faker';

export const createSampleUsers = async () => {
    const prisma = getPrisma();

    const bulkData: Prisma.UserCreateManyInput[] = [];
    
    for (let i = 0; i < 100; i++) {
        bulkData.push({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: `${i}${faker.internet.email()}`,
            password: bcrypt.hashSync(faker.internet.password()),
            role: 'user',
            status: 'active',
            createdAt: new Date(),
        });
    }

    await prisma.user.createMany({
        data: bulkData
    });
}