import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.string().default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "SUPABASE_PUBLISHABLE_KEY is required"),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  SUPABASE_JWKS_URL: z.string().url("SUPABASE_JWKS_URL must be a valid URL"),
});

export const env = envSchema.parse(process.env);
