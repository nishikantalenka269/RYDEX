import { auth } from "@/auth";
import { connection } from "next/server";
import AdminDashboard from "@/components/AdminDashboard";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PartnerDashboard from "@/components/PartnerDashboard";
import PublicHome from "@/components/PublicHome";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export default async function Home() {
  await connection();

  const session = await auth();

  await connectDb();

  const user = await User.findOne({
    email: session?.user?.email,
  });

  const plainUser = JSON.parse(JSON.stringify(user));

  if (plainUser?.role === "admin") {
    return <AdminDashboard />;
  }

  return (
    <>
      {plainUser?.role === "partner" ? (
        <>
          <Nav />
          <PartnerDashboard />
        </>
      ) : (
        <>
          <Nav />
          <PublicHome />
        </>
      )}

      <Footer />
    </>
  );
}
