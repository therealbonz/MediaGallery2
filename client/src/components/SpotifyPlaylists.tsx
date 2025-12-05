import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music, ListMusic, Clock, ChevronRight, ExternalLink, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string | null;
  trackCount: number;
  owner: string;
  uri: string;
  externalUrl: string;
}

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  duration: number;
  uri: string;
  addedAt: string;
}

interface PlaylistsData {
  playlists: Playlist[];
}

interface TracksData {
  tracks: Track[];
}

export default function SpotifyPlaylists() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const { data: playlistsData, isLoading: playlistsLoading } = useQuery<PlaylistsData>({
    queryKey: ["/api/spotify/playlists"],
  });

  const { data: tracksData, isLoading: tracksLoading, error: tracksError } = useQuery<TracksData>({
    queryKey: [`/api/spotify/playlists/${selectedPlaylist?.id}/tracks`],
    enabled: !!selectedPlaylist?.id,
  });

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (playlistsLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-3 bg-card/50 animate-pulse">
            <div className="aspect-square bg-muted rounded-md mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!playlistsData || playlistsData.playlists.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ListMusic className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No playlists found</p>
      </Card>
    );
  }

  if (selectedPlaylist) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPlaylist(null)}
            data-testid="button-back-playlists"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4 flex-1">
            {selectedPlaylist.image ? (
              <img
                src={selectedPlaylist.image}
                alt={selectedPlaylist.name}
                className="w-16 h-16 rounded-lg shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-green-900/30 flex items-center justify-center">
                <ListMusic className="w-8 h-8 text-green-500" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">{selectedPlaylist.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedPlaylist.trackCount} tracks
              </p>
            </div>
          </div>

          {selectedPlaylist.externalUrl && (
            <a
              href={selectedPlaylist.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-green-500/20 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-green-500" />
            </a>
          )}
        </div>

        {tracksLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {tracksData?.tracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate transition-colors group"
                  data-testid={`track-item-${track.id}`}
                >
                  {track.albumArtSmall ? (
                    <img
                      src={track.albumArtSmall}
                      alt={track.album}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-green-900/30 flex items-center justify-center">
                      <Music className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artists}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDuration(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {playlistsData.playlists.map((playlist) => (
        <Card
          key={playlist.id}
          className="p-3 bg-card/50 hover-elevate cursor-pointer transition-all group"
          onClick={() => setSelectedPlaylist(playlist)}
          data-testid={`playlist-card-${playlist.id}`}
        >
          <div className="aspect-square rounded-md overflow-hidden mb-3 relative">
            {playlist.image ? (
              <img
                src={playlist.image}
                alt={playlist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center">
                <ListMusic className="w-12 h-12 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ChevronRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          <h4 className="font-semibold text-sm truncate mb-1">{playlist.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {playlist.trackCount} tracks
          </p>
        </Card>
      ))}
    </div>
  );
}
