import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const { data, error, count } = await supabase
    .from("identifications")
    .select("*", { count: "exact" })
    .eq("is_cat", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("identifications")
      .insert({
        image_thumbnail: body.image_thumbnail,
        breed: body.breed,
        breed_zh: body.breed_zh ?? "",
        confidence: body.confidence,
        description: body.description,
        traits: body.traits ?? [],
        fun_fact: body.fun_fact ?? "",
        price_range_usd: body.price_range_usd ?? "",
        price_range_cny: body.price_range_cny ?? "",
        quality_rating: body.quality_rating ?? "",
        quality_comment: body.quality_comment ?? "",
        is_cat: body.is_cat ?? true,
        lang: body.lang ?? "en",
      })
      .select()
      .single();

    if (error) {
      console.error("History save error:", error);
      return NextResponse.json({ error: "Failed to save identification" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("History POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
