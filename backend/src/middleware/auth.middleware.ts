import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/database.js";
import type { AuthenticatedUser } from "../types/index.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
  supabase?: typeof supabaseAdmin;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: Missing or invalid authorization token",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: Empty token",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    // Support local session tokens
    if (token.startsWith("local_")) {
      const parts = token.split(":");

      const userId =
        parts[1] || "00000000-0000-0000-0000-000000000001";

      const email = parts[2] || "user@example.com";

      req.user = {
        id: userId,
        email,
      };

      req.token = token;

      // Use the admin Supabase client
      req.supabase = supabaseAdmin;

      return next();
    }

    // Validate the user's Supabase access token
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: Invalid or expired session token",
          code: "INVALID_TOKEN",
        },
      });
      return;
    }

    // Store authenticated user
    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    req.token = token;

    // Use the already authenticated admin client
    req.supabase = supabaseAdmin;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unauthorized",
        code: "UNAUTHORIZED",
      },
    });
  }
}

