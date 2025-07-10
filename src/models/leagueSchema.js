import mongoose from "mongoose";

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  info: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  moviePool: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
  ],
  draftedMovies: [
    {
      drafter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
      title: { type: String, required: true },
      releaseDate: { type: String, required: true },
      poster: { type: String },
    },
  ],
  settings: {
    draftSize: Number,
    season: String,
    teamSize: Number,
  },
  draftOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentPick: { type: Number, default: 0 },
  draftOpen: { type: Boolean, default: false }, // Indicates if the draft is open
  invitedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  hasStarted: {
    type: Boolean,
    default: false,
  },
  hasEnded: {
    type: Boolean,
    default: false,
  },
});

const League = mongoose.models.League || mongoose.model("League", leagueSchema);
export default League;
