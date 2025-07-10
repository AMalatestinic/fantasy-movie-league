import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  releaseDate: Date,
  poster: String,
  movieId: {
    type: String,
    required: true,
    unique: true,
  },
  boxOffice: [
    {
      week: String,
      weekGross: Number,
      totalGross: Number,
    },
  ],
});

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
export default Movie;
