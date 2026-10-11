import { redirect } from "next/navigation";

// Groups are now headings on the topic page.
export default function BoardGroup({ params }: { params: { language: string; area: string } }) {
  redirect(`/dashboard/communication-cards/${params.language}/boards/${params.area}`);
}
