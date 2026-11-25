import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans | Activity Central",
  description: "See what the Standard and Premium plans include for care homes and care teams, and choose the one that suits your setting.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
