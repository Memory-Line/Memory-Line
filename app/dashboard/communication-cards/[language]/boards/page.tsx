import { redirect } from "next/navigation";

// The topic list now sits on the language page.
export default function BoardAreas({ params }: { params: { language: string } }) {
  redirect(`/dashboard/communication-cards/${params.language}`);
}
