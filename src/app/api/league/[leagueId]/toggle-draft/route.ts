import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema"; // Adjust the import path as needed

export async function POST(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  await dbConnect();
  const { leagueId } = await params;
  const { open } = await req.json(); // expects { open: true/false }

  try {
    const league = await League.findByIdAndUpdate(
      leagueId,
      { draftOpen: open },
      { new: true }
    );
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, draftOpen: league.draftOpen });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
