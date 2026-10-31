import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

async function notifyDriver(driverId: string, booking: unknown) {
    try {
        const payload =
            booking &&
            typeof booking === "object" &&
            "toObject" in booking &&
            typeof (booking as { toObject: () => unknown }).toObject === "function"
                ? (booking as { toObject: () => unknown }).toObject()
                : booking;

        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL}/emit`, {
            event: "new-booking",
            userId: String(driverId),
            data: payload,
        });
    } catch (error) {
        // Booking must still succeed even if the partner is temporarily offline.
        console.error("Failed to notify driver of new booking:", error);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "unauthorize" },
                { status: 400 }
            );
        }

        const {
            driverId,
            vehicleId,
            pickUpAddress,
            dropAddress,
            pickUpLocation,
            dropLocation,
            fare,
            mobileNumber,
        } = await req.json();

        if (
            !driverId ||
            !vehicleId ||
            !pickUpLocation?.coordinates ||
            !dropLocation?.coordinates
        ) {
            return NextResponse.json(
                { message: "missing required details" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            );
        }

        const driver = await User.findById(driverId);
        if (!driver) {
            return NextResponse.json(
                { message: "driver not found" },
                { status: 400 }
            );
        }

        const existing = await Booking.findOne({
            user: user._id,
            bookingStatus: {
                $in: ["requested", "awaiting_payment", "confirmed", "started"],
            },
        });

        if (existing) {
            // Re-notify partner so an already-open pending page still gets the request.
            if (existing.bookingStatus === "requested") {
                await notifyDriver(String(existing.driver), existing);
            }
            return NextResponse.json(existing);
        }

        const booking = await Booking.create({
            user: user._id,
            driver: driver._id,
            vehicle: vehicleId,
            pickUpAddress,
            dropAddress,
            pickUpLocation,
            dropLocation,
            fare: Number(fare),
            userMobileNumber: mobileNumber,
            driverMobileNumber: driver.mobileNumber || mobileNumber,
            bookingStatus: "requested",
        });

        await notifyDriver(String(driverId), booking);

        return NextResponse.json(booking, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: `create booking error ${error}` },
            { status: 500 }
        );
    }
}
