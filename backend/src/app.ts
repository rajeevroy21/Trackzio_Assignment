import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";

import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

import healthRoutes from "./routes/health.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const cleanOrigin = origin ? origin.replace(/\/$/, "") : "";
      const cleanFrontendUrl = env.FRONTEND_URL ? env.FRONTEND_URL.replace(/\/$/, "") : "";

      if (
        !origin ||
        cleanOrigin === cleanFrontendUrl ||
        env.NODE_ENV === "development" ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/api", apiLimiter);

app.use("/api", healthRoutes);
app.use("/api", movieRoutes);
app.use("/api", wishlistRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
