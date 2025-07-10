"use client";
import "./styles.css";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Movie {
  id: string;
  title: string;
  poster: string;
  releaseDate: string;
  [key: string]: any;
}

interface DraftedMovie extends Movie {
  drafter: string;
}

export default function Draft() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const { data: session, status } = useSession();
  const loggedIn = status == "authenticated";
  const [league, setLeague] = useState<any>(null);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [draftedMovies, setDraftedMovies] = useState<any[]>([]);
  const [currentPick, setCurrentPick] = useState(0);
  const [teamSize, setTeamSize] = useState(3);
  const [leagueSeason, setLeagueSeason] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const normalizeMovieId = (m: any) => `${m.title}-${m.releaseDate}`;

  const currentUserId = session?.user?.id;
  console.log("Current user ID:", currentUserId);

  const fetchUser = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/user/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  // Fetch league info and initialize draft order if needed
  useEffect(() => {
    const fetchLeague = async () => {
      setLoading(true);
      const res = await fetch(`/api/league/${leagueId}`);
      const data = await res.json();
      console.log("Fetched league data:", data);
      setLeague(data);
      setMembers(data.members);
      setTeamSize(data.settings?.teamSize || 3);
      setLeagueSeason(data.settings?.season || "Summer");

      if (!data.draftOrder || data.draftOrder.length !== data.members.length) {
        // If no draftOrder, initialize it
        const initRes = await fetch(`/api/league/${leagueId}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initDraft: true }),
        });
        const initData = await initRes.json();
        console.log("Initialized draft order:", initData);
        setDraftOrder(initData.draftOrder);
        setCurrentPick(0);
      } else {
        setDraftOrder(data.draftOrder);
        setCurrentPick(data.currentPick || 0);
        setDraftedMovies(data.draftedMovies || []);
      }
      setLoading(false);
    };
    fetchLeague();
  }, [leagueId]);

  useEffect(() => {
    fetchUser();
  }, [currentUserId]);

  // Fetch movie pool and drafted movies
  useEffect(() => {
    const fetchPool = async () => {
      try {
        let poolUrl = "/api/movies/summer-pool";
        if (leagueSeason === "Oct '25 - April '26") {
          poolUrl = "/api/movies/rest-pool";
        }
        const res = await fetch(poolUrl);
        const data = await res.json();
        setMovies(data.map((m: any) => ({ ...m, id: normalizeMovieId(m) })));
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      }
    };
    const fetchDrafted = async () => {
      try {
        const res = await fetch(`/api/league/${leagueId}/draft`);
        if (res.ok) {
          const data = await res.json();
          setDraftedMovies(
            data.map((m: any) => {
              let id = m.id || m._id || m.tmdb_id || m.imdb_id;
              if (!id) id = `${m.title}-${m.releaseDate}`;
              return { ...m, id: String(id) };
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch drafted movies:", error);
      }
    };
    if (leagueSeason) fetchPool();
    if (leagueId) fetchDrafted();
  }, [leagueId, leagueSeason]);

  // Snake draft logic
  function getCurrentDrafter() {
    if (!draftOrder || draftOrder.length === 0) return null;
    const round = Math.floor(currentPick / draftOrder.length);
    const indexInRound = currentPick % draftOrder.length;
    return round % 2 === 0
      ? draftOrder[indexInRound]
      : draftOrder[draftOrder.length - 1 - indexInRound];
  }

  // Calculate round number
  const roundNumber = draftOrder?.length
    ? Math.floor(currentPick / draftOrder.length) + 1
    : 1;

  // Calculate how many movies the current user has drafted
  const userDraftCount =
    user?.draftedMovies?.filter((m: any) => m.leagueId === leagueId).length ||
    0;

  const canDraft =
    getCurrentDrafter() === currentUserId &&
    userDraftCount < teamSize &&
    draftedMovies.length < draftOrder.length * teamSize;

  // Handle drafting a movie
  const handleDraft = async (movie: DraftedMovie) => {
    if (isDrafting) return;
    setIsDrafting(true);
    if (draftedMovies.find((m) => m.title === movie.title)) return;
    if (!canDraft) return;

    try {
      // Send draft pick to backend (backend handles both league and user update)
      const res = await fetch(`/api/league/${leagueId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie,
          drafter: currentUserId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to draft movie");
      }

      // Expect backend to return updated league and user
      const { league: leagueData, user: userData } = await res.json();

      setLeague(leagueData);
      setDraftOrder(leagueData.draftOrder);
      setCurrentPick(leagueData.currentPick || 0);
      setDraftedMovies(leagueData.draftedMovies || []);
      setUser(userData); // update user with new draftedMovies
      setIsDrafting(false);
      console.log("Draft successful!");
    } catch (err) {
      console.error("Draft error:", err);
      setIsDrafting(false);
    }
  };

  const handleEndDraft = async () => {
    await fetch(`/api/league/${leagueId}/toggle-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: false }),
    });
    router.push(`/league/${leagueId}`);
  };

  const leagueDraftedMovies = league?.draftedMovies || [];
  console.log("League drafted movies:", leagueDraftedMovies);

  // Helper to check if a movie is drafted in this league
  const isDrafted = (movie: Movie | DraftedMovie): boolean =>
    leagueDraftedMovies.some(
      (m: any) =>
        m.movieId?.toString?.() === movie._id?.toString?.() ||
        (m.title === movie.title && m.releaseDate === movie.releaseDate)
    );

  const availableMovies = movies.filter((movie) => !isDrafted(movie));
  console.log("Available movies:", availableMovies);

  if (loading) return <div>Loading...</div>;

  //can eventually make this seperate component
  if (!loggedIn) {
    return (
      <div className="login-message">
        <p>
          <strong>Please login to view page</strong>
        </p>
        <button className="login-btn" onClick={() => router.push("/login")}>
          Login Page
        </button>
      </div>
    );
  }

  if (!members.some((member) => member._id === currentUserId)) {
    return (
      <div className="not-in-league-message">
        <p>
          <strong>You are not part of this league</strong>
        </p>
        <button
          className="profile-btn"
          onClick={() => router.push(`/profile/${currentUserId}`)}
        >
          Your Profile
        </button>
      </div>
    );
  }

  if (!league?.draftOpen) {
    return (
      <div>
        <div className="draft-closed-message">
          <h2>Draft Room Closed</h2>
          <p>
            The draft room is currently closed. Please wait for the league owner
            to open it.
          </p>
          {currentUserId === league.createdBy && (
            <button
              className="open-draft-btn"
              onClick={async () => {
                await fetch(`/api/league/${leagueId}/toggle-draft`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ open: !league.draftOpen }),
                });
                // Refetch league info to update UI
                const res = await fetch(`/api/league/${leagueId}`);
                const data = await res.json();
                setLeague(data);
              }}
            >
              {league.draftOpen ? "Close Draft Room" : "Open Draft Room"}
            </button>
          )}
        </div>
      </div>
    );
  }

  console.log("League data:", league);

  return (
    <div>
      <div className="draft-container">
        <div className="draft-info">
          <div className="draft-order">
            <h2>Draft Order</h2>
            <ol>
              {Array.isArray(draftOrder) &&
                draftOrder.map((memberId, idx) => {
                  const member = members.find((m) => m._id === memberId);
                  return (
                    <li key={memberId}>
                      {member?.username || memberId}
                      {getCurrentDrafter() === memberId && " ← On the clock"}
                    </li>
                  );
                })}
            </ol>
            <div className="round-number">Round {roundNumber}</div>
          </div>
        </div>

        {league?.draftOpen && currentUserId === league?.createdBy && (
          <div className="flex justify-end mb-4">
            <button onClick={handleEndDraft} className="end-draft-btn">
              End Draft
            </button>
          </div>
        )}

        <div className="draft-body">
          {/* Drafted Movies Section */}
          <section className="drafted-movies">
            <h3>Your Drafted Movies</h3>
            <div className="movie-grid">
              {user &&
                user.draftedMovies &&
                user.draftedMovies.filter(
                  (movie: any) => movie.leagueId === leagueId
                ).length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No movies drafted yet.
                  </p>
                )}
              {user &&
                user.draftedMovies &&
                user.draftedMovies
                  .filter((movie: any) => movie.leagueId === leagueId)
                  .map((movie: any) => (
                    <div key={movie.id || movie._id} className="movie-card">
                      <img src={movie.poster} alt={movie.title} />
                      <p>{movie.title}</p>
                    </div>
                  ))}
            </div>
          </section>

          {/* Available Movies Section */}
          {userDraftCount < teamSize && (
            <section className="available-movies">
              <h3>Available Movies</h3>
              <div className="movie-grid large">
                {availableMovies.length === 0 && (
                  <p className="text-gray-500 text-sm">All movies drafted.</p>
                )}
                {availableMovies.map((movie, idx) => (
                  <div
                    key={
                      movie.id ||
                      movie._id ||
                      `${movie.title}-${movie.releaseDate}` ||
                      idx
                    }
                    className="movie-card"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full rounded mb-1"
                    />
                    <p className="text-sm">{movie.title}</p>
                    {/* Only show Draft button if user can draft and hasn't filled their team */}
                    {canDraft ? (
                      <button
                        onClick={() =>
                          handleDraft({
                            ...movie,
                            drafter: getCurrentDrafter() || "",
                          })
                        }
                      >
                        Draft
                      </button>
                    ) : (
                      <button
                        disabled={isDrafting}
                        className="mt-1 text-xs px-2 py-1 bg-gray-400 text-white rounded cursor-not-allowed"
                        title="Wait for your turn"
                      >
                        Draft
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* If user's team is full, show a message */}
          {userDraftCount >= teamSize && (
            <div>
              <p className="text-green-700 text-sm mt-2">
                <strong>Your team is full. You can't draft more movies!</strong>
              </p>
              <button
                className="league-page-btn"
                onClick={() => router.push(`/league/${leagueId}`)}
              >
                Go to League Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
