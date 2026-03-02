import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SILICONFLOW_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseURL: "https://api.siliconflow.cn/v1",
    });

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const lang = (formData.get("lang") as string | null) ?? "en";

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type;

    const langInstruction =
      lang === "zh"
        ? "Write the values for description, traits, fun_fact, and quality_comment fields in Simplified Chinese. All JSON field names must remain in English."
        : "Write all text values in English.";

    const response = await openai.chat.completions.create({
      model: "Qwen/Qwen3-VL-32B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: "text",
              text: `You are a professional cat breed expert. Analyze this image and identify the cat breed with maximum precision. ${langInstruction}

IMPORTANT — Breed identification rules:
- Be as SPECIFIC as possible. Identify the FULL breed name including any crossbreed/mix, variant, and coat color/pattern.
- Examples of precise identification: "British Shorthair Munchkin (Pure White)", "Scottish Fold Longhair (Blue Tabby)", "Ragdoll (Seal Bicolor)", "Persian Chinchilla (Silver Shaded)", "Exotic Shorthair (Cream Tabby)"
- Always include: base breed + any crossbreed/variant (e.g. Munchkin=short legs) + coat color/pattern
- If it's a mixed breed or crossbreed, identify all visible breed components
- Pay attention to: leg length (Munchkin=short legs), ear shape (Scottish Fold=folded ears), face shape, coat length, coat color and pattern (tabby, solid, bicolor, colorpoint, etc.)

Respond in JSON format only:
{
  "is_cat": true/false,
  "breed": "full precise breed name in English (e.g. British Shorthair Munchkin (Pure White))",
  "breed_zh": "品种中文名 (e.g. 英短曼基康纯白)",
  "confidence": "high/medium/low",
  "description": "2-3 sentences about this specific breed variant's characteristics",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "fun_fact": "one interesting fun fact about this breed",
  "price_range_usd": "e.g. $800 - $2,500 (typical market price range for this specific breed variant)",
  "price_range_cny": "e.g. ¥5,000 - ¥18,000 (typical market price range in China for this specific variant)",
  "quality_rating": "one of: S / A+ / A / B+ / B / C (assess this specific cat's appearance quality based on breed standards — coat quality, facial structure, body proportions, eye color, markings symmetry)",
  "quality_comment": "2-3 sentences evaluating this cat's physical appearance quality based on breed standards, noting specific strong points and any imperfections"
}

If the image does not contain a cat, set is_cat to false and provide a friendly message in the description field. For non-cat images, set all other fields to empty strings. Always respond with valid JSON only, no markdown.`,
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    let text = response.choices[0].message.content ?? "";

    // Qwen3 models may wrap JSON in markdown code blocks or include <think> tags
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) text = jsonMatch[1].trim();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = {
        is_cat: false,
        breed: "Unknown",
        confidence: "low",
        description: text,
        traits: [],
        fun_fact: "",
        price_range_usd: "",
        price_range_cny: "",
        quality_rating: "",
        quality_comment: "",
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Identification error:", error);
    return NextResponse.json(
      { error: "Failed to identify the image" },
      { status: 500 }
    );
  }
}
