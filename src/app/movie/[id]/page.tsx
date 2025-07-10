"use client";

import Header from "@/app/partials/Header/header";
import axios from "axios";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DisplayMovie() {
  const router = useRouter();
  const params = useParams();
  const movieId = params.id as string;
  const [movie, setMovie] = useState({
    title: "",
    releaseDate: "",
    poster: "",
    earnings: { week1: 0, week2: 0 },
    fantasyPoints: { week1: 0, week2: 0 },
  });

  useEffect(() => {
    // This effect can be used to fetch movie details based on the ID from the URL
    const fetchMovieDetails = async () => {
      // Example: Fetch movie details from an API or database
      try {
        const res = await axios.get(`/api/movies/${movieId}`);
        setMovie(res.data);
      } catch (error) {
        console.error("Failed to fetch movie details:", error);
      }
      // const response = await fetch(`/api/movies/${movieId}`);
      // const movieData = await response.json();
      // console.log(movieData);
    };
    fetchMovieDetails();
  }, [movieId]);

  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Display Movie</h1>
        <p className="text-gray-600">{movie.title}</p>
        <img src={movie.poster} />
      </div>
      <button onClick={() => router.push("/movie/add")}>Back</button>
    </div>
  );
}
