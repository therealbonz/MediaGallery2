import { type Media, type InsertMedia } from "@shared/schema";

export interface IStorage {
  getAllMedia(): Promise<Media[]>;
  getMedia(id: number): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  reorderMedia(orderedIds: number[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private media: Map<number, Media>;
  private nextId: number;

  constructor() {
    this.media = new Map();
    this.nextId = 1;
  }

  async getAllMedia(): Promise<Media[]> {
    return Array.from(this.media.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  async getMedia(id: number): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = this.nextId++;
    const media: Media = {
      id,
      filename: insertMedia.filename,
      url: insertMedia.url,
      mediaType: insertMedia.mediaType,
      liked: insertMedia.liked ?? false,
      displayOrder: insertMedia.displayOrder ?? 0,
      createdAt: new Date(),
    };
    this.media.set(id, media);
    return media;
  }

  async updateMedia(id: number, updates: Partial<Media>): Promise<Media | undefined> {
    const media = this.media.get(id);
    if (!media) return undefined;

    const updated = { ...media, ...updates };
    this.media.set(id, updated);
    return updated;
  }

  async deleteMedia(id: number): Promise<boolean> {
    return this.media.delete(id);
  }

  async reorderMedia(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const media = this.media.get(id);
      if (media) {
        media.displayOrder = index;
      }
    });
  }
}

export const storage = new MemStorage();
