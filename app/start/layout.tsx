import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StartLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/start");
  return children;
}
