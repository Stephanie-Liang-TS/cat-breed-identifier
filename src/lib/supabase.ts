import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Identification {
  id: string;
  created_at: string;
  image_thumbnail: string;
  breed: string;
  breed_zh: string;
  confidence: string;
  description: string;
  traits: string[];
  fun_fact: string;
  price_range_usd: string;
  price_range_cny: string;
  quality_rating: string;
  quality_comment: string;
  is_cat: boolean;
  lang: string;
}
