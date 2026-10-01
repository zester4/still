import type { Metadata } from "next";
import { VerifyEmailPage } from "@/routes/verify-email";

export const metadata: Metadata = { title: "Confirm your email · Still" };
export const dynamic = "force-dynamic";

export default VerifyEmailPage;
