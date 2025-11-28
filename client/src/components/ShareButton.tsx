import { useState } from "react";
import { Share2, X, Copy, Check, Twitter, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  mediaUrl: string;
  filename: string;
  mediaType: "image" | "video";
}

export default function ShareButton({ mediaUrl, filename, mediaType }: ShareButtonProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${appUrl}?shared=${encodeURIComponent(filename)}`;
  const text = `Check out this ${mediaType} on Media Gallery: ${filename}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
  };

  const handleShare = (platform: string) => {
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
    }
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 rounded-full"
        onClick={() => setShowShare(!showShare)}
        data-testid="button-share-media"
      >
        <Share2 className="w-4 h-4" />
      </Button>

      {showShare && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm"
          onClick={() => setShowShare(false)}
          data-testid="share-modal-overlay"
        >
          <div
            className="bg-card rounded-lg shadow-xl p-6 w-96 max-w-[90vw] border border-border"
            onClick={(e) => e.stopPropagation()}
            data-testid="share-modal"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Share Media</h2>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setShowShare(false)}
                data-testid="button-close-share"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview */}
            <div className="mb-6 p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Preview</p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{text}</p>
                <p className="text-xs text-muted-foreground truncate">{shareUrl}</p>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("twitter")}
                className="gap-2"
                data-testid="button-share-twitter"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("facebook")}
                className="gap-2"
                data-testid="button-share-facebook"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("linkedin")}
                className="gap-2"
                data-testid="button-share-linkedin"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("whatsapp")}
                className="gap-2"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>

            {/* Copy Link */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-2"
              onClick={handleCopyLink}
              data-testid="button-copy-share-link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
