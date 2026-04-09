import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a personal growth coach generating a customized 90-day journaling program.
The user has set a specific intention for their journey within a specific journal theme. Your job is to create prompts that serve BOTH the user's intention AND stay firmly within the journal's theme area.

IMPORTANT: If the user's intention drifts outside the journal theme, gently redirect the prompts back to the theme. For example, if the journal is about wealth but the user wrote a health-focused intention, generate wealth-themed prompts that acknowledge their broader growth mindset but stay focused on financial topics.

Rules for lofty questions:
- Start with "Why" or "How" — present tense, empowering
- Assume the outcome is already happening ("Why am I...", "Why does...", "Why do I...")
- Each question must relate to BOTH the user's intention AND the journal's theme
- Each question should be distinct and explore a different angle
- Keep them concise — one sentence

Rules for weekly prompts:
- Deeper, more reflective — invite honest self-examination
- Must stay within the journal's theme
- Should feel like a coaching conversation, not a quiz
- Mix challenge, appreciation, and forward momentum
- Keep each prompt to 1-2 sentences max

Return ONLY valid JSON with no explanation. No markdown, no code fences.`;

const journalContext: Record<string, string> = {
  wealth:       "financial mindset, wealth-building, money beliefs, income growth, and financial freedom",
  health:       "physical wellbeing, energy, movement, sleep, nutrition, and body awareness",
  motivational: "motivation, discipline, resilience, personal growth, and daily momentum",
  gratitude:    "gratitude, appreciation, joy, abundance mindset, and finding beauty in everyday moments",
  creativity:   "creative expression, artistic practice, overcoming creative blocks, making things, and cultivating originality",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { journalType, intention } = await req.json();

    if (!journalType || !intention) {
      return new Response(JSON.stringify({ error: "Missing journalType or intention" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });
    const context = journalContext[journalType] || "personal growth and self-improvement";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Journal focus area: ${context}
User's 90-day intention: "${intention}"

Generate exactly:
- 90 daily lofty questions (one per day, each unique, tied to this intention)
- 13 weekly deep-dive prompts (one per week for a 90-day period)

Return this exact JSON structure:
{
  "loftyQuestions": ["question1", "question2", ...],
  "weeklyPrompts": ["prompt1", "prompt2", ...]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response if there's extra text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse JSON from response");
      }
    }

    if (!Array.isArray(parsed.loftyQuestions) || !Array.isArray(parsed.weeklyPrompts)) {
      throw new Error("Invalid response structure");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
