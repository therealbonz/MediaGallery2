import { useState, useMemo } from "react";
import { Upload } from "lucide-react";
import CubeGallery from "@/components/CubeGallery";
import UploadDropzone from "@/components/UploadDropzone";
import MediaGrid from "@/components/MediaGrid";
import SearchFilterBar from "@/components/SearchFilterBar";
import DraggableModal from "@/components/DraggableModal";
import { Button } from "@/components/ui/button";
import type { Media } from "@shared/schema";

export default function Home() {
  // todo: remove mock functionality - replace with real API calls
  const [mediaList, setMediaList] = useState<Media[]>([
    {
      id: 1,
      filename: "mountain-vista.jpg",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      mediaType: "image",
      liked: false,
      displayOrder: 0,
      createdAt: new Date(),
    },
    {
      id: 2,
      filename: "nature-trail.jpg",
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
      mediaType: "image",
      liked: true,
      displayOrder: 1,
      createdAt: new Date(),
    },
    {
      id: 3,
      filename: "forest-path.jpg",
      url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
      mediaType: "image",
      liked: false,
      displayOrder: 2,
      createdAt: new Date(),
    },
    {
      id: 4,
      filename: "sunset-mountains.jpg",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      mediaType: "image",
      liked: false,
      displayOrder: 3,
      createdAt: new Date(),
    },
    {
      id: 5,
      filename: "beach-sunset.jpg",
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
      mediaType: "image",
      liked: true,
      displayOrder: 4,
      createdAt: new Date(),
    },
    {
      id: 6,
      filename: "lake-reflection.jpg",
      url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1",
      mediaType: "image",
      liked: false,
      displayOrder: 5,
      createdAt: new Date(),
    },
    {
      id: 7,
      filename: "ocean-waves.jpg",
      url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0",
      mediaType: "image",
      liked: false,
      displayOrder: 6,
      createdAt: new Date(),
    },
    {
      id: 8,
      filename: "snowy-peaks.jpg",
      url: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
      mediaType: "image",
      liked: true,
      displayOrder: 7,
      createdAt: new Date(),
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [likedFilter, setLikedFilter] = useState("all");
  const [modalMedia, setModalMedia] = useState<Media | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // todo: remove mock functionality
  const handleUpload = (files: File[]) => {
    const newMedia: Media[] = files.map((file, index) => ({
      id: Math.max(...mediaList.map((m) => m.id), 0) + index + 1,
      filename: file.name,
      url: URL.createObjectURL(file),
      mediaType: file.type.startsWith("image/") ? "image" : "video",
      liked: false,
      displayOrder: mediaList.length + index,
      createdAt: new Date(),
    }));
    setMediaList((prev) => [...newMedia, ...prev]);
    setShowUpload(false);
  };

  const handleLike = (id: number) => {
    setMediaList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  const handleDelete = (id: number) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
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
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
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

        {/* Gallery Grid */}
        <section>
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

          <MediaGrid
            items={filteredMedia}
            onLike={handleLike}
            onDelete={handleDelete}
            onItemClick={setModalMedia}
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
