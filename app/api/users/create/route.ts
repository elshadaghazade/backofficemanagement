import { Prisma } from "../../../../lib/generated/prisma/client";
import { getPrisma } from "../../../../lib/prisma";
import { userCreateSchema } from "../../../../lib/validators/user-create";
import { withAuth } from "../../../../lib/withAuth";
import { NextResponse } from "next/server";
import { z } from 'zod';
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Create a new user
 *     description: Admin-only endpoint that creates a user with an active status and user role. Password is hashed with bcrypt.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Str0ngP@ssw0rd!
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: false
 *               example: {}
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *             example:
 *               error:
 *                 issues:
 *                   - path: ["email"]
 *                     message: "Invalid email"
 *       403:
 *         description: Forbidden (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Forbidden
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Something went wrong
 */

export const POST = withAuth(async (req, user) => {
    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prisma = getPrisma();

    try {
        const parsed = userCreateSchema.safeParse(await req.json());

        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
        }

        const data: Prisma.UserCreateInput = {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            status: 'active',
            email: parsed.data.email,
            role: 'user',
            password: bcrypt.hashSync(parsed.data.password, 12),
            createdAt: new Date(),
        };

        const exists = await prisma.user.count({
            where: { email: parsed.data.email },
            take: 1,
            skip: 0
        }) > 0;

        if (exists) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 })
        }

        await prisma.user.create({
            data,
            select: {
                id: true
            }
        });

        return NextResponse.json({});
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});