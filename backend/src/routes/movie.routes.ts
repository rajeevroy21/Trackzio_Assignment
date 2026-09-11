import { Router } from "express";
import { getGenres, getMovieById, getMovies, searchMovies } from "../controllers/movie.controller.js";

const router = Router();

router.get("/movies", getMovies);
router.get("/movies/search", searchMovies);
router.get("/movies/:movieId", getMovieById);
router.get("/genres", getGenres);

export default router;
