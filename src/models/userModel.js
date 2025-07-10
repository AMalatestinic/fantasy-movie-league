import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
  },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: false,
  },
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: "League" }],
  draftedMovies: [
    {
      id: { type: String, required: true },
      movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
      poster: String,
      title: String,
      releaseDate: String,
      leagueId: { type: mongoose.Schema.Types.ObjectId, ref: "League" },
    },
  ],
  image: String,
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: "League" }],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
