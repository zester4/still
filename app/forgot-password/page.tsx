import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/routes/forgot-password";

export const metadata: Metadata = { title: "Reset password · Still" };
export const dynamic = "force-dynamic";

export default ForgotPasswordPage;
