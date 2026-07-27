// This runs only on Vercel. OPENAI_API_KEY stays on the server and is never sent to the browser.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Only POST requests are allowed." });
  }

  const { text } = request.body || {};
  if (!text || typeof text !== "string" || text.length > 4096) {
    return response.status(400).json({ error: "A valid English text input is required." });
  }

  try {
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "marin",
        input: text,
        instructions: "Speak clear, natural General American English with a warm, conversational tone for an intermediate English learner.",
        response_format: "mp3",
        speed: 0.9
      })
    });

    if (!ttsResponse.ok) {
      return response.status(ttsResponse.status).json({ error: "The speech service could not generate audio." });
    }

    const audio = Buffer.from(await ttsResponse.arrayBuffer());
    response.setHeader("Content-Type", "audio/mpeg");
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).send(audio);
  } catch (error) {
    console.error("TTS error", error);
    return response.status(500).json({ error: "Unable to generate speech." });
  }
}
