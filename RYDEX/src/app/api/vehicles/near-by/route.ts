import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { latitude, longitude, vehicleType } = await req.json()
        if (!latitude || !longitude) {
            return NextResponse.json(
                { message: "coordinates not found" },
                { status: 400 }
            )
        }

        const partners = await User.find({
            role: "partner",
            isOnline: true,
            partnerStatus: "approved",
            location: {
                $near: { // ye ek operator hai , jo help karta hi aaas paas  ke vehicle dhundne mein 
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 10000
                }
            }
        })

        const partnerIds = partners.map(p => p._id) // jitne bhi aaas pass live partners hain , uke ids 

        if (partnerIds.length == 0) { // agar koi nhi hai toh , koi nahi mila bol denge 
            return NextResponse.json(
                [],
                { status: 200 }
            )
        }

        // agar aas pass hain gadi , toh unke owner  ka details and vehicle ka details bhi send kar denge 
        const vehicles = await Vehicle.find({
            owner: { $in: partnerIds },
            type: vehicleType, // huamra wala vehicle ke saath match karna chahiye 
            status: "approved",
            isActive: true
        }).lean()

        return NextResponse.json(
            vehicles,
            { status: 200 }
        )


    } catch (error) {
        return NextResponse.json(
            { message: `near by vehicles error ${error}` },
            { status: 500 }
        )
    }
}
