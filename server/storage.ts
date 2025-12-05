import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "./db";
import { media, users, comments, reactions, follows } from "@shared/schema";
import { type Media, type InsertMedia, type User, type UpsertUser, type Comment, type InsertComment, type Reaction, type InsertReaction, type Follow, type InsertFollow } from "@shared/schema";

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
  // Reactions
  getMediaReactions(mediaId: number): Promise<(Reaction & { user: User })[]>;
  toggleReaction(mediaId: number, userId: string, emoji: string): Promise<{ added: boolean; reaction?: Reaction }>;
  getUserReaction(mediaId: number, userId: string): Promise<Reaction | undefined>;
  // Follows
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowingFeed(userId: string): Promise<Media[]>;
  getFollowCounts(userId: string): Promise<{ followers: number; following: number }>;
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

  // Reactions methods
  async getMediaReactions(mediaId: number): Promise<(Reaction & { user: User })[]> {
    const result = await db
      .select({
        reaction: reactions,
        user: users,
      })
      .from(reactions)
      .innerJoin(users, eq(reactions.userId, users.id))
      .where(eq(reactions.mediaId, mediaId))
      .orderBy(desc(reactions.createdAt));
    
    return result.map(r => ({ ...r.reaction, user: r.user }));
  }

  async toggleReaction(mediaId: number, userId: string, emoji: string): Promise<{ added: boolean; reaction?: Reaction }> {
    // Check if user already reacted with this emoji
    const existing = await db
      .select()
      .from(reactions)
      .where(and(
        eq(reactions.mediaId, mediaId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji)
      ));
    
    if (existing.length > 0) {
      // Remove the reaction
      await db.delete(reactions).where(eq(reactions.id, existing[0].id));
      return { added: false };
    } else {
      // Add the reaction
      const result = await db.insert(reactions).values({
        mediaId,
        userId,
        emoji,
      }).returning();
      return { added: true, reaction: result[0] };
    }
  }

  async getUserReaction(mediaId: number, userId: string): Promise<Reaction | undefined> {
    const result = await db
      .select()
      .from(reactions)
      .where(and(
        eq(reactions.mediaId, mediaId),
        eq(reactions.userId, userId)
      ));
    return result[0];
  }

  // Follow methods
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    // Check if already following
    const existing = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(follows).values({
      followerId,
      followingId,
    }).returning();
    return result[0];
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .returning();
    return result.length > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map(r => r.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map(r => r.user);
  }

  async getFollowingFeed(userId: string): Promise<Media[]> {
    // Get all users that this user follows
    const following = await this.getFollowing(userId);
    const followingIds = following.map(u => u.id);
    
    if (followingIds.length === 0) {
      return [];
    }
    
    // Get media from followed users
    return await db
      .select()
      .from(media)
      .where(inArray(media.userId, followingIds))
      .orderBy(desc(media.createdAt))
      .limit(50);
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    const following = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    return {
      followers: followers.length,
      following: following.length,
    };
  }
}

export const storage = new DbStorage();
