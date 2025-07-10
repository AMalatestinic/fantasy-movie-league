import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import Movie from "@/models/movieSchema";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  if (!title)
    return NextResponse.json({ error: "Missing movie title" }, { status: 400 });

  try {
    await dbConnect();

    const res = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
      },
    });

    const movie = res.data.results[0];
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const movieData = {
      title: movie.title,
      releaseDate: new Date(movie.release_date),
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      earnings: { week1: 0, week2: 0 },
      fantasyPoints: { week1: 0, week2: 0 },
    };

    const savedMovie = await Movie.create(movieData);
    return NextResponse.json(savedMovie, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add movie" }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const movies = await Movie.find().sort({ releaseDate: -1 });
    return NextResponse.json(movies, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
