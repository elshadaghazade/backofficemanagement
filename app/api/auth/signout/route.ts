import { NextResponse, type NextRequest } from "next/server";

export const POST = async (_: NextRequest) => {
    const res = NextResponse.json({});

    res.cookies.delete('refresh_token');
    res.cookies.delete('session_active');
    return res;
}