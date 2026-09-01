import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      subscriptionStatus: string;
      subscriptionRenewsAt: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    subscriptionStatus?: string;
    subscriptionRenewsAt?: string | null;
  }
}
