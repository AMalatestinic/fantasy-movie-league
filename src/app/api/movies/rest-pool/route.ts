import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import Movie from "@/models/movieSchema";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  // Rest of year: Jan-April and Oct-Dec
  const start = "2025-10-01";
  const end = "2026-04-30";

  try {
    await dbConnect();

    // Fetch both ranges and combine
    const res = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: {
        api_key: TMDB_API_KEY,
        sort_by: "popularity.desc", // ✅ prioritize biggest movies
        "primary_release_date.gte": start,
        "primary_release_date.lte": end,
        with_release_type: 3, // ✅ theatrical only
        region: "US", // ✅ US box office region
        "vote_count.gte": 0, // ✅ avoid obscure/low-visibility titles
        original_language: "en",
      },
    });
    // axios.get("https://api.themoviedb.org/3/discover/movie", {
    //   params: {
    //     api_key: TMDB_API_KEY,
    //     sort_by: "popularity.desc", // ✅ prioritize biggest movies
    //     "primary_release_date.gte": start2,
    //     "primary_release_date.lte": end2,
    //     with_release_type: 3, // ✅ theatrical only
    //     region: "US", // ✅ US box office region
    //     "vote_count.gte": 0, // ✅ avoid obscure/low-visibility titles
    //     original_language: "en",
    //   },
    // }),

    // const allMovies = [...res1.data.results, ...res2.data.results];

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
              movieId: movie.id, // Use TMDB ID as unique identifier
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
    console.error("Error fetching rest of year movies", err);
    return NextResponse.json(
      { error: "Failed to fetch draft pool" },
      { status: 500 }
    );
  }
}
