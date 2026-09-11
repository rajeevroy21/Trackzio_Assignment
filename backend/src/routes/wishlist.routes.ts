import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:movieId", removeFromWishlist);

export default router;
