import { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import { z } from 'zod';
import bcrypt from "bcryptjs";
import { userUpdateSchema } from "@/lib/validators/user-update";
import { id } from "zod/v4/locales";

const prisma = getPrisma();

/**
 * @swagger
 * /api/users/update/{userId}:
 *   patch:
 *     summary: Update a user
 *     description: Admin-only endpoint that updates user fields. If password is provided, it is hashed with bcrypt.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 description: If provided, will be hashed before storing
 *                 example: N3wStr0ngP@ssw0rd!
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: User updated successfully
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

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ userId: string }>}) => {
    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const parsed = userUpdateSchema.safeParse(await req.json());

        const userId = (await ctx.params).userId;

        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
        }

        const exists = await prisma.user.count({
            where: { 
                email: parsed.data.email,
                id: {
                    not: userId
                }
            },
            take: 1,
            skip: 0
        }) > 0;

        if (exists) {
            return NextResponse.json({ error: 'User exists with this email' }, { status: 409 });
        }

        const data: Prisma.UserUpdateInput = {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: parsed.data.email,
            status: parsed.data.status,
            password: parsed.data.password ? bcrypt.hashSync(parsed.data.password, 12) : undefined,
            updatedAt: new Date(),
        };

        await prisma.user.update({
            where: { id: userId },
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