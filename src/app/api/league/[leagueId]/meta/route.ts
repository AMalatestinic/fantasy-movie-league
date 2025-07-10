import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  await dbConnect();
  const { leagueId } = await params;

  try {
    const league = await League.findById(leagueId).select("_id name");
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    return NextResponse.json(league, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch league meta" },
      { status: 500 }
    );
  }
}
