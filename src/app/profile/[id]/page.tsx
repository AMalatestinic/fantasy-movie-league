"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import "./styles.css";
import axios from "axios";

// Defines the League interface
interface League {
  _id: string;
  name: string;
  createdBy: string;
}

export default function Profile() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState({
    username: "",
    image: "",
    leagues: [],
    invites: [],
  });
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<League[]>([]);
  const userId = params?.id;
  console.log(userId);

  useEffect(() => {
    const fetchInvites = async () => {
      const res = await axios.get(`/api/user/${userId}/invites`);
      setInvites(res.data.invites);
    };
    fetchInvites();
  }, []);

  const acceptInvite = async (leagueId: string) => {
    await axios.post(`/api/league/${leagueId}/accept`, { userId });
    setInvites((prev) => prev.filter((l) => l._id !== leagueId));
    // Fetch updated user data so leagues are refreshed
    const res = await axios.get(`/api/profile/${userId}`);
    setUser(res.data);
  };
  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios.get(`/api/profile/${userId}`);
        console.log("User:", res.data);
        console.log("Leagues from API:", res.data.leagues);
        setUser(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) getUser();
  }, [userId]);
  if (loading) return <div>Loading user info...</div>;

  const deleteLeague = async (leagueId: string) => {
    if (!confirm("Are you sure you want to delete this league?")) return;

    try {
      const res = await fetch(`/api/league?leagueId=${leagueId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete league");
      }

      // Remove the league from state
      setUser((prev) => ({
        ...prev,
        leagues: prev.leagues.filter((l: any) => l._id !== leagueId),
      }));
    } catch (err) {
      console.error("Error deleting league:", err);
    }
  };

  return (
    <div>
      <div className="profile-page">
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-picture">
              {user.image ? (
                <img
                  src={user.image}
                  alt={`${user.username}'s profile`}
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture placeholder">No image</div>
              )}
            </div>
            <div className="profile-bio">
              <h2>{user.username}</h2>
              {/* <p>
                Bio of user (example: fav movie, most anticipated movie, etc.)
              </p> */}
            </div>
          </div>

          <div className="user-leagues">
            <h2>{user.username}'s Leagues</h2>
            {user.leagues.length > 0 ? (
              <ul>
                {(user.leagues as League[]).map((league, i) => {
                  console.log(
                    "League createdBy:",
                    league.createdBy,
                    "Current User:",
                    userId
                  );

                  return (
                    <li key={i}>
                      <span>{league.name}</span>
                      <a href={`/league/${league._id}`}>League Page</a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <button
                className="create-league-btn"
                onClick={() => router.push("/create-league")}
              >
                Create a League
              </button>
            )}
          </div>
        </div>

        <div className="league-invites">
          <h2>Invitations</h2>
          {invites.length === 0 && <p>No pending invites</p>}
          {invites.map((league) => (
            <div key={league._id}>
              <span>{league.name}</span>
              <button onClick={() => acceptInvite(league._id)}>Accept</button>
            </div>
          ))}
        </div>

        <button className="back-button" onClick={() => router.push("/")}>
          Back
        </button>
      </div>
    </div>
  );
}
