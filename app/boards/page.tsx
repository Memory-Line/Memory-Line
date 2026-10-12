import { redirect } from "next/navigation";

// Boards are reached through Communication Cards.
export default function BoardsIndex() {
  redirect("/dashboard/communication-cards");
}
