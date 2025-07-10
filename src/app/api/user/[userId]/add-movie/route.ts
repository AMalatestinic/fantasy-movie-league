import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";
import Movie from "@/models/movieSchema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  await dbConnect();

  const { userId } = await params;
  const { movie, leagueId } = await req.json();

  if (!userId || !movie) {
    return NextResponse.json(
      { error: "Missing userId or movie" },
      { status: 400 }
    );
  }

  try {
    // Upsert the movie in Movie collection
    await Movie.findOneAndUpdate(
      { title: movie.title, releaseDate: movie.releaseDate },
      { $set: movie },
      { upsert: true, new: true }
    );

    // Add full movie data to user's draftedMovies
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          draftedMovies: {
            id: movie.id,
            title: movie.title,
            poster: movie.poster || movie.poster_path || "",
            releaseDate: movie.releaseDate,
            drafter: movie.drafter,
            leagueId,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Server error in add-movie:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
