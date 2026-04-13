import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";
import { fetchCrewOverview } from "@/lib/crew-queries";

export async function GET(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
  }

  const overview = await fetchCrewOverview(date);
  return NextResponse.json(overview);
}
