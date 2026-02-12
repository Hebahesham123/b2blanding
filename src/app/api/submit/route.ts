import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROMO_CODE = "NS10";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = (body.full_name || "").trim();
    const phoneNumber = (body.phone_number || "").trim();

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { error: "Full name and phone number are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
      return NextResponse.json(
        { error: "الخدمة غير مهيأة. يرجى إضافة بيانات Supabase في .env.local" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const promoCode = PROMO_CODE;

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        full_name: fullName,
        phone_number: phoneNumber,
        promo_code: promoCode,
      })
      .select("id, promo_code")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promo_code: data.promo_code,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
