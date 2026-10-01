import { auth } from "@/auth";
import { listConversationSummaries, loadSnapshot, saveConversationSummary } from "@/db/queries";
import { summarizeConversation } from "@/lib/companion/llm.server";

export const runtime = "nodejs";

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ summaries: await listConversationSummaries(userId) });
}

export async function POST(request: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  let body: { conversationId?: string; messages?: { role: "user" | "companion"; content: string }[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const conversationId = body.conversationId?.trim();
  if (!conversationId) return Response.json({ error: "Missing conversation." }, { status: 400 });
  const snapshot = await loadSnapshot(userId);
  const conversation = snapshot.conversations.find((item) => item.id === conversationId);
  if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
  const messages = (body.messages?.length ? body.messages : conversation.messages)
    .filter((message) => message && (message.role === "user" || message.role === "companion") && typeof message.content === "string")
    .slice(-24)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 2500) }));
  if (messages.filter((message) => message.role === "user").length < 2) {
    return Response.json({ summary: null });
  }
  const generated = await summarizeConversation({ turns: messages });
  const summary = await saveConversationSummary({
    userId,
    conversationId,
    summary: generated.summary,
    highlights: generated.highlights,
    messageCount: messages.length,
  });
  return Response.json({ summary });
}
