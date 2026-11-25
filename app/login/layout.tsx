import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | Activity Central",
  description: "Log in to your Activity Central account.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
