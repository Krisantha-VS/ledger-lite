import { redirect } from "next/navigation";

// Root → redirect to login (middleware will redirect to dashboard if already authed)
export default function RootPage() {
  redirect("/login");
}
