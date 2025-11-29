import { useQuery } from "@tanstack/react-query";
import { Music, Pause, Play, ExternalLink, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  duration: number;
  progress: number;
  uri: string;
  externalUrl: string;
}

interface NowPlayingData {
  isPlaying: boolean;
  track: Track | null;
}

export default function SpotifyNowPlaying() {
  const { data: statusData } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/spotify/status"],
  });

  const { data, isLoading, error } = useQuery<NowPlayingData>({
    queryKey: ["/api/spotify/now-playing"],
    refetchInterval: 5000,
    enabled: statusData?.connected ?? false,
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-900/20 to-black/40 border-green-800/30">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-green-900/30 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-green-900/30 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-green-900/30 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (!statusData?.connected) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-900/20 to-black/40 border-green-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Music className="w-6 h-6" />
            <span className="text-sm">Connect Spotify to see what's playing</span>
          </div>
          <a href="https://accounts.spotify.com/authorize?client_id=your_client_id&response_type=code&redirect_uri=your_redirect_uri&scope=user-read-currently-playing%20user-read-playback-state">
            <Button size="sm" variant="outline" data-testid="button-spotify-login">
              <LogIn className="w-4 h-4 mr-2" />
              Connect Spotify
            </Button>
          </a>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-900/20 to-black/40 border-green-800/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Music className="w-6 h-6" />
          <span className="text-sm">Spotify not available</span>
        </div>
      </Card>
    );
  }

  if (!data.track) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-900/20 to-black/40 border-green-800/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Music className="w-6 h-6 text-green-500" />
          <span className="text-sm">Nothing playing right now</span>
        </div>
      </Card>
    );
  }

  const { track, isPlaying } = data;
  const progressPercent = track.duration > 0 ? (track.progress / track.duration) * 100 : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card 
      className="p-4 bg-gradient-to-br from-green-900/20 to-black/40 border-green-800/30 hover-elevate transition-all"
      data-testid="spotify-now-playing"
    >
      <div className="flex items-center gap-4">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.album}
            className="w-16 h-16 rounded-lg shadow-lg object-cover"
            data-testid="img-album-art"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-green-900/30 flex items-center justify-center">
            <Music className="w-8 h-8 text-green-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isPlaying ? (
              <Play className="w-4 h-4 text-green-500 fill-green-500" />
            ) : (
              <Pause className="w-4 h-4 text-green-500" />
            )}
            <span className="text-xs text-green-500 font-medium uppercase tracking-wide">
              {isPlaying ? "Now Playing" : "Paused"}
            </span>
          </div>
          
          <h3 className="font-semibold text-foreground truncate" data-testid="text-track-name">
            {track.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate" data-testid="text-track-artist">
            {track.artists}
          </p>
          <p className="text-xs text-muted-foreground/70 truncate">
            {track.album}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(track.progress)}</span>
            <Progress value={progressPercent} className="flex-1 h-1" />
            <span className="text-xs text-muted-foreground">{formatTime(track.duration)}</span>
          </div>
        </div>

        {track.externalUrl && (
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-green-500/20 transition-colors"
            data-testid="link-spotify-external"
          >
            <ExternalLink className="w-4 h-4 text-green-500" />
          </a>
        )}
      </div>
    </Card>
  );
}
