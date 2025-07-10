"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddMovie() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "" });
  const [movie, setMovie] = useState<null | { title: string; poster: string }>(
    null
  );
  const [boxOffice, setBoxOffice] = useState<
    { title: string; weekendGross: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `/api/movies/search?title=${encodeURIComponent(form.title)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMovie({ title: data.title, poster: data.poster });

        const boxOfficeRes = await fetch("/api/box-office");
        if (boxOfficeRes.ok) {
          const boxOfficeData = await boxOfficeRes.json();
          setBoxOffice(boxOfficeData);
          console.log("Box Office Data:", boxOffice);
        } else {
          setBoxOffice([]);
        }
      } else {
        setMovie(null);
        setBoxOffice([]);
      }
    } catch (err) {
      console.error("Error:", err);
      setMovie(null);
      setBoxOffice([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Search Movie</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <div>
          <label htmlFor="title">Movie Title</label>
          <input
            type="text"
            name="title"
            id="title"
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Search Movie"}
        </button>
      </form>

      {movie && (
        <div>
          <h2>{movie.title}</h2>
          <img src={movie.poster} alt={movie.title} />
          {boxOffice.length > 0 && (
            <div>
              <h3>Box Office Info</h3>
              <ul>
                {boxOffice.map((m) => (
                  <li key={m.title}>
                    {m.title}: {m.weekendGross}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => router.push(`/movies/${movie.title}`)}>
            View Details
          </button>
        </div>
      )}
    </div>
  );
}
