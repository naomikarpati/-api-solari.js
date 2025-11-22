export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // ----- Parse JSON body manually -----
  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", () => resolve());
    req.on("error", (err) => reject(err));
  });

  let parsed;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    console.error("Invalid JSON body:", err);
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { answers } = parsed || {};

  if (!answers) {
    res.status(400).json({ error: "Missing 'answers' in request body" });
    return;
  }

  // ----- Solari system prompt -----
  const systemPrompt = `
You are Solari, the Insperiences well-being guide. You help users understand what they might need across five dimensions: mental, emotional, physical, energetic, spiritual.

Tone: calm, slow, warm, grounding, trauma-informed, non-judgmental. Short paragraphs. Never overwhelm. Never diagnose. Never give crisis support. If crisis → gently direct them to local emergency or crisis resources.

Offer gentle support:
- Acknowledge what they're feeling
- Reflect their inner landscape (mind, emotions, body)
- Offer 1–3 gentle practices (grounding, breathwork, emotional release, journaling, nervous-system tools)
- Recommend ONE Insperiences toolkit if aligned

Toolkits: Mental Gym, Dream Sanctuary, Guided Thought Release, Gratitude Frequency, Decoding the Moon, Energy Alignment Prism, Reset & Rise, Anchor in the Earth, Move the Waters Within, Reprogram Your Inner Sky, The Wheel.
`;

  try {
    // ----- Call OpenAI -----
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here are the user's wellbeing answers: ${JSON.stringify(
              answers
            )}. Please respond as Solari with validation, 1–3 gentle practices, and (if appropriate) a single toolkit recommendation.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error("OpenAI error:", text);
      res.status(500).json({ error: "OpenAI API error" });
      return;
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content ||
      "I’m here with you, but something went wrong while generating a response.";

    // ----- Send Solari's reply back to caller -----
    res.status(200).json({ recommendation: reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
