// Spotify Integration Helper
// Custom OAuth implementation using user-provided credentials with database persistence

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { db } from "./db";
import { spotifyTokens } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// In-memory cache (loaded from DB on startup)
let cachedTokens: SpotifyTokens | null = null;
let tokensLoaded = false;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'user-library-read',
  'user-library-modify',
  'streaming',
  'user-modify-playback-state',
  'app-remote-control'
].join(' ');

// Load tokens from database
async function loadTokensFromDb(): Promise<SpotifyTokens | null> {
  try {
    const result = await db.select().from(spotifyTokens).orderBy(desc(spotifyTokens.updatedAt)).limit(1);
    if (result.length > 0) {
      const token = result[0];
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt.getTime(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading Spotify tokens from database:", error);
    return null;
  }
}

// Save tokens to database
async function saveTokensToDb(tokens: SpotifyTokens): Promise<void> {
  try {
    // Delete old tokens and insert new ones
    await db.delete(spotifyTokens);
    await db.insert(spotifyTokens).values({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(tokens.expiresAt),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error saving Spotify tokens to database:", error);
  }
}

// Initialize - load tokens from DB
async function ensureTokensLoaded(): Promise<void> {
  if (!tokensLoaded) {
    cachedTokens = await loadTokensFromDb();
    tokensLoaded = true;
    if (cachedTokens) {
      console.log("Loaded Spotify tokens from database");
    }
  }
}

export function getSpotifyAuthUrl(redirectUri: string): string {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('SPOTIFY_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    show_dialog: 'true'
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<SpotifyTokens> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Spotify token exchange failed:', error);
    throw new Error('Failed to exchange authorization code');
  }
  
  const data = await response.json();
  
  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  // Save to both memory cache and database
  cachedTokens = tokens;
  tokensLoaded = true;
  await saveTokensToDb(tokens);
  
  return tokens;
}

async function refreshAccessToken(): Promise<SpotifyTokens> {
  await ensureTokensLoaded();
  
  if (!cachedTokens?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: cachedTokens.refreshToken
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Spotify token refresh failed:', error);
    cachedTokens = null;
    throw new Error('Failed to refresh access token');
  }
  
  const data = await response.json();
  
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || cachedTokens.refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  // Save refreshed tokens to database
  await saveTokensToDb(cachedTokens);
  
  return cachedTokens;
}

async function getValidTokens(): Promise<SpotifyTokens> {
  await ensureTokensLoaded();
  
  if (!cachedTokens) {
    throw new Error('Spotify not connected - please authorize first');
  }
  
  // Refresh if token expires in less than 5 minutes
  if (cachedTokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    console.log('Refreshing Spotify access token...');
    return await refreshAccessToken();
  }
  
  return cachedTokens;
}

export async function getSpotifyClient(): Promise<SpotifyApi> {
  const tokens = await getValidTokens();
  
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('SPOTIFY_CLIENT_ID not configured');
  }
  
  const spotify = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, {
    access_token: tokens.accessToken,
    token_type: "Bearer",
    expires_in: Math.floor((tokens.expiresAt - Date.now()) / 1000),
    refresh_token: tokens.refreshToken,
  });
  
  return spotify;
}

export async function isSpotifyConnected(): Promise<boolean> {
  await ensureTokensLoaded();
  return cachedTokens !== null && cachedTokens.expiresAt > Date.now();
}

export async function disconnectSpotify(): Promise<void> {
  cachedTokens = null;
  tokensLoaded = true;
  try {
    await db.delete(spotifyTokens);
  } catch (error) {
    console.error("Error deleting Spotify tokens:", error);
  }
}

export function hasSpotifyCredentials(): boolean {
  return !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
}
