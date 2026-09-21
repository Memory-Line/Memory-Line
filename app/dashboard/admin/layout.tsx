import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// Extra gate for everything under /dashboard/admin: even if someone finds
// or guesses the URL, only the account matching ADMIN_EMAIL gets through.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  const isAdmin =
    !!session?.user?.email && !!adminEmail && session.user.email.toLowerCase() === adminEmail;

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
