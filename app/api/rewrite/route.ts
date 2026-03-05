import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { transcript } = await req.json();

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: `
You turn raw spoken thoughts into high-quality LinkedIn posts.

Rules:
- Keep the original voice
- Strong hook (1-2 lines)
- Short paragraphs
- Remove filler words
- Max 250 words
- End with soft CTA
`,
      },
      { role: "user", content: transcript },
    ],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readableStream);
}