import { useEffect, useState, useCallback, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DraggableModalProps {
  children: React.ReactNode;
  onClose: () => void;
  mediaUrl?: string;
  filename?: string;
  mediaType?: "image" | "video";
}

export default function DraggableModal({
  children,
  onClose,
  mediaUrl = "",
  filename = "media",
  mediaType = "image",
}: DraggableModalProps) {
  const { toast } = useToast();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleShare = (platform: string) => {
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${appUrl}?shared=${encodeURIComponent(filename)}`;
    const text = `Check out this ${mediaType} on Media Gallery: ${filename}`;
    let url = "";
    
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied!",
          description: "Share link copied to clipboard",
        });
        return;
    }
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const handleDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;
      setDragging(true);
      setOrigin({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    },
    [pos]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setPos({ x: e.clientX - origin.x, y: e.clientY - origin.y });
    },
    [dragging, origin]
  );

  const handleUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 4));
  }, []);

  const handleReset = useCallback(() => {
    setPos({ x: 0, y: 0 });
    setScale(1);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.2, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.2, 0.5));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "r" || e.key === "R") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleReset]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      data-testid="draggable-modal"
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onWheel={handleWheel}
      onClick={(e) => e.stopPropagation()}
      className="relative select-none bg-card rounded-lg shadow-2xl p-4 border border-border z-50"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
        cursor: dragging ? "grabbing" : "grab",
        transition: dragging ? "none" : "transform 0.1s ease-out",
        maxWidth: "90vw",
        maxHeight: "90vh",
      }}
    >
      <div className="absolute top-3 right-3 flex gap-2 z-[60] pointer-events-auto">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setShowShare(!showShare);
          }}
          data-testid="button-share-media"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={zoomOut}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={zoomIn}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={handleReset}
          data-testid="button-reset-view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={onClose}
          data-testid="button-close-modal"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative">
        {children}
        {showShare && (
          <div
            className="mt-3 bg-background/95 rounded-lg p-3 backdrop-blur-sm border border-border shadow-lg flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleShare("twitter")}
              className="px-3 py-2 text-sm rounded hover:bg-muted text-left"
              title="Share on Twitter"
            >
              Twitter (X)
            </button>
            <button
              onClick={() => handleShare("facebook")}
              className="px-3 py-2 text-sm rounded hover:bg-muted text-left"
              title="Share on Facebook"
            >
              Facebook
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="px-3 py-2 text-sm rounded hover:bg-muted text-left"
              title="Share on LinkedIn"
            >
              LinkedIn
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="px-3 py-2 text-sm rounded hover:bg-muted text-left"
              title="Share on WhatsApp"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare("copy")}
              className="px-3 py-2 text-sm rounded hover:bg-muted text-left flex items-center gap-2"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Link
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 text-xs bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
