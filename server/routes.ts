import type { Express, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getSpotifyClient, isSpotifyConnected } from "./spotify";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size per file
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

// Multer error handling middleware
function handleMulterError(err: any, _req: any, res: any, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large (max 500MB)" });
    }
    return res.status(400).json({ error: err.message || "File upload error" });
  } else if (err) {
    console.error("Upload error:", err);
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user (avatar, profile info)
  app.post("/api/auth/user/update", isAuthenticated, (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: err.message || "File upload error" });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates: any = {};
      
      // Handle avatar upload
      if (req.file) {
        const base64Data = req.file.buffer.toString("base64");
        const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        updates.profileImageUrl = dataUrl;
      }
      
      // Handle other fields
      if (req.body.firstName) updates.firstName = req.body.firstName;
      if (req.body.lastName) updates.lastName = req.body.lastName;
      if (req.body.email) updates.email = req.body.email;
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get all media (without huge data URLs) - public
  app.get("/api/media", async (_req, res) => {
    try {
      const mediaList = await storage.getAllMedia();
      // Return metadata only, not the huge base64 data URLs
      const metaList = mediaList.map(m => ({
        id: m.id,
        filename: m.filename,
        mediaType: m.mediaType,
        liked: m.liked,
        displayOrder: m.displayOrder,
        userId: m.userId,
        createdAt: m.createdAt,
      }));
      return res.json(metaList);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ error: "Failed to fetch media", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get individual media with data
  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaItem = await storage.getMedia(id);
      
      if (!mediaItem) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      return res.json(mediaItem);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Upload media with multer error handling - requires authentication
  app.post("/api/media/upload", isAuthenticated, upload.array("files", 10), handleMulterError, async (req: any, res: any) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const userId = req.user.claims.sub;
      const uploadedMedia = [];
      
      for (const file of files) {
        try {
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
            userId,
          });
          
          // Return only metadata without huge URLs
          uploadedMedia.push({
            id: newMedia.id,
            filename: newMedia.filename,
            mediaType: newMedia.mediaType,
            liked: newMedia.liked,
            displayOrder: newMedia.displayOrder,
            userId: newMedia.userId,
            createdAt: newMedia.createdAt,
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          // Continue with next file instead of failing entire upload
        }
      }

      if (uploadedMedia.length === 0) {
        return res.status(400).json({ error: "No files were successfully uploaded" });
      }

      return res.json(uploadedMedia);
    } catch (error) {
      console.error("Error uploading media:", error);
      return res.status(500).json({ error: "Failed to upload media", details: error instanceof Error ? error.message : String(error) });
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

  // Update media image (for image editor)
  app.post("/api/media/:id/update-image", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { imageData } = req.body;

      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({ error: "imageData is required" });
      }

      // Validate it's a data URL
      if (!imageData.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image data format" });
      }

      const updated = await storage.updateMedia(id, { url: imageData });

      if (!updated) {
        return res.status(404).json({ error: "Media not found" });
      }

      res.json({
        id: updated.id,
        filename: updated.filename,
        mediaType: updated.mediaType,
        liked: updated.liked,
        displayOrder: updated.displayOrder,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      console.error("Error updating media image:", error);
      res.status(500).json({ error: "Failed to update media image" });
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

  // ============ SPOTIFY ROUTES ============

  // Check Spotify connection status
  app.get("/api/spotify/status", async (_req, res) => {
    try {
      const connected = await isSpotifyConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Get currently playing track
  app.get("/api/spotify/now-playing", async (_req, res) => {
    try {
      const spotify = await getSpotifyClient();
      const playbackState = await spotify.player.getCurrentlyPlayingTrack();
      
      if (!playbackState || !playbackState.item) {
        return res.json({ isPlaying: false, track: null });
      }

      const track = playbackState.item as any;
      res.json({
        isPlaying: playbackState.is_playing,
        track: {
          id: track.id,
          name: track.name,
          artists: track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
          album: track.album?.name || "Unknown Album",
          albumArt: track.album?.images?.[0]?.url || null,
          albumArtSmall: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || null,
          duration: track.duration_ms,
          progress: playbackState.progress_ms,
          uri: track.uri,
          externalUrl: track.external_urls?.spotify,
        },
      });
    } catch (error) {
      console.error("Error fetching now playing:", error instanceof Error ? error.message : error);
      res.json({ isPlaying: false, track: null });
    }
  });

  // Get user's playlists
  app.get("/api/spotify/playlists", async (_req, res) => {
    try {
      const spotify = await getSpotifyClient();
      const playlists = await spotify.currentUser.playlists.playlists(50);
      
      res.json({
        playlists: playlists.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          image: p.images?.[0]?.url || null,
          trackCount: p.tracks?.total || 0,
          owner: p.owner?.display_name || "Unknown",
          uri: p.uri,
          externalUrl: p.external_urls?.spotify,
        })),
      });
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists", playlists: [] });
    }
  });

  // Get playlist tracks with album art
  app.get("/api/spotify/playlists/:id/tracks", async (req, res) => {
    try {
      const spotify = await getSpotifyClient();
      const playlistId = req.params.id;
      const tracks = await spotify.playlists.getPlaylistItems(playlistId, undefined, undefined, 50);
      
      res.json({
        tracks: tracks.items
          .filter((item: any) => item.track)
          .map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
            album: item.track.album?.name || "Unknown Album",
            albumArt: item.track.album?.images?.[0]?.url || null,
            albumArtSmall: item.track.album?.images?.[2]?.url || item.track.album?.images?.[0]?.url || null,
            duration: item.track.duration_ms,
            uri: item.track.uri,
            addedAt: item.added_at,
          })),
      });
    } catch (error) {
      console.error("Error fetching playlist tracks:", error);
      res.status(500).json({ error: "Failed to fetch playlist tracks", tracks: [] });
    }
  });

  // Get recently played tracks
  app.get("/api/spotify/recent", async (_req, res) => {
    try {
      const spotify = await getSpotifyClient();
      const recent = await spotify.player.getRecentlyPlayedTracks(20);
      
      res.json({
        tracks: recent.items.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
          album: item.track.album?.name || "Unknown Album",
          albumArt: item.track.album?.images?.[0]?.url || null,
          albumArtSmall: item.track.album?.images?.[2]?.url || item.track.album?.images?.[0]?.url || null,
          playedAt: item.played_at,
          uri: item.track.uri,
        })),
      });
    } catch (error) {
      console.error("Error fetching recent tracks:", error);
      res.status(500).json({ error: "Failed to fetch recent tracks", tracks: [] });
    }
  });

  // ============ USER ROUTES ============

  // Get all users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user's media
  app.get("/api/users/:userId/media", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userMedia = await storage.getUserMedia(userId);
      
      const metaList = userMedia.map(m => ({
        id: m.id,
        filename: m.filename,
        mediaType: m.mediaType,
        liked: m.liked,
        displayOrder: m.displayOrder,
        userId: m.userId,
        createdAt: m.createdAt,
      }));
      
      res.json(metaList);
    } catch (error) {
      console.error("Error fetching user media:", error);
      res.status(500).json({ error: "Failed to fetch user media" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
