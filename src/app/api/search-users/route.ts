import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await User.find({
      email: { $regex: query, $options: "i" },
    }).select("_id email");
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
