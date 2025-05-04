import { anthropic } from "@ai-sdk/anthropic";
import { StreamingTextResponse } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

export async function POST(req: NextRequest): Promise<Response> {
  const { messages } = await req.json() as ChatRequest;
  
  if (!Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "Invalid request format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = await anthropic("claude-3-5-sonnet-20240620").streamText({
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    system: "You are a helpful AI assistant",
  });

  return new StreamingTextResponse(result);
}
