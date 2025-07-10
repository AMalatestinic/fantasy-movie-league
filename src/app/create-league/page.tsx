"use client";
import { useRouter } from "next/navigation";
import Information from "@/components/Information/Information";
import "./styles.css";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function CreateLeague() {
  const { data: session, status } = useSession();
  const loggedIn = status == "authenticated";
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    info: "",
    season: "",
    draftSize: 3,
    teamSize: 2,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSeasonClick = (season: string) => {
    setForm({ ...form, season });
    console.log("Season changed", season);
  };

  const onCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/league", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          info: form.info,
          createdBy: session?.user.id,
          members: session?.user.id,
          settings: {
            season: form.season,
            draftSize: Number(form.draftSize) || 3,
            teamSize: Number(form.teamSize) || 2,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("League created:", data);
        console.log("Redirecting to /league/", data.league._id);
        router.push(`/league/${data.league._id}`);
      } else {
        const error = await res.json();
        console.error("Create failed:", error);
      }
    } catch (err) {
      console.log("Failed to create League", err);
    }
  };

  return (
    <div>
      {loggedIn ? (
        <div className="create-league-page">
          <div className="league-header">
            <h2>Create a League</h2>
          </div>

          <form className="create-league-form">
            <div className="label-row">
              <label htmlFor="name">League Name</label>
              <Information info="name" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="League Name"
              onChange={handleChange}
            />

            <div className="label-row">
              <label htmlFor="info">League Info</label>
              <Information info="info" />
            </div>
            <textarea
              id="info"
              name="info"
              placeholder="Tell us more about your league"
              onChange={handleChange}
            />

            <div className="season-selector">
              <div className="label-row">
                <label>Select a season</label>
                <Information info="season" />
              </div>
              <div className="season-buttons">
                {["Summer 2025", "Oct '25 - April '26"].map((season) => (
                  <button
                    key={season}
                    type="button"
                    className={form.season === season ? "selected" : ""}
                    onClick={() => handleSeasonClick(season)}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <div className="label-row">
              <label htmlFor="teams">Number of Teams</label>
              <Information info="draftSize" />
            </div>
            <input
              type="range"
              id="teams"
              name="draftSize"
              min={3}
              max={5}
              value={form.draftSize}
              onChange={handleChange}
            />
            <span className="slider-value">{form.draftSize}</span>

            <div className="label-row">
              <label htmlFor="movies">Movies per team</label>
              <Information info="teamSize" />
            </div>
            <input
              type="range"
              id="movies"
              name="teamSize"
              min={2}
              max={5}
              value={form.teamSize}
              onChange={handleChange}
            />
            <span className="slider-value">{form.teamSize}</span>

            <button
              onClick={onCreateLeague}
              type="submit"
              className="create-button"
            >
              Create League
            </button>
          </form>

          <button className="back-button" onClick={() => router.push("/")}>
            Back
          </button>
        </div>
      ) : (
        <div className="login-message">
          <p>
            <strong>Please login to create a league!</strong>
          </p>
          <button className="login-btn" onClick={() => router.push("/login")}>
            Login Page
          </button>
        </div>
      )}
    </div>
  );
}
