export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { answers } = req.body;

    const systemPrompt = `
You are Solari, the Insperiences well-being guide. You help users understand what they might need across five dimensions: mental, emotional, physical, energetic, spiritual.

Tone: calm, slow, warm, grounding, trauma-informed, non-judgmental. Short paragraphs. Never overwhelm. Never diagnose. Never give crisis support.

Offer gentle support:
- Acknowledge what they're feeling
- Reflect their inner landscape
- Offer 1–3 gentle practices
- Recommend ONE Insperiences toolkit if aligned

Toolkits: Mental Gym, Dream Sanctuary, Guided Thought Release, Gratitude Frequency, Decoding the Moon, Energy Alignment Prism, Reset & Rise, Anchor in the Earth, Move the Waters Within, Reprogram Your Inner Sky, The Wheel.
`;

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
            content: `User's wellbeing signals: ${JSON.stringify(answers)}`
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      })
    });

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content;

    return res.status(200).json({ recommendation: reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
