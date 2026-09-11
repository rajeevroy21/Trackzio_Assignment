import type { NextFunction, Request, Response } from "express";
import { TmdbConfigError, TmdbUnavailableError } from "../services/tmdb.service.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  if (err instanceof TmdbConfigError) {
    res.status(503).json({
      success: false,
      error: {
        message: "The movie service is not fully configured.",
        code: "TMDB_CONFIG_ERROR",
      },
    });
    return;
  }

  if (err instanceof TmdbUnavailableError) {
    res.status(503).json({
      success: false,
      error: {
        message: "The movie service is temporarily unavailable. Please try again.",
        code: "TMDB_UNAVAILABLE",
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "An unexpected server error occurred";
  res.status(500).json({
    success: false,
    error: {
      message,
      code: "INTERNAL_SERVER_ERROR",
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: "NOT_FOUND",
    },
  });
}
