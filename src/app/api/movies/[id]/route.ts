import dbConnect from "@/lib/dbConnect";
import Movie from "@/models/movieSchema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    await dbConnect();

    const movie = await Movie.findById(id).populate(
      "title releaseDate poster earnings fantasyPoints"
    );
    if (!movie) {
      return NextResponse.json(
        { error: "Movie does not exist" },
        { status: 404 }
      );
    }
    return NextResponse.json(movie, { status: 200 });
  } catch (err) {
    console.error("GET /api/movies/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}
