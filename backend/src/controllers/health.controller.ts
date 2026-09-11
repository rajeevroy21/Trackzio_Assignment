import type { Request, Response } from "express";

export function getHealth(_req: Request, res: Response): void {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
}
