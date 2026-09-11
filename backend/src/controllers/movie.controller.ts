import type { NextFunction, Request, Response } from "express";
import * as movieService from "../services/movie.service.js";

export async function getMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const genreId = req.query.genre ? Number(req.query.genre) : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const data = await movieService.browseMovies({ page, genreId, sort, minRating, year });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function searchMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const page = req.query.page ? Number(req.query.page) : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

    const data = await movieService.browseMovies({ query, page, sort });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = Number(req.params.movieId);
    if (!Number.isFinite(movieId) || movieId <= 0) {
      res.status(400).json({
        success: false,
        error: { message: "Invalid movie ID", code: "INVALID_PARAM" },
      });
      return;
    }

    const data = await movieService.getMovieDetail(movieId);
    if (!data) {
      res.status(404).json({
        success: false,
        error: { message: "Movie not found", code: "MOVIE_NOT_FOUND" },
      });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getGenres(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await movieService.getGenres();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
