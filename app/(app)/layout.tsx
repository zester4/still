import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppGroupLayout } from "@/components/app-group-layout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <AppGroupLayout>{children}</AppGroupLayout>;
}
