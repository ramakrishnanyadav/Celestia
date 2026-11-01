import { redirect } from "next/navigation";

export default function AppPage(): never {
  redirect("/app/events");
}
