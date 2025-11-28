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
      <div className="absolute top-3 right-3 flex gap-2 z-[60]">
        {showShare ? (
          <div className="flex gap-2 bg-background/90 rounded-lg p-2 backdrop-blur-sm border border-border">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleShare("twitter")}
              title="Share on Twitter"
              data-testid="button-share-twitter"
            >
              <span className="text-xs font-bold">X</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleShare("facebook")}
              title="Share on Facebook"
              data-testid="button-share-facebook"
            >
              <span className="text-xs font-bold">f</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleShare("linkedin")}
              title="Share on LinkedIn"
              data-testid="button-share-linkedin"
            >
              <span className="text-xs font-bold">in</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleShare("whatsapp")}
              title="Share on WhatsApp"
              data-testid="button-share-whatsapp"
            >
              <span className="text-xs font-bold">W</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleShare("copy")}
              title="Copy link"
              data-testid="button-copy-link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowShare(false)}
              data-testid="button-close-share"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowShare(true);
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
          </>
        )}
      </div>

      {children}

      <div className="absolute bottom-3 right-3 text-xs bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
