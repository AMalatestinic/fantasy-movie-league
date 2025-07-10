import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Movie from "@/models/movieSchema";

// Load API key securely from env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getLastSunday(): string {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0
  const diff = day === 0 ? 0 : day; // days since last Sunday
  const sunday = new Date(now.setDate(now.getDate() - diff));
  const yyyy = sunday.getFullYear();
  const mm = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const titles = searchParams.getAll("titles");

    if (titles.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const datePath = getLastSunday();
    const url = `https://www.the-numbers.com/weekly-box-office-chart`;
    const html = await fetch(url).then((res) => res.text());

    const prompt = `The following is an HTML page from The Numbers showing week box office rankings. Return the week gross earnings for the following movies only:\n\n${titles
      .map((t, i) => `${i + 1}. ${t}`)
      .join("\n")}

Respond ONLY in valid JSON like:
[
  { "title": "Movie Title", "weekGross": "$00,000,000" , "totalGross": "$00,000,000" },
]

Here is the HTML:
${html}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let json;
    try {
      const match = text.match(/\[[\s\S]*\]/);
      json = match ? JSON.parse(match[0]) : [];
    } catch (err) {
      console.error("Failed to parse Gemini output:", text);
      json = [];
    }

    const week = datePath.replace(/\//g, "-"); // e.g., "2025-07-04"
    const moviesWithWeek = Array.isArray(json)
      ? json.map((movie: any) => ({ ...movie, week }))
      : [];

    for (const movie of moviesWithWeek) {
      let weekGross = 0;
      if (typeof movie.weekGross === "string") {
        weekGross = Number(movie.weekGross.replace(/[^0-9.-]+/g, ""));
      } else if (typeof movie.weekGross === "number") {
        weekGross = movie.weekGross;
      }
      let totalGross = 0;
      if (typeof movie.totalGross === "string") {
        totalGross = Number(movie.totalGross.replace(/[^0-9.-]+/g, ""));
      } else if (typeof movie.totalGross === "number") {
        totalGross = movie.totalGross;
      }
      // Upsert by title, then push boxOffice entry if not already present for this week
      const updated = await Movie.findOneAndUpdate(
        { title: movie.title, "boxOffice.week": { $ne: week } },
        {
          $push: {
            boxOffice: { week, weekGross: weekGross, totalGross: totalGross },
          },
        },
        { upsert: false, new: true }
      );

      // If already present, update the weekGross for that week
      if (!updated) {
        await Movie.updateOne(
          { title: movie.title, "boxOffice.week": week },
          {
            $set: {
              "boxOffice.$.weekGross": weekGross,
              "boxOffice.$.totalGross": totalGross,
            },
          }
        );
      }
      await Movie.updateOne({ title: movie.title }, [
        {
          $set: {
            boxOffice: {
              $sortArray: {
                input: "$boxOffice",
                sortBy: { week: 1 },
              },
            },
          },
        },
      ]);
    }

    console.log("Gemini Output:", text);
    console.log("Parsed JSON:", json);

    const updatedMovies = await Movie.find({ title: { $in: titles } }).lean();
    return NextResponse.json({ movies: updatedMovies }, { status: 200 }); //should be a type Movie[]
  } catch (err) {
    console.error("Error in /api/box-office:", err);
    return NextResponse.json(
      { error: "Failed to fetch box office" },
      { status: 500 }
    );
  }
}
