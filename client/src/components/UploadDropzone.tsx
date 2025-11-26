import { useCallback, useState } from "react";
import { Upload, Image, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadDropzoneProps {
  onUploaded?: () => void;
}

export default function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/")
      );

      if (validFiles.length === 0) {
        setError("Please upload image or video files only");
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append("files", file);
        });

        // Simulate progress while uploading
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += Math.random() * 30;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);
          }
        }, 200);

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error response:", response.status, errorText);
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("Upload successful:", result);

        setProgress(100);
        setUploading(false);

        toast({
          title: "Upload successful",
          description: `Uploaded ${validFiles.length} file(s)`,
        });

        // Call onUploaded callback if provided
        if (onUploaded) {
          try {
            onUploaded();
          } catch (callbackErr) {
            console.error("Error in onUploaded callback:", callbackErr);
          }
        }

        // Reset after a brief delay
        setTimeout(() => {
          setProgress(0);
        }, 500);
      } catch (err) {
        console.error("Upload error:", err);
        setUploading(false);
        setProgress(0);
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);

        toast({
          title: "Upload failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
    [onUploaded, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all
          ${
            isDragging
              ? "border-primary bg-accent/50"
              : error
              ? "border-destructive bg-destructive/5"
              : "border-border bg-card hover-elevate"
          }
        `}
        data-testid="upload-dropzone"
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
          data-testid="input-file-upload"
        />

        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center">
            <p className="text-base font-medium text-foreground">
              {uploading ? "Uploading..." : "Drop files here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports images and videos
            </p>
          </div>

          <div className="flex gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="text-xs">Images</span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              <span className="text-xs">Videos</span>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" data-testid="upload-progress" />
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              data-testid="button-dismiss-error"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
