"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import "./styles.css";

export default function Invite({ leagueId }: { leagueId: string }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [inviteErrors, setInviteErrors] = useState<{ [email: string]: string }>(
    {}
  );

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`/api/search-users?query=${searchTerm}`);
        setSearchResults(res.data.users);
      } catch (err) {
        console.log("Error searching for users", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleInvite = async (email: string) => {
    if (invitedUsers.has(email)) {
      setInviteErrors((prev) => ({
        ...prev,
        [email]: "User has already been invited.",
      }));
      return;
    }

    try {
      await axios.post(`/api/league/${leagueId}/invite`, {
        email,
        leagueId,
      });

      setInvitedUsers((prev) => new Set(prev).add(email));
      setInviteErrors((prev) => ({ ...prev, [email]: "" }));
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Failed to send invite.";
      setInviteErrors((prev) => ({
        ...prev,
        [email]: errorMessage,
      }));
    }
  };

  return (
    <div>
      {!showSearch && (
        <button className="invite-btn" onClick={() => setShowSearch(true)}>
          Invite
        </button>
      )}

      {showSearch && (
        <div>
          <input
            type="text"
            placeholder="Search by email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div>
            {loading ? (
              <p>Searching...</p>
            ) : (
              searchResults.map((user) => (
                <div key={user._id} className="user-result">
                  <span>{user.email}</span>
                  {invitedUsers.has(user.email) ? (
                    <span className="invited-label">Invited</span>
                  ) : (
                    <button
                      className="invite-btn"
                      onClick={() => handleInvite(user.email)}
                    >
                      Invite
                    </button>
                  )}
                  {inviteErrors[user.email] && (
                    <p className="invite-error">{inviteErrors[user.email]}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
