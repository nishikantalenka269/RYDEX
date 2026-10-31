import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user?.email || session.user.role !== "admin") {
            return Response.json({ message: "unauthorized" }, { status: 400 });
        }

        await connectDb();
        const partnerId = (await context.params).id;
        const partner = await User.findById(partnerId);

        if (!partner || partner.role !== "partner") {
            return Response.json(
                { message: "partner not found" },
                { status: 400 }
            );
        }

        if (!["pending", "in_progress"].includes(partner.videoKycStatus)) {
            return Response.json(
                { message: "partner is not ready for Video KYC" },
                { status: 400 }
            );
        }

        // Zego room IDs only allow letters, numbers, and underscores.
        const roomId = `kyc_${partner._id}_${Date.now()}`;
        partner.videoKycRoomId = roomId;
        partner.videoKycStatus = "in_progress";
        partner.partnerOnBoardingSteps = 4;

        await partner.save();

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL}/emit`, {
                event: "video-kyc-started",
                userId: String(partner._id),
                data: {
                    roomId,
                    videoKycStatus: "in_progress",
                    videoKycRoomId: roomId,
                    partnerOnBoardingSteps: partner.partnerOnBoardingSteps,
                },
            });
        } catch (emitError) {
            console.error("Failed to notify partner of KYC start:", emitError);
        }

        return NextResponse.json({ roomId });
    } catch (error) {
        return NextResponse.json(
            { message: "video kyc start error" },
            { status: 500 }
        );
    }
}
