import { NextResponse } from "next/server";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const status: {
    envVars: boolean;
    dbConnection: boolean;
    error?: string;
    timestamp: string;
  } = {
    envVars: hasSupabaseEnv(),
    dbConnection: false,
    timestamp: new Date().toISOString(),
  };

  if (!status.envVars) {
    return NextResponse.json(
      { ...status, error: "Supabase environment variables are missing" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("entries").select("id").limit(1);
    if (error) {
      status.error = error.message;
    } else {
      status.dbConnection = true;
    }
  } catch (e) {
    status.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(status, {
    status: status.dbConnection ? 200 : 503,
  });
}
