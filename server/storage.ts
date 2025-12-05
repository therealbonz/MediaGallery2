import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { media, users, comments } from "@shared/schema";
import { type Media, type InsertMedia, type User, type UpsertUser, type Comment, type InsertComment } from "@shared/schema";

export interface IStorage {
  getAllMedia(): Promise<Media[]>;
  getMedia(id: number): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  reorderMedia(orderedIds: number[]): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserMedia(userId: string): Promise<Media[]>;
  getMediaComments(mediaId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(commentId: number): Promise<boolean>;
  findDuplicateMedia(mediaId: number): Promise<Media[]>;
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

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUserMedia(userId: string): Promise<Media[]> {
    return await db
      .select()
      .from(media)
      .where(eq(media.userId, userId))
      .orderBy(media.displayOrder, desc(media.createdAt));
  }

  async getMediaComments(mediaId: number): Promise<(Comment & { user: User })[]> {
    const result = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.mediaId, mediaId))
      .orderBy(desc(comments.createdAt));
    
    return result.map(r => ({ ...r.comment, user: r.user }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async deleteComment(commentId: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, commentId)).returning();
    return result.length > 0;
  }

  async findDuplicateMedia(mediaId: number): Promise<Media[]> {
    const targetMedia = await this.getMedia(mediaId);
    if (!targetMedia) return [];
    
    // Find duplicates by same filename or similar size
    const allMedia = await this.getAllMedia();
    const duplicates = allMedia.filter(m => 
      m.id !== mediaId && 
      m.mediaType === targetMedia.mediaType &&
      m.filename === targetMedia.filename
    );
    
    return duplicates;
  }
}

export const storage = new DbStorage();
