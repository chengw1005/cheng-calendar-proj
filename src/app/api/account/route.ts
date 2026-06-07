import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function DELETE() {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : String(e) } },
      { status: 500 }
    );
  }
}
