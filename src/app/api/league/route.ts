import { NextRequest, NextResponse } from "next/server";
import League from "@/models/leagueSchema";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get session from request (req has no cookies directly, so pass req to getServerSession)
    const session = await getServerSession({ req, ...authOptions });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the logged-in user by email to get their _id
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const reqBody = await req.json();
    const { name, info, settings, members } = reqBody;

    if (!name || !info || !settings) {
      return NextResponse.json(
        { error: "Missing league information" },
        { status: 400 }
      );
    }

    const league = await League.create({
      name,
      info,
      settings,
      createdBy: user._id,
      members: members || [],
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { leagues: league._id },
    });

    return NextResponse.json(
      { message: "League created", league },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to create a league" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession({ req, ...authOptions });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");

    if (!leagueId) {
      return NextResponse.json({ error: "Missing league ID" }, { status: 400 });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (league.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Remove league from all user docs
    await User.updateMany(
      { leagues: league._id },
      { $pull: { leagues: league._id } }
    );

    await league.deleteOne();

    return NextResponse.json({ message: "League deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to delete league" },
      { status: 500 }
    );
  }
}
