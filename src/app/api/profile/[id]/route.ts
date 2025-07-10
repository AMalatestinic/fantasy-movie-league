import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";
import League from "@/models/leagueSchema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const user = await User.findById(id)
      .populate({ path: "leagues", select: "_id name createdBy" })
      .populate({ path: "invites", select: "_id name" });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let invites = [];
    if (user.invites && user.invites.length > 0) {
      invites = await League.find({ _id: { $in: user.invites } }).select(
        "_id name"
      );
    }

    const userObj = user.toObject();
    userObj.invites = invites;

    console.log("user.invites:", user.invites);

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
