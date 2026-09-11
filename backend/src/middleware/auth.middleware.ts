import type { NextFunction, Request, Response } from "express";
import { createAuthenticatedSupabaseClient, supabaseAdmin } from "../config/database.js";
import type { AuthenticatedUser } from "../types/index.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
  supabase?: ReturnType<typeof createAuthenticatedSupabaseClient>;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized: Missing or invalid authorization token", code: "UNAUTHORIZED" },
      });
      return;
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized: Empty token", code: "UNAUTHORIZED" },
      });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized: Invalid or expired session token", code: "INVALID_TOKEN" },
      });
      return;
    }

    req.user = { id: data.user.id, email: data.user.email };
    req.token = token;
    req.supabase = createAuthenticatedSupabaseClient(token);
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
