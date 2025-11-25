import { useState, useMemo } from "react";
import { Upload } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CubeGallery from "@/components/CubeGallery";
import UploadDropzone from "@/components/UploadDropzone";
import MediaGrid from "@/components/MediaGrid";
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

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setShowUpload(false);
      toast({
        title: "Upload successful",
        description: "Your media has been uploaded",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">
            Media Gallery
          </h1>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            data-testid="button-toggle-upload"
            disabled={uploadMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
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
