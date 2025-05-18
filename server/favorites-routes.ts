import express, { Request, Response } from "express";
import { db } from "./db";
import { favorites } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const favoritesRouter = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

// Get user's favorites
favoritesRouter.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userFavorites = await db
      .select({
        id: favorites.id,
        partId: favorites.partId,
        userId: favorites.userId,
        addedAt: favorites.addedAt
      })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    res.json(userFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Add to favorites
favoritesRouter.post("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { partId } = req.body;
    
    if (!partId) {
      return res.status(400).json({ error: "Part ID is required" });
    }
    
    // Check if already in favorites
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.partId, partId)
      ));
    
    if (existingFavorite.length > 0) {
      return res.status(200).json(existingFavorite[0]);
    }
    
    // Add to favorites
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        partId
      })
      .returning();
    
    res.status(201).json(favorite);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove from favorites
favoritesRouter.delete("/:partId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const partId = parseInt(req.params.partId);
    
    await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.partId, partId)
      ));
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

export default favoritesRouter;