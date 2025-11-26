import { useState, useMemo } from "react";
import { Upload, Film } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CubeGallery from "@/components/CubeGallery";
import UploadDropzone from "@/components/UploadDropzone";
import MediaGrid from "@/components/MediaGrid";
import ShortsGallery from "@/components/ShortsGallery";
import SearchFilterBar from "@/components/SearchFilterBar";
import DraggableModal from "@/components/DraggableModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Media } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [likedFilter, setLikedFilter] = useState("all");
  const [modalMedia, setModalMedia] = useState<Media | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"gallery" | "shorts">("gallery");

  // Fetch media list
  const { data: mediaList = [], isLoading } = useQuery<Media[]>({
    queryKey: ["/api/media"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const apiBase = import.meta.env.VITE_API_URL || '';
      const url = `${apiBase}/api/media/upload`;
      console.log("Uploading to:", url);
      
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Upload response status:", response.status);
      console.log("Upload response:", responseText);

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status}): ${responseText}`);
      }

      return JSON.parse(responseText);
    },
    onSuccess: (data) => {
      console.log("Upload successful, data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setShowUpload(false);
      toast({
        title: "Upload successful",
        description: `Uploaded ${data.length || 1} file(s)`,
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ id, liked }: { id: number; liked: boolean }) => {
      return await apiRequest("POST", `/api/media/${id}/like`, { liked });
    },
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/media"] });
      const previous = queryClient.getQueryData(["/api/media"]);

      queryClient.setQueryData(["/api/media"], (old: Media[] | undefined) =>
        old?.map((item) => (item.id === id ? { ...item, liked } : item))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/media"], context.previous);
      }
      toast({
        title: "Failed to update",
        description: "Could not update like status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Deleted",
        description: "Media has been deleted",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete media",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (files: File[]) => {
    uploadMutation.mutate(files);
  };

  const handleLike = (id: number) => {
    const media = mediaList.find((m) => m.id === id);
    if (media) {
      likeMutation.mutate({ id, liked: !media.liked });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      return await apiRequest("POST", "/api/media/reorder", { orderedIds });
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["/api/media"] });
      const previous = queryClient.getQueryData(["/api/media"]);

      queryClient.setQueryData(["/api/media"], (old: Media[] | undefined) => {
        if (!old) return old;
        const ordered = orderedIds.map((id) => old.find((m) => m.id === id)).filter(Boolean) as Media[];
        return ordered;
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/media"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
  });

  const handleReorder = (orderedIds: number[]) => {
    reorderMutation.mutate(orderedIds);
  };

  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesSearch = item.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        mediaTypeFilter === "all" || item.mediaType === mediaTypeFilter;
      const matchesLiked =
        likedFilter === "all" ||
        (likedFilter === "liked" && item.liked) ||
        (likedFilter === "unliked" && !item.liked);

      return matchesSearch && matchesType && matchesLiked;
    });
  }, [mediaList, searchQuery, mediaTypeFilter, likedFilter]);

  const cubeImages = useMemo(
    () =>
      mediaList.slice(0, 6).map((m) => ({
        src: m.url,
        alt: m.filename,
      })),
    [mediaList]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If in shorts mode, show shorts gallery
  if (viewMode === "shorts") {
    return (
      <div className="w-full h-screen bg-black flex flex-col">
        {/* Header */}
        <header className="z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="px-6 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-shorts-title">
              Shorts
            </h1>
            <Button
              variant="outline"
              onClick={() => setViewMode("gallery")}
              data-testid="button-gallery-view"
            >
              Gallery
            </Button>
          </div>
        </header>

        {/* Shorts Gallery */}
        <div className="flex-1 overflow-hidden">
          <ShortsGallery
            items={mediaList}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">
            Media Gallery
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={mediaList.some((m) => m.mediaType === "video") ? "outline" : "ghost"}
              size="sm"
              onClick={() => setViewMode("shorts")}
              disabled={!mediaList.some((m) => m.mediaType === "video")}
              data-testid="button-shorts-view"
            >
              <Film className="w-4 h-4 mr-2" />
              Shorts
            </Button>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              data-testid="button-toggle-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cube Gallery */}
        {mediaList.length >= 6 && (
          <section className="mb-12">
            <CubeGallery images={cubeImages} rotate />
          </section>
        )}

        {/* Upload Section */}
        {showUpload && (
          <section className="mb-12 max-w-2xl mx-auto">
            <UploadDropzone onUploaded={handleUpload} />
          </section>
        )}

        {/* Search & Filters */}
        {mediaList.length > 0 && (
          <section className="mb-6">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              mediaTypeFilter={mediaTypeFilter}
              onMediaTypeChange={setMediaTypeFilter}
              likedFilter={likedFilter}
              onLikedFilterChange={setLikedFilter}
            />
          </section>
        )}

        {/* Gallery Grid */}
        <section>
          {mediaList.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Gallery
                {filteredMedia.length !== mediaList.length && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredMedia.length} of {mediaList.length})
                  </span>
                )}
              </h2>
            </div>
          )}

          <MediaGrid
            items={filteredMedia}
            allItems={mediaList}
            onLike={handleLike}
            onDelete={handleDelete}
            onItemClick={setModalMedia}
            onReorder={handleReorder}
          />
        </section>
      </div>

      {/* Modal */}
      {modalMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setModalMedia(null)}
          data-testid="modal-overlay"
        >
          <DraggableModal onClose={() => setModalMedia(null)}>
            {modalMedia.mediaType === "image" ? (
              <img
                src={modalMedia.url}
                alt={modalMedia.filename}
                className="max-h-[75vh] max-w-full mx-auto rounded"
                draggable={false}
              />
            ) : (
              <video
                src={modalMedia.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full mx-auto rounded"
              />
            )}
          </DraggableModal>
        </div>
      )}
    </div>
  );
}
