import { useQuery } from "@tanstack/react-query";
import { Music, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  playedAt: string;
  uri: string;
}

interface RecentData {
  tracks: Track[];
}

interface SpotifyAlbumArtProps {
  onImageClick?: (imageUrl: string, trackName: string) => void;
}

export default function SpotifyAlbumArt({ onImageClick }: SpotifyAlbumArtProps) {
  const { data, isLoading, error } = useQuery<RecentData>({
    queryKey: ["/api/spotify/recent"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data || data.tracks.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Music className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recent tracks</p>
      </Card>
    );
  }

  const uniqueAlbums = data.tracks.reduce((acc: Track[], track) => {
    if (!acc.find(t => t.album === track.album)) {
      acc.push(track);
    }
    return acc;
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {uniqueAlbums.slice(0, 16).map((track, index) => (
        <div
          key={`${track.id}-${index}`}
          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-elevate"
          onClick={() => track.albumArt && onImageClick?.(track.albumArt, track.name)}
          data-testid={`album-art-${track.id}`}
        >
          {track.albumArt ? (
            <img
              src={track.albumArt}
              alt={track.album}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center">
              <Music className="w-8 h-8 text-white/80" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p className="text-white text-xs font-medium truncate">{track.name}</p>
              <p className="text-white/70 text-xs truncate">{track.artists}</p>
              <div className="flex items-center gap-1 text-white/50 text-xs mt-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(track.playedAt)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
