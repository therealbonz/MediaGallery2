import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { media } from "@shared/schema";
import { type Media, type InsertMedia } from "@shared/schema";

export interface IStorage {
  getAllMedia(): Promise<Media[]>;
  getMedia(id: number): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  reorderMedia(orderedIds: number[]): Promise<void>;
}

export class DbStorage implements IStorage {
  async getAllMedia(): Promise<Media[]> {
    return await db.select().from(media).orderBy(media.displayOrder, desc(media.createdAt));
  }

  async getMedia(id: number): Promise<Media | undefined> {
    const result = await db.select().from(media).where(eq(media.id, id));
    return result[0];
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const maxOrder = await db.select().from(media).orderBy(desc(media.displayOrder)).limit(1);
    const nextOrder = maxOrder.length > 0 ? maxOrder[0].displayOrder + 1 : 0;
    
    const result = await db.insert(media).values({
      ...insertMedia,
      displayOrder: nextOrder,
    }).returning();
    
    return result[0];
  }

  async updateMedia(id: number, updates: Partial<Media>): Promise<Media | undefined> {
    const result = await db
      .update(media)
      .set(updates)
      .where(eq(media.id, id))
      .returning();
    
    return result[0];
  }

  async deleteMedia(id: number): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id)).returning();
    return result.length > 0;
  }

  async reorderMedia(orderedIds: number[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(media).set({ displayOrder: index }).where(eq(media.id, id))
      )
    );
  }
}

export const storage = new DbStorage();
