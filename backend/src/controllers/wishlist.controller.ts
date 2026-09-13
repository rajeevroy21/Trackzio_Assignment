
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import * as wishlistService from "../services/wishlist.service.js";

export async function getWishlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.supabase || !req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const data = await wishlistService.listWishlist(
      req.supabase,
      req.user.id,
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.supabase || !req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const movie = req.body;

    if (
      !movie ||
      typeof movie.id !== "number" ||
      typeof movie.title !== "string" ||
      !movie.title.trim()
    ) {
      res.status(400).json({
        success: false,
        error: {
          message:
            "Invalid movie payload. 'id' (number) and 'title' (string) are required.",
          code: "INVALID_BODY",
        },
      });
      return;
    }

    const result = await wishlistService.addToWishlist(
      req.supabase,
      req.user.id,
      movie,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.supabase || !req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const movieId = Number(req.params.movieId);

    if (!Number.isFinite(movieId) || movieId <= 0) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid movie ID",
          code: "INVALID_PARAM",
        },
      });
      return;
    }

    const result = await wishlistService.removeFromWishlist(
      req.supabase,
      movieId,
      req.user.id,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

