// Spotify Integration Helper
// Uses Replit Spotify connector for authentication
// Reference: connection:conn_spotify_01KB73DYA5KR9RF87RG6FGHGVA

import { SpotifyApi } from "@spotify/web-api-ts-sdk";

let connectionSettings: any;

interface TokenData {
  accessToken: string;
  clientId: string;
  refreshToken: string;
  expiresIn: number;
}

async function getAccessToken(): Promise<TokenData> {
  // Check if we have valid cached settings with unexpired token
  if (connectionSettings && 
      connectionSettings.settings?.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
    const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
    const expiresIn = connectionSettings?.settings?.oauth?.credentials?.expires_in || 3600;
    
    if (accessToken && clientId && refreshToken) {
      return { accessToken, clientId, refreshToken, expiresIn };
    }
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  // Fetch fresh connection data
  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  connectionSettings = data.items?.[0];
  
  if (!connectionSettings) {
    console.error('Spotify connection not found in response');
    throw new Error('Spotify not connected');
  }
  
  const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = connectionSettings?.settings?.oauth?.credentials?.expires_in || 3600;
  
  if (!accessToken || !clientId || !refreshToken) {
    console.error('Missing Spotify credentials:', { 
      hasAccessToken: !!accessToken, 
      hasClientId: !!clientId, 
      hasRefreshToken: !!refreshToken 
    });
    throw new Error('Spotify not connected - missing credentials');
  }
  
  return { accessToken, clientId, refreshToken, expiresIn };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getSpotifyClient() {
  const { accessToken, clientId, refreshToken, expiresIn } = await getAccessToken();

  const spotify = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });

  return spotify;
}

// Check if Spotify is connected
export async function isSpotifyConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    console.error('Spotify connection check failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

// Force refresh of connection settings (clears cache)
export function clearSpotifyCache() {
  connectionSettings = null;
}
