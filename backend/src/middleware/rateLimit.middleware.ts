import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
});
