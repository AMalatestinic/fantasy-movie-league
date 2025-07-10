import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import Movie from "@/models/movieSchema";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  const start = "2025-06-01";
  const end = "2025-08-31";

  try {
    await dbConnect();

    const res = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "popularity.desc", // ✅ prioritize biggest movies
        "primary_release_date.gte": start,
        "primary_release_date.lte": end,
        with_release_type: 3, // ✅ theatrical only
        region: "US", // ✅ US box office region
        "vote_count.gte": 75, // ✅ avoid obscure/low-visibility titles
        original_language: "en", // ✅ filter to English-language films
      },
    });

    // Upsert each movie into the Movie collection
    const movies = await Promise.all(
      res.data.results.map(async (movie: any) => {
        const doc = await Movie.findOneAndUpdate(
          { title: movie.title, releaseDate: movie.release_date },
          {
            $setOnInsert: {
              title: movie.title,
              releaseDate: movie.release_date,
              poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              overview: movie.overview,
            },
          },
          { upsert: true, new: true }
        );
        return {
          _id: doc._id,
          title: doc.title,
          releaseDate: doc.releaseDate,
          poster: doc.poster,
          overview: doc.overview,
        };
      })
    );

    return NextResponse.json(movies);
  } catch (err) {
    console.error("Error fetching summer movies", err);
    return NextResponse.json(
      { error: "Failed to fetch draft pool" },
      { status: 500 }
    );
  }
}
