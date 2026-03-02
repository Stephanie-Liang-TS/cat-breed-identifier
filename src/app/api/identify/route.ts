import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analyze this image and identify the cat breed. Respond in JSON format only:
{
  "is_cat": true/false,
  "breed": "breed name",
  "confidence": "high/medium/low",
  "description": "2-3 sentences about this breed's characteristics",
  "traits": ["trait1", "trait2", "trait3"],
  "fun_fact": "one interesting fun fact about this breed"
}

If the image does not contain a cat, set is_cat to false and provide a friendly message in the description field. Always respond with valid JSON only, no markdown.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

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
