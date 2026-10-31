import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }

        const { roomId } = await req.json();
        if (!roomId || typeof roomId !== "string") {
            return NextResponse.json({ message: "roomId is required" }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ message: "user not found" }, { status: 400 });
        }

        const partner = await User.findOne({
            videoKycRoomId: roomId,
            role: "partner",
        });

        if (!partner) {
            return NextResponse.json({ message: "invalid KYC room" }, { status: 400 });
        }

        const isAdmin = user.role === "admin";
        const isRoomPartner = String(partner._id) === String(user._id);

        if (!isAdmin && !isRoomPartner) {
            return NextResponse.json({ message: "unauthorized" }, { status: 403 });
        }

        if (!isAdmin && partner.videoKycStatus !== "in_progress") {
            return NextResponse.json(
                { message: "KYC call is not active" },
                { status: 400 }
            );
        }

        const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
        if (!appId) {
            return NextResponse.json(
                { message: "Zego App ID is not configured" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            appId,
            roomId,
            userId: String(user._id),
            userName:
                user.role === "admin"
                    ? "Admin"
                    : `${user.name} (${user.email})`.replace(/[^a-zA-Z0-9_ ().@-]/g, "_"),
            role: user.role,
        });
    } catch (error) {
        return NextResponse.json(
            { message: `video kyc token error ${error}` },
            { status: 500 }
        );
    }
}
