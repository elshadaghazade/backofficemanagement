import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/users/remove/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Deletes a user by their ID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: User ID to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example: {}
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: unauthorized
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: not found
 *       500:
 *         description: Server error while deleting user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: Something went wrong
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export const DELETE = withAuth(async (_req, user, ctx: { params: Promise<{ userId: string }>}) => {
    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prisma = getPrisma();
    
    try {
        const userId = (await ctx.params).userId;
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({});
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});