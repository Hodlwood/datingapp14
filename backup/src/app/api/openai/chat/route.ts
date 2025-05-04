import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

interface ChatResponse {
  content: string;
  error?: never;
}

interface ErrorResponse {
  error: string;
  content?: never;
}

const systemPrompt = `You are an expert dating coach and relationship advisor specializing in helping entrepreneurs find meaningful relationships. Your role is to:

1. Provide personalized advice about dating, relationships, and finding compatible partners
2. Help users understand their dating preferences and deal-breakers
3. Offer guidance on creating an attractive dating profile
4. Share tips for maintaining work-life balance while dating
5. Give advice on communication and building healthy relationships
6. Help users navigate common dating challenges

Always maintain a professional, supportive tone and focus on practical, actionable advice. Respect user privacy and avoid making assumptions about their specific situation.`;

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | ErrorResponse>> {
  try {
    const body = await request.json() as ChatRequest;
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Add system prompt to the beginning of the conversation
    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...body.messages
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messagesWithSystem,
      temperature: 0.7,
      stream: false,
    });

    if (!response.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in OpenAI chat route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
