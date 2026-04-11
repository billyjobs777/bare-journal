import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const journalContext: Record<string, string> = {
  wealth:       "financial mindset, wealth-building, and money beliefs",
  health:       "physical wellbeing, energy, movement, and body awareness",
  motivational: "motivation, discipline, resilience, and personal growth",
  gratitude:    "gratitude, appreciation, joy, and finding beauty in everyday moments",
  creativity:   "creative expression, artistic practice, and making things",
};

const chapterNames: Record<number, string> = {
  1: "Awareness",
  2: "Action",
  3: "Manifestation",
};

function getChapter(journeyDay: number): number {
  if (journeyDay <= 30) return 1;
  if (journeyDay <= 60) return 2;
  return 3;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { journalType, intention, journeyDay, weekEntries, weeklyPrompt } = await req.json();

    const chapter = getChapter(journeyDay);
    const context = journalContext[journalType] || "personal growth";
    const entriesCount = (weekEntries || []).filter((e: Record<string, unknown>) => e.ms_am || e.ms_pm).length;

    // Build a compact entry summary for the AI — scores and sanitized notes only
    const entrySummary = (weekEntries || []).map((e: Record<string, unknown>) => {
      const parts: string[] = [];
      if (e.ms_am && e.ms_pm) parts.push(`Score: ${e.ms_am} AM → ${e.ms_pm} PM`);
      else if (e.ms_am) parts.push(`Score: ${e.ms_am} (morning only)`);
      else if (e.ms_pm) parts.push(`Score: ${e.ms_pm} (evening only)`);
      if (e.msn_am && typeof e.msn_am === 'string') parts.push(`Morning note: "${sanitize(e.msn_am)}"`);
      if (e.msn_pm && typeof e.msn_pm === 'string') parts.push(`Evening note: "${sanitize(e.msn_pm)}"`);
      return parts.length ? `${e.date}: ${parts.join(", ")}` : null;
    }).filter(Boolean).join("\n");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a contemplative companion writing a brief, personal weekly letter to someone on a 90-day journaling journey.
Your tone is warm, honest, and poetic — like a trusted mentor who sees them clearly and believes in them unconditionally.
You do NOT use charts, numbers, or percentages. You translate data into human feeling.
You speak directly to the person using "you" — never "the user" or "they".
Keep your response to exactly 2-3 sentences. Make every word count.
Do not begin with "This week" — find a more personal, specific opening.

ABSOLUTE CONTENT GUARDRAILS — these override everything else:
- NEVER suggest the person is failing, falling behind, doing poorly, or not measuring up to any standard
- NEVER interpret low scores as weakness, struggle, or a problem to fix — low scores mean honest self-reflection, which is brave
- NEVER use language that could induce shame, guilt, inadequacy, self-criticism, or anxiety
- NEVER compare their performance to how they "should" be doing or to any external benchmark
- NEVER suggest they need to do better, try harder, or change what they're doing
- NEVER offer mental health advice, recommend professional help, or flag any concern about their wellbeing
- NEVER say anything that would make a person feel worse after reading it than before
- If scores were consistently low, reframe as honesty and self-awareness — "You were honest with yourself this week" is always true
- If they showed up fewer days, acknowledge the days they did with genuine warmth — one day of showing up is worthy of recognition
- When in doubt: compassion, warmth, and forward possibility — always`;

    // Sanitize entry notes to prevent prompt injection
    const sanitize = (text: string) => text.replace(/[`"\\]/g, '').slice(0, 200);

    const safeIntention = typeof intention === 'string' ? sanitize(intention) : '';
    const safeWeeklyPrompt = typeof weeklyPrompt === 'string' ? weeklyPrompt.slice(0, 300) : '';

    const userMessage = `Journal theme: ${context}
Chapter ${chapter}: ${chapterNames[chapter]} (Journey Day ${journeyDay})
User's 90-day intention: "${safeIntention}"
Weekly reflection prompt they engaged with: "${safeWeeklyPrompt}"

This week's check-in data (${entriesCount} of 7 days logged):
${entrySummary || "No entries with scores this week."}

Write a 2-3 sentence personal reflection about this person's week.
Focus on emotional truth and forward energy, not metrics.
Reference the chapter theme subtly if it fits naturally.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const reflection_text = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "";

    return new Response(JSON.stringify({ reflection_text, entries_count: entriesCount }), {
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
