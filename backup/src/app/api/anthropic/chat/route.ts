import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";
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

  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages: convertToCoreMessages(messages),
    system: "You are a helpful AI assistant",
  });

  return result.toDataStreamResponse();
}
