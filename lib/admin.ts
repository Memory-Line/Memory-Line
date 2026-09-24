import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Only the account whose email matches ADMIN_EMAIL counts as admin.
// Everyone else (including paying customers) gets null.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!session?.user?.email || !adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return null;
  }
  return session;
}
