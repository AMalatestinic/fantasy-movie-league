import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import League from "@/models/leagueSchema";
import Movie from "@/models/movieSchema";
import mongoose from "mongoose";
import User from "@/models/userModel";

// This is used to randomize the draft order when initializing a draft
function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// GET: Fetch drafted movies for a league
export async function GET(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  await dbConnect();
  const { leagueId } = await params;
  try {
    console.log("Fetching league with id:", leagueId);
    const league = await League.findById(leagueId).populate({
      path: "draftedMovies.movieId",
      model: Movie,
    });
    if (!league) {
      console.log("League not found");
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }
    console.log("League found:", league);

    // Return draftedMovies as an array of movie objects with drafter and id
    const drafted = league.draftedMovies.map((d: any) => ({
      id: d.movieId?._id?.toString(),
      movieId: d.movieId?._id?.toString(),
      title: d.movieId?.title,
      releaseDate: d.movieId?.releaseDate,
      poster: d.movieId?.poster,
      drafter: d.drafter?.toString(),
    }));
    console.log("Drafted movies:", drafted);
    return NextResponse.json(drafted);
  } catch (err) {
    console.error("Failed to fetch drafted movies", err);
    return NextResponse.json(
      { error: "Failed to fetch drafted movies" },
      { status: 500 }
    );
  }
}

// POST: Save drafted movies for a league
export async function POST(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  await dbConnect();
  const { leagueId } = await params;
  console.log("Draft route called for league id:", leagueId);
  const body = await req.json();

  // 1. Draft initialization
  if (body.initDraft) {
    try {
      const league = await League.findById(leagueId);
      if (!league) {
        return NextResponse.json(
          { error: "League not found" },
          { status: 404 }
        );
      }

      // Shuffle member IDs to create draftOrder
      const shuffledOrder = shuffle(
        league.members.map((member: any) => member._id.toString())
      );

      league.draftOrder = shuffledOrder;
      league.currentPick = 0;
      await league.save();

      return NextResponse.json({ draftOrder: shuffledOrder });
    } catch (err) {
      console.error("Failed to initialize draft:", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  // 2. Draft pick submission
  const { movie, drafter } = body;

  console.log("Drafting movie:", movie, "for drafter:", drafter);

  if (!movie || !drafter) {
    return NextResponse.json(
      { error: "Missing movie or drafter" },
      { status: 400 }
    );
  }

  try {
    const league = await League.findById(leagueId);
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Find the actual movie document in DB by id, tmdb_id, imdb_id, or title+releaseDate
    let orConditions = [];
    if (mongoose.Types.ObjectId.isValid(movie.id)) {
      orConditions.push({ _id: movie.id });
    }
    if (movie.tmdb_id) {
      orConditions.push({ tmdb_id: movie.tmdb_id });
    }
    if (movie.imdb_id) {
      orConditions.push({ imdb_id: movie.imdb_id });
    }
    if (movie.title && movie.releaseDate) {
      orConditions.push({ title: movie.title, releaseDate: movie.releaseDate });
    }

    console.log("Movie draft orConditions:", orConditions);

    const movieDoc = await Movie.findOne({
      $or: orConditions,
    });

    console.log("Found movieDoc:", movieDoc);

    if (!movieDoc) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const teamSize = league.settings?.teamSize || 3;

    // Check if movie already drafted in league
    const alreadyDrafted = league.draftedMovies.some(
      (m: any) => m.title?.toString() === movieDoc.title.toString()
    );
    if (alreadyDrafted) {
      return NextResponse.json(
        { error: "Movie already drafted" },
        { status: 400 }
      );
    }

    // Check if drafter's team is full
    const userDraftCount = league.draftedMovies.filter(
      (m: any) => m.userId?.toString() === drafter
    ).length;
    if (userDraftCount >= teamSize) {
      return NextResponse.json(
        { error: "Team is already full for this drafter" },
        { status: 400 }
      );
    }

    console.log("About to push drafted movie:", {
      drafter,
      title: movieDoc.title,
      releaseDate: movieDoc.releaseDate,
      movieId: movieDoc._id,
      poster: movieDoc.poster,
    });

    // Add draft pick to league
    league.draftedMovies.push({
      drafter: new mongoose.Types.ObjectId(drafter), // ensure ObjectId
      movieId: movieDoc._id,
      title: movieDoc.title?.toString() ?? "",
      releaseDate: movieDoc.releaseDate
        ? new Date(movieDoc.releaseDate).toISOString().slice(0, 10)
        : "", // or .toString() if you want the full ISO string
      poster: movieDoc.poster,
    });

    league.currentPick = league.draftedMovies.length;
    await league.save();

    console.log("Drafted movie added to league:", league.draftedMovies);

    await User.findByIdAndUpdate(
      drafter,
      {
        $push: {
          draftedMovies: {
            id: movieDoc._id,
            movieId: movieDoc._id,
            poster: movieDoc.poster,
            title: movieDoc.title,
            releaseDate: movieDoc.releaseDate
              ? new Date(movieDoc.releaseDate).toISOString().slice(0, 10)
              : "",
            leagueId: league._id,
          },
        },
      },
      { new: true }
    );

    const updatedLeague = await League.findById(leagueId);
    const updatedUser = await User.findById(drafter);
    return NextResponse.json({
      league: updatedLeague,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Failed to draft movie:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
