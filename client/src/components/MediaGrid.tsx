import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import type { Media } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface MediaGridProps {
  items: Media[];
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  onItemClick?: (media: Media) => void;
}

export default function MediaGrid({ items, onLike, onDelete, onItemClick }: MediaGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground mb-1">No media yet</p>
        <p className="text-sm text-muted-foreground">Upload some images or videos to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-[180px]">
      {items.map((media) => (
        <div
          key={media.id}
          data-testid={`media-item-${media.id}`}
          className="relative rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] shadow-md hover:shadow-xl"
          style={{
            gridRow: Math.random() > 0.5 ? "span 2" : "span 1",
          }}
          onClick={() => onItemClick?.(media)}
          onMouseEnter={() => setHoveredId(media.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {media.mediaType === "image" ? (
            <img
              src={media.url}
              alt={media.filename}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <video
              src={media.url}
              className="object-cover w-full h-full"
              muted
              loop
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              className={`h-8 w-8 rounded-full transition-all ${
                media.liked
                  ? "bg-destructive text-destructive-foreground scale-110"
                  : "bg-background/90 text-destructive hover:bg-background"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(media.id);
              }}
              data-testid={`button-like-${media.id}`}
            >
              <Heart className={`w-4 h-4 ${media.liked ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(media.id);
              }}
              data-testid={`button-delete-${media.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {hoveredId === media.id && (
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs text-white font-medium truncate bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                {media.filename}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
