import { NextResponse } from "next/server";

const DEBUG_ENV_SECRET = process.env.DEBUG_ENV_SECRET;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!DEBUG_ENV_SECRET) {
    return NextResponse.json({ error: "Debug endpoint disabled" }, { status: 404 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${DEBUG_ENV_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
  });
}