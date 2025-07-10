import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  try {
    await dbConnect();

    const league = await League.findById(leagueId).populate({
      path: "members",
      select: "_id username createdBy draftedMovies",
    });
    if (!league) {
      return NextResponse.json(
        { error: "League does not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json(league, { status: 200 });
  } catch (err) {
    console.error("GET /api/league/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch league" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
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

    const { leagueId } = await params;
    console.log(leagueId);
    const league = await League.findById(leagueId);
    console.log("League to delete:", league);
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (league.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Remove league from all users' league arrays
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  await dbConnect();
  const { leagueId } = await params;
  const body = await req.json();
  const { hasStarted, hasEnded } = body;

  try {
    const updatedLeague = await League.findByIdAndUpdate(
      leagueId,
      {
        ...(hasStarted !== undefined && { hasStarted }),
        ...(hasEnded !== undefined && { hasEnded }),
      },
      { new: true }
    );

    if (!updatedLeague) {
      return new Response(JSON.stringify({ error: "League not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedLeague), {
      status: 200,
    });
  } catch (err) {
    console.error("PATCH error:", err);
    return new Response(JSON.stringify({ error: "Failed to update league" }), {
      status: 500,
    });
  }
}
