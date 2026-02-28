/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns hello world
 *     responses:
 *       200:
 *         description: Hello World!
 */

import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, user) => {

    return NextResponse.json({ message: user.firstName });
})