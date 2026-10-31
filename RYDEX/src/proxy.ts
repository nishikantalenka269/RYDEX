import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

// Public routes jinhe bina login ke access kar sakte hain
const PUBLIC_ROUTES = ["/"]

export async function proxy(req: NextRequest) {

    // Current URL se pathname nikal rahe hain
    const { pathname } = req.nextUrl

    if (
        // Next.js ki internal files aur favicon ko bina kisi check ke jaane do
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||

        // Agar URL kisi image file ka hai, toh use bina check ke jaane do
        /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)
    ) {
        // Request ko aage jaane do
        return NextResponse.next()
    }

    // Agar route public hai, toh login check karne ki zarurat nahi hai
    if (PUBLIC_ROUTES.includes(pathname)) {
        return NextResponse.next()
    }

    // Authentication se jude API routes ko bina session check ke jaane do
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next()
    }

    // Check karo ki user login hai ya nahi
    const session = await auth()

    // Agar user login nahi hai, toh use home page par bhej do
    if (!session) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    // Login kiye hue user ka role nikalo
    const role = session.user?.role

    // Agar user admin route khol raha hai
    if (pathname.startsWith("/admin")) {

        // Check karo ki user ka role admin hai ya nahi
        if (role != "admin") {
            // Admin nahi hai toh use home page par bhej do
            return NextResponse.redirect(new URL("/", req.url))
        }
    }

    // Agar user partner route khol raha hai
    if (pathname.startsWith("/partner")) {

        // Partner onboarding route ko seedha access karne do
        if (pathname.startsWith("/partner/onboarding")) {
            return NextResponse.next()
        }

        // Check karo ki user ka role partner hai ya nahi
        if (role != "partner") {
            // Partner nahi hai toh use home page par bhej do
            return NextResponse.redirect(new URL("/", req.url))
        }
    }

    // Agar request kisi API route ke liye hai
    if (pathname.startsWith("/api")) {

        // Check karo ki session aur user dono maujood hain ya nahi
        if (!session || !session.user) {

            // User ki authentication nahi hai toh 401 error bhejo
            return Response.json({
                message: "unauthorize"
            }, { status: 401 })
        }
    }

    // Saare checks pass hone par request ko aage jaane do
    return NextResponse.next()
}

// Ye tay karta hai ki kin routes par proxy chalega
export const config = {
    // Next.js ki static files aur favicon ko chhodkar baaki routes par proxy chalao
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}

