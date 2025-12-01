// Spotify Integration Helper
// Custom OAuth implementation using user-provided credentials

import { SpotifyApi } from "@spotify/web-api-ts-sdk";

// Token storage (in-memory for now - persists across requests but not restarts)
interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let storedTokens: SpotifyTokens | null = null;

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
  
  storedTokens = tokens;
  return tokens;
}

async function refreshAccessToken(): Promise<SpotifyTokens> {
  if (!storedTokens?.refreshToken) {
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
      refresh_token: storedTokens.refreshToken
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Spotify token refresh failed:', error);
    storedTokens = null;
    throw new Error('Failed to refresh access token');
  }
  
  const data = await response.json();
  
  storedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || storedTokens.refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  return storedTokens;
}

async function getValidTokens(): Promise<SpotifyTokens> {
  if (!storedTokens) {
    throw new Error('Spotify not connected - please authorize first');
  }
  
  // Refresh if token expires in less than 5 minutes
  if (storedTokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    console.log('Refreshing Spotify access token...');
    return await refreshAccessToken();
  }
  
  return storedTokens;
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

export function isSpotifyConnected(): boolean {
  return storedTokens !== null && storedTokens.expiresAt > Date.now();
}

export function disconnectSpotify(): void {
  storedTokens = null;
}

export function hasSpotifyCredentials(): boolean {
  return !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
}
