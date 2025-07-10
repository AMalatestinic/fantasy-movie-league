import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await dbConnect();

  const { email, leagueId } = await req.json();

  if (!leagueId || !email) {
    return NextResponse.json({ error: "Missing leagueId or userId" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    console.log("Email:", email);
    console.log("User found:", user);
    console.log("League found:", league);

    if (league.members.includes(email)) {
      return NextResponse.json(
        { message: "User already in league" },
        { status: 200 }
      );
    }

    if (league.invitedUsers.includes(user._id)) {
      return NextResponse.json(
        { message: "User already invited" },
        { status: 400 }
      );
    }

    league.invitedUsers.push(user._id);
    await league.save();

    await User.findByIdAndUpdate(
      user._id, // <-- use the user's ObjectId
      {
        $addToSet: { invites: leagueId },
      },
      { new: true }
    );
    console.log("User invited to league:", email, "in league:", leagueId);

    return NextResponse.json(
      { message: "User invited to league" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
