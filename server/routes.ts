import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertMediaSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all media
  app.get("/api/media", async (_req, res) => {
    try {
      const mediaList = await storage.getAllMedia();
      return res.json(mediaList);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ error: "Failed to fetch media", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Upload media
  app.post("/api/media/upload", upload.array("files", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedMedia = [];
      
      for (const file of files) {
        // For now, create data URLs for uploaded files
        // TODO: Replace with object storage integration
        const base64Data = file.buffer.toString("base64");
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
        
        const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
        
        const newMedia = await storage.createMedia({
          filename: file.originalname,
          url: dataUrl,
          mediaType,
          liked: false,
          displayOrder: 0,
        });
        
        uploadedMedia.push(newMedia);
      }

      res.json(uploadedMedia);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // Toggle like status
  app.post("/api/media/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { liked } = req.body;

      const updated = await storage.updateMedia(id, { liked });
      
      if (!updated) {
        return res.status(404).json({ error: "Media not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Delete media
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMedia(id);
      
      if (!success) {
        return res.status(404).json({ error: "Media not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // Reorder media
  app.post("/api/media/reorder", async (req, res) => {
    try {
      const { orderedIds } = req.body;
      
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds must be an array" });
      }

      await storage.reorderMedia(orderedIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering media:", error);
      res.status(500).json({ error: "Failed to reorder media" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
