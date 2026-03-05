import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { transcript, examples } = await req.json();

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: `
    You are a LinkedIn writing assistant.

    Rewrite spoken thoughts into a high-quality LinkedIn post.

    Follow these rules:
    - Keep the author's authentic tone
    - Use short paragraphs
    - Strong opening hook
    - Remove filler words
    - Max 250 words
    - End with a soft CTA

    Here are examples of the author's writing style:

    ${examples}
    `
      },
      {
        role: "user",
        content: transcript
      }
    ]
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