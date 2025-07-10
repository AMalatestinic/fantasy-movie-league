"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useRouter } from "next/navigation";
import Invite from "@/components/Invite/Invite";
import { useSession } from "next-auth/react";
import "./styles.css";

export default function League() {
  const router = useRouter();
  const params = useParams();
  const [league, setLeague] = useState<{
    name: string;
    info: string;
    members: { _id: string; username: string; draftedMovies?: any[] }[];
    createdBy: string;
    draftedMovies: any[];
    settings: {
      season: string;
      draftSize: number;
      teamSize: number;
    };
    hasStarted?: boolean;
    hasEnded?: boolean;
  }>({
    name: "",
    info: "",
    members: [{ _id: "", username: "" }],
    createdBy: "",
    draftedMovies: [],
    settings: {
      season: "",
      draftSize: 3,
      teamSize: 2,
    },
    hasStarted: false,
    hasEnded: false,
  });
  const [movies, setMovies] = useState<{
    _id: string;
    title: string;
    poster: string;
    releaseDate: string;
    boxOffice: { week: string; weekGross: number; totalGross: Number }[];
  }>({
    _id: "",
    title: "",
    poster: "",
    releaseDate: "",
    boxOffice: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [boxOffice, setBoxOffice] = useState<{
    [title: string]: { weekGross: number; totalGross: number };
  }>({});
  const [hasDrafted, setHasDrafted] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const leagueId = params.id as string;
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const currentUserId = session?.user?.id;

  function getLastSunday(): string {
    const now = new Date();
    const day = now.getDay(); // Sunday = 0
    const diff = day === 0 ? 0 : day; // days since last Sunday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - diff);
    const yyyy = sunday.getFullYear();
    const mm = String(sunday.getMonth() + 1).padStart(2, "0");
    const dd = String(sunday.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // format like "2025-06-29"
  }

  // Fetch league data by ID
  // If league not found, redirect to create league page
  useEffect(() => {
    const getLeague = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/league/${leagueId}`);
        console.log(res.data);
        if (res.data.draftedMovies && res.data.draftedMovies.length > 0) {
          setHasDrafted(true);
        }
        setLeague(res.data);
      } catch (err) {
        console.log(err);
        router.push("/create-league");
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) getLeague();
  }, [leagueId]);

  useEffect(() => {
    if (league.members && league.members.length > 0) {
      const someoneHasDrafted = league.members.some((member) =>
        member.draftedMovies?.some((m) => m.leagueId === leagueId)
      );
      setHasDrafts(someoneHasDrafted);
    }
  }, [league, leagueId]);

  // Fetch box office data for all drafted movies in this league
  // This will be used to calculate standings
  useEffect(() => {
    const fetchBoxOffice = async () => {
      if (!league.members || league.members.length === 0) return;

      const allMovies = league.members.flatMap((member) =>
        (member.draftedMovies || []).filter((m) => m.leagueId === leagueId)
      );

      // Filter out movies not released yet
      const releasedMovies = allMovies.filter((movie) => {
        const today = new Date();
        const release = new Date(movie.releaseDate); // Ensure `releaseDate` exists
        return release <= today;
      });

      const uniqueTitles = Array.from(
        new Set(releasedMovies.map((m) => m.title))
      );

      if (uniqueTitles.length === 0) return;

      try {
        setLoadingMovies(true);
        const query = uniqueTitles
          .map((title) => `titles=${encodeURIComponent(title)}`)
          .join("&");

        const res = await fetch(`/api/box-office?${query}`);
        const response = await res.json();

        const data: { title: string; weekGross: String; totalGross: String }[] =
          response.movies;

        const targetWeek = getLastSunday();

        const result: {
          [title: string]: { weekGross: number; totalGross: number };
        } = {};

        for (const movie of response.movies) {
          if (movie && movie.title && Array.isArray(movie.boxOffice)) {
            // Find the boxOffice entry for the week you want (e.g., last week)
            const boxEntry = movie.boxOffice.find(
              (entry: any) => entry.week === targetWeek
            );
            if (boxEntry) {
              result[movie.title] = {
                weekGross: boxEntry.weekGross || 0,
                totalGross: boxEntry.totalGross || 0,
              };
            } else {
              result[movie.title] = { weekGross: 0, totalGross: 0 };
            }
          } else {
            console.warn("Missing or invalid boxOffice for:", movie);
          }
        }

        setBoxOffice(result);
        setLoadingMovies(false);
      } catch (err) {
        console.error("Failed to fetch box office:", err);
      }
    };
    fetchBoxOffice();
  }, [league, leagueId]);

  if (loading || status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div className="league-container">
      {loggedIn ? (
        <div className="league-page">
          <div className="league-header">
            <h1 className="league-title">{league.name}</h1>
            <span className="league-season">
              Current Season: {league.settings?.season || "Season Unknown"}
            </span>
            <p className="league-info">{league.info}</p>
          </div>

          <div className="standings">
            <h2 className="standings-title">Standings</h2>
            {loadingMovies ? (
              <p>Loading standings...</p>
            ) : (
              <ul className="standings-list">
                {league.members
                  .map((member) => {
                    const drafted = (member.draftedMovies || []).filter(
                      (movie) => movie.leagueId === leagueId
                    );

                    const totals = drafted.reduce(
                      (acc, movie) => {
                        const weekly = boxOffice[movie.title]?.weekGross || 0;
                        const lifetime =
                          boxOffice[movie.title]?.totalGross || 0;

                        acc.weekGross += weekly;
                        acc.totalGross += lifetime;

                        return acc;
                      },
                      { weekGross: 0, totalGross: 0 }
                    );

                    return { ...member, drafted, totals };
                  })
                  .sort((a, b) => b.totals.totalGross - a.totals.totalGross)
                  .map((member, index) => (
                    <li
                      key={member._id || `member-${index}`}
                      className="standing-item"
                    >
                      <strong>{member.username}</strong>
                      {league.hasStarted ? (
                        <>
                          <br />
                          Weekly: ${member.totals.weekGross.toLocaleString()}
                          <br />
                          Lifetime: ${member.totals.totalGross.toLocaleString()}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            {member.drafted.map((movie, idx) => (
                              <div
                                key={movie._id || movie.id || idx}
                                style={{ textAlign: "center" }}
                              >
                                {movie.poster && (
                                  <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    style={{
                                      width: 60,
                                      height: "auto",
                                      objectFit: "contain",
                                      borderRadius: 4,
                                      border: "1px solid #ccc",
                                      backgroundColor: "#eee",
                                      marginBottom: 2,
                                    }}
                                  />
                                )}
                                <div style={{ fontSize: 12 }}>
                                  {movie.title}
                                </div>
                                <div style={{ fontSize: 11, color: "#666" }}>
                                  Weekly: $
                                  {boxOffice[
                                    movie.title
                                  ]?.weekGross?.toLocaleString() || "0"}
                                  <br />
                                  Lifetime: $
                                  {boxOffice[
                                    movie.title
                                  ]?.totalGross?.toLocaleString() || "0"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <br />
                          {member.drafted.length > 0 ? (
                            <p>Drafted {member.drafted.length} movies</p>
                          ) : (
                            <p>No movies drafted</p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="league-actions">
            <Invite leagueId={leagueId} />
            {currentUserId === league.createdBy && (
              <button
                className="delete-league-btn"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this league?")) {
                    try {
                      await axios.delete(`/api/league/${leagueId}`);
                      router.push(`/profile/${currentUserId}`);
                    } catch (err) {
                      console.error("Failed to delete league:", err);
                      alert("Failed to delete league. Please try again.");
                    }
                  }
                }}
              >
                Delete League
              </button>
            )}
            {currentUserId === league.createdBy && (
              <>
                {!league.hasStarted && hasDrafts && (
                  <button
                    className="start-league-btn"
                    onClick={async () => {
                      try {
                        const res = await axios.patch(
                          `/api/league/${leagueId}`,
                          {
                            hasStarted: true,
                            hasEnded: false,
                          }
                        );
                        setLeague(res.data);
                      } catch (err) {
                        console.error("Failed to start league:", err);
                      }
                    }}
                  >
                    Start League
                  </button>
                )}

                {league.hasStarted && !league.hasEnded && (
                  <button
                    className="end-league-btn"
                    onClick={async () => {
                      try {
                        const res = await axios.patch(
                          `/api/league/${leagueId}`,
                          {
                            hasEnded: true,
                          }
                        );
                        setLeague(res.data);
                      } catch (err) {
                        console.error("Failed to end league:", err);
                      }
                    }}
                  >
                    End League
                  </button>
                )}
              </>
            )}
          </div>

          {!hasDrafted && !league.hasStarted && (
            <button
              className="draft-toggle-btn"
              onClick={() => router.push(`/draft/${leagueId}`)}
            >
              Go to Draft Room
            </button>
          )}
        </div>
      ) : (
        <div className="league-page">
          <h2>Please log in to view this league</h2>
          <button className="login-btn" onClick={() => router.push("/login")}>
            Login
          </button>
        </div>
      )}
    </div>
  );
}
