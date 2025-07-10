import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";

export async function GET(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = await params;
  await dbConnect();
  const leagues = await League.find({
    invitedUsers: userId,
  }).select("name _id");
  return NextResponse.json({ invites: leagues });
}
