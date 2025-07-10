import "./styles.css";

export default function LandingPage() {
  return (
    <div className="page-container">
      <main className="landing-page">
        <div>
          <h2>Create your own Fantasy Movie League!</h2>
          <p>
            Invite up to 4 other friends where you will each draft a team of
            upcoming movies and compete against each other to see which team of
            movies makes the most money in the box office.
          </p>
        </div>

        <div>
          <h2>Participate in a simulated draft!</h2>
          <p>
            Like other sports fantasy leagues, in the fantasy movie league
            players will participate in a random order snake style draft where
            there will be 5 rounds of picks!
          </p>
        </div>

        <div>
          <h2>Root for your team!</h2>
          <p>
            Watch weekly as teams in your league earn money in the box office
            and see how your team stacks up against the competition.
          </p>
        </div>
      </main>
    </div>
  );
}
