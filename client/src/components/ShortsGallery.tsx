import { useState } from "react";
import { ChevronUp, ChevronDown, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Media } from "@shared/schema";

interface ShortsGalleryProps {
  items: Media[];
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ShortsGallery({ items, onLike, onDelete }: ShortsGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videos = items.filter((item) => item.mediaType === "video");

  if (videos.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No videos available</p>
      </div>
    );
  }

  const current = videos[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden" data-testid="shorts-gallery">
      <div className="relative w-full max-w-sm h-screen max-h-screen bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
        {/* Video */}
        <video
          key={current.id}
          src={current.url}
          autoPlay
          controls
          className="w-full h-full object-cover"
          data-testid={`video-short-${current.id}`}
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Video Info */}
        <div className="absolute bottom-20 left-4 right-4 text-white z-10">
          <p className="text-sm font-medium truncate" data-testid={`text-short-filename-${current.id}`}>
            {current.filename}
          </p>
          <p className="text-xs text-white/70">
            {currentIndex + 1} / {videos.length}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-10">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 text-white"
            onClick={() => onLike(current.id)}
            data-testid={`button-like-short-${current.id}`}
          >
            <Heart className={`w-6 h-6 ${current.liked ? "fill-white" : ""}`} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 text-white"
            onClick={() => onDelete(current.id)}
            data-testid={`button-delete-short-${current.id}`}
          >
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Navigation Buttons */}
        {videos.length > 1 && (
          <>
            <Button
              size="icon"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full"
              onClick={handlePrev}
              data-testid="button-prev-short"
            >
              <ChevronUp className="w-6 h-6" />
            </Button>

            <Button
              size="icon"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full"
              onClick={handleNext}
              data-testid="button-next-short"
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
