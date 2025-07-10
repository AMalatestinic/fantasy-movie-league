"use client";

import { useState } from "react";
import "./styles.css";

export default function Information({ info }: { info: string }) {
  const [showInfo, setShowInfo] = useState(false);
  const formInfo: Record<string, string> = {
    name: "Give your league a name",
    info: "Tell us about your league",
    season: "What season will your league be played in?",
    draftSize: "How many players will be participating in your league?",
    teamSize: "How many movies will each team have?",
  };

  const handleClick = () => {
    setShowInfo((prev) => !prev);
  };
  return (
    <div className="information-container">
      {!showInfo && (
        <button onClick={() => handleClick()} className="info-button">
          <strong> i</strong>
        </button>
      )}

      {showInfo && (
        <div className="info-box-wrapper">
          <div className="info-box">
            <p>{formInfo[info] || "No information available."}</p>
            <button onClick={handleClick} className="close-button">
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
