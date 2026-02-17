import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert ethics analysis engine for occupational safety and health professionals. You analyze ethical dilemmas through six ethical lenses and integrate professional codes of conduct.

## YOUR TASK
Analyze the provided case through all 6 ethical lenses, integrate relevant professional codes, detect conflicts, and return a structured JSON analysis.

## SIX ETHICAL LENSES (each scored 0-10, where 10 = fully ethically justified action)

1. **Duty / Deontological** - Professional obligations, rules, codes of conduct. What does duty demand?
2. **Utilitarian / Consequentialist** - Greatest good for greatest number. What produces the best outcomes?
3. **Rights-Based** - Individual rights protection. Are anyone's fundamental rights at stake?
4. **Justice / Fairness** - Equitable treatment across all stakeholders. Is the situation fair?
5. **Virtue Ethics** - Character and professional integrity. What would a person of good character do?
6. **Care Ethics** - Relationships and vulnerable populations. Who needs protection?

## PROFESSIONAL CODES KNOWLEDGE

### BCSP/ASSP (Board of Certified Safety Professionals / American Society of Safety Professionals)
- Hold paramount the safety, health, and welfare of the public
- Be objective and truthful in professional reports and testimony
- Issue public statements only in an objective and truthful manner
- Avoid conflicts of interest and disclose those that cannot be avoided

### AIHA/ABIH (American Industrial Hygiene Association / American Board of Industrial Hygiene)
- Practice with integrity and competence
- Maintain confidentiality of privileged information
- Report findings accurately and without bias
- Prioritize worker health and safety above employer demands
- Report hazardous conditions to appropriate authorities when employers fail to act

### AAOHN (American Association of Occupational Health Nurses)
- Advocate for the health and safety of workers
- Maintain confidentiality within legal and ethical boundaries
- Practice based on current scientific evidence
- Support worker autonomy and informed consent

### ACOEM (American College of Occupational and Environmental Medicine)
- Act as impartial advocates for the health and well-being of workers
- Use evidence-based practices in clinical decision-making
- Recognize and manage conflicts of interest
- Report workplace hazards truthfully
- Maintain independence of professional judgment from employer pressure

## SCORING RULES (CRITICAL - YOU MUST FOLLOW THESE)

1. Professional codes INFORM but don't replace lenses. They CONSTRAIN Duty, Rights, and Justice scores.
2. If a mandatory professional code obligation is clearly violated in the scenario:
   - Duty lens CANNOT exceed 4/10
   - Rights lens CANNOT exceed 4/10
   - The case MUST be flagged as "ethically unstable"
3. Multi-code conflict handling:
   - Single-code tension → conflictLevel minimum 2
   - Multi-code disagreement → conflictLevel minimum 3
4. Conflict severity is determined by lens score divergence:
   - Level 1: All lens scores within 2 points of each other (minor tension)
   - Level 2: Any lens scores 3-5 points apart (significant conflict)
   - Level 3: Any lens scores >5 points apart OR code violations detected (ethical dilemma)
5. Ethical stability:
   - "robust": conflictLevel 1 AND no code violations AND compositeScore >= 7
   - "stable": conflictLevel <= 2 AND no code violations
   - "unstable": conflictLevel 3 OR any code violation detected

## compositeScore Calculation
Average of all 6 lens scores, rounded to 1 decimal place.`;

const USER_PROMPT_TEMPLATE = (
  title: string,
  narrative: string,
  stakeholders: string,
  selectedCodes: string[]
) => `## CASE FOR ANALYSIS

**Title:** ${title}

**Narrative:** ${narrative}

**Key Stakeholders:** ${stakeholders || "Not specified"}

**Applicable Professional Codes:** ${selectedCodes.join(", ")}

## INSTRUCTIONS
Analyze this case and return ONLY valid JSON matching this exact structure (no markdown, no code fences, just the JSON object):

{
  "lensScores": {
    "duty": { "score": <0-10>, "reasoning": "<2-3 sentences>", "codeInfluence": "<how selected professional codes affect this score>" },
    "utilitarian": { "score": <0-10>, "reasoning": "<2-3 sentences>" },
    "rights": { "score": <0-10>, "reasoning": "<2-3 sentences>", "codeConstraint": <true if code violation caps this score> },
    "justice": { "score": <0-10>, "reasoning": "<2-3 sentences>" },
    "virtue": { "score": <0-10>, "reasoning": "<2-3 sentences>" },
    "care": { "score": <0-10>, "reasoning": "<2-3 sentences>" }
  },
  "compositeScore": <average of all 6 scores, 1 decimal>,
  "ethicalStability": "<unstable|stable|robust>",
  "conflictLevel": <1|2|3>,
  "conflictAnalysis": {
    "primaryTensions": ["<tension description>", ...],
    "professionalCodeImplications": {
      "<CODE_ID>": "<how this code applies and any conflicts>",
      ...
    }
  },
  "recommendedActions": ["<action 1>", "<action 2>", "<action 3>"],
  "questionsForReflection": ["<question 1>", "<question 2>", "<question 3>"],
  "warningFlags": ["<flag if applicable>", ...]
}

Remember: Apply the scoring constraint rules. If a professional code is clearly being violated, cap Duty and Rights at 4 and mark as unstable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, narrative, stakeholders, selectedCodes } = await req.json();

    if (!title || !narrative || !selectedCodes?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, narrative, selectedCodes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE(title, narrative, stakeholders, selectedCodes),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Gemini response:", JSON.stringify(data));
      throw new Error("No content in Gemini response");
    }

    // Parse the JSON from the response, handling potential markdown fences
    let analysisJson: string = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      analysisJson = jsonMatch[1].trim();
    }

    const analysis = JSON.parse(analysisJson);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-case error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
