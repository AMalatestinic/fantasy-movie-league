import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Missing movie title" }, { status: 400 });
  }

  try {
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
      releaseDate: movie.release_date,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      overview: movie.overview,
      voteAverage: movie.vote_average,
    };

    return NextResponse.json(movieData, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}
