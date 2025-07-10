import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";
import User from "@/models/userModel";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  await dbConnect();

  const { userId } = await req.json();
  const leagueId = (await params).leagueId;

  const league = await League.findById(leagueId);
  if (!league) {
    return NextResponse.json({ message: "League not found" }, { status: 404 });
  }

  const invited = league.invitedUsers.includes(userId);
  if (!invited) {
    return NextResponse.json({ message: "User not invited" }, { status: 403 });
  }

  league.members.push(userId);
  league.invitedUsers = league.invitedUsers.filter(
    (id: string) => id.toString() !== userId
  );
  await league.save();

  await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: { leagues: leagueId },
      $pull: { invites: leagueId },
    },
    { new: true }
  );

  return NextResponse.json({ message: "Successfully joined league." });
}
