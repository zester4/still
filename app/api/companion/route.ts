import { handleCompanionPost } from "@/lib/companion/companion-post";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleCompanionPost(request);
}
