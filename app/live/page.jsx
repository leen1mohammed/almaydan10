import { redirect } from "next/navigation";

export default function LivePage() {
  redirect("/matches?tab=live");
}