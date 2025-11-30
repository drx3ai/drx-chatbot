import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler for POST requests to /api/chat.  This simple example
 * echoes back the last user message along with the selected model and
 * feature flags.  In a production deployment you would replace this
 * implementation with a call to your preferred language model
 * service or custom logic for streaming responses and web search.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { messages, model, web, r1 } = body ?? {};
  let lastMessage = '';
  if (Array.isArray(messages) && messages.length > 0) {
    const m = messages[messages.length - 1];
    lastMessage = m?.content ?? '';
  }
  const text =
    `نموذج: ${model ?? ''} ${web ? '+ Web' : ''} ${r1 ? '+ R1' : ''}\nتم الاستلام: ${lastMessage}`;
  return NextResponse.json({ text });
}
