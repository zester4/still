import type { Metadata } from "next";
import { ResetPasswordPage } from "@/routes/reset-password";

export const metadata: Metadata = { title: "Choose a new password · Still" };
export const dynamic = "force-dynamic";

export default ResetPasswordPage;
