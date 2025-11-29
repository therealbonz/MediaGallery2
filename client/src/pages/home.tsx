import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Upload, Film, LogIn, LogOut, User, Pencil, Menu, X, RefreshCw, Share2, ChevronLeft, ChevronRight, Music, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import CubeGallery from "@/components/CubeGallery";
import UploadDropzone from "@/components/UploadDropzone";
import MediaGrid from "@/components/MediaGrid";
import ShortsGallery from "@/components/ShortsGallery";
import SearchFilterBar from "@/components/SearchFilterBar";
import SpotifyNowPlaying from "@/components/SpotifyNowPlaying";
import SpotifyPlaylists from "@/components/SpotifyPlaylists";
import SpotifyAlbumArt from "@/components/SpotifyAlbumArt";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InstallButton } from "@/components/PWAComponents";
import type { Media } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [likedFilter, setLikedFilter] = useState("all");
  const [modalMedia, setModalMedia] = useState<Media | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"gallery" | "shorts">("gallery");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownDistance, setPullDownDistance] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [spotifyOpen, setSpotifyOpen] = useState(true);
  const touchStartRef = useRef(0);
  const cubeRefreshKeyRef = useRef(0);
  const ITEMS_PER_PAGE = 25;

  // Check if Spotify is connected
  const { data: spotifyStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/spotify/status"],
  });

  useEffect(() => {
    if (modalMedia) {
      console.log("Modal opened with media:", modalMedia.id);
    }
  }, [modalMedia]);

  const handleShare = (platform: string) => {
    if (!modalMedia) return;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${appUrl}?shared=${encodeURIComponent(modalMedia.filename)}`;
    const text = `Check out this ${modalMedia.mediaType} on Media Gallery: ${modalMedia.filename}`;
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

  // Fetch media list (metadata only)
  const { data: mediaMetadata = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/media"],
  });

  // Fetch full media (with URLs) for modal and display
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  
  // Load full media data when needed
  const loadFullMediaData = async () => {
    if (mediaMetadata.length === 0) {
      setIsLoadingMedia(false);
      return;
    }
    setIsLoadingMedia(true);
    const fullData: Media[] = [];
    for (const meta of mediaMetadata) {
      try {
        const response = await fetch(`/api/media/${meta.id}`);
        if (response.ok) {
          fullData.push(await response.json());
        }
      } catch (err) {
        console.error(`Failed to load media ${meta.id}:`, err);
      }
    }
    setMediaList(fullData);
    setIsLoadingMedia(false);
  };

  // Load full data when metadata changes
  useEffect(() => {
    if (mediaMetadata.length > 0 && mediaList.length === 0) {
      loadFullMediaData();
    } else if (mediaMetadata.length === 0 && !isLoading) {
      setIsLoadingMedia(false);
    }
  }, [mediaMetadata, mediaList.length, isLoading]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);


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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setMediaList([]);
      await loadFullMediaData();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setMediaList([]);
      await loadFullMediaData();
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

  const handleUpload = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    await queryClient.refetchQueries({ queryKey: ["/api/media"] });
    setMediaList([]);
    setShowUpload(false);
    // Reload full media data after a brief delay to ensure query updated
    setTimeout(() => {
      loadFullMediaData();
    }, 100);
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
    onError: () => {
      // On error, refetch to restore correct order
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
  });

  const handleReorder = (orderedIds: number[]) => {
    // Update local state immediately for live visual feedback
    const reorderedList = orderedIds.map(id => mediaList.find(m => m.id === id)).filter(Boolean) as Media[];
    setMediaList(reorderedList);
    
    // Then send to server
    reorderMutation.mutate(orderedIds);
  };

  const handleCubeDropped = (draggedMediaId: number) => {
    const newOrder = [
      draggedMediaId,
      ...mediaList.map((m) => m.id).filter((id) => id !== draggedMediaId),
    ];
    reorderMutation.mutate(newOrder);
    cubeRefreshKeyRef.current += 1;
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    setMediaList([]);
    await loadFullMediaData();
    cubeRefreshKeyRef.current += 1;
    setIsRefreshing(false);
    setPullDownDistance(0);
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartRef.current = e.touches[0]?.clientY || 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartRef.current > 0) {
        const currentY = e.touches[0]?.clientY || 0;
        const distance = Math.max(0, currentY - touchStartRef.current);
        setPullDownDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDownDistance > 60) {
        handlePullToRefresh();
      }
      setPullDownDistance(0);
      touchStartRef.current = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDownDistance]);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);
  const paginatedMedia = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedia.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredMedia, currentPage, ITEMS_PER_PAGE]);

  const cubeImages = useMemo(
    () =>
      paginatedMedia.slice(0, 6).map((m) => ({
        src: m.url,
        alt: m.filename,
      })),
    [paginatedMedia]
  );

  if (isLoading || isLoadingMedia) {
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
      {/* Pull-to-Refresh Indicator */}
      {pullDownDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 h-12 flex items-center justify-center z-50 bg-gradient-to-b from-background to-transparent transition-all"
          style={{ opacity: Math.min(pullDownDistance / 100, 1) }}
          data-testid="pull-refresh-indicator"
        >
          <RefreshCw
            className={`w-5 h-5 text-muted-foreground ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: `rotate(${Math.min(pullDownDistance * 3.6, 360)}deg)`,
              transition: isRefreshing ? "none" : "transform 0.2s ease-out",
            }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <button 
            onClick={() => setCurrentPage(1)}
            className="text-xl sm:text-2xl font-bold text-foreground hover-elevate transition-opacity"
            data-testid="button-home-link"
          >
            Media Gallery
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <InstallButton />
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
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => setShowUpload(!showUpload)}
                  data-testid="button-toggle-upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <div className="flex items-center gap-2 ml-2">
                  <Link href="/profile">
                    <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = "/api/logout"}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login to Upload
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Button
                size="icon"
                onClick={() => setShowUpload(!showUpload)}
                data-testid="button-toggle-upload-mobile"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-2">
              <InstallButton />
              <Button
                variant={mediaList.some((m) => m.mediaType === "video") ? "outline" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => { setViewMode("shorts"); setMobileMenuOpen(false); }}
                disabled={!mediaList.some((m) => m.mediaType === "video")}
                data-testid="button-shorts-view-mobile"
              >
                <Film className="w-4 h-4 mr-2" />
                Shorts
              </Button>
              {isAuthenticated ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/api/logout"}
                    data-testid="button-logout-mobile"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-login-mobile"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Upload
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Cube Gallery - Hidden on small screens */}
        {mediaList.length >= 6 && (
          <section className="mb-8 sm:mb-12 hidden sm:block" key={`cube-${cubeRefreshKeyRef.current}`}>
            <DragDropContext onDragEnd={(result: DropResult) => {
              if (result.destination?.droppableId === "cube-gallery" && result.source.droppableId === "media-grid") {
                const draggedMedia = filteredMedia[result.source.index];
                if (draggedMedia) {
                  handleCubeDropped(draggedMedia.id);
                }
              } else if (result.destination?.droppableId === "media-grid" && result.source.droppableId === "media-grid") {
                const reorderedItems = [...filteredMedia];
                const [removed] = reorderedItems.splice(result.source.index, 1);
                reorderedItems.splice(result.destination.index, 0, removed);
                const fullOrdering: number[] = [];
                let reorderedIndex = 0;
                for (const item of mediaList) {
                  if (reorderedItems.some((r) => r.id === item.id) && reorderedIndex < reorderedItems.length) {
                    fullOrdering.push(reorderedItems[reorderedIndex].id);
                    reorderedIndex++;
                  } else if (!filteredMedia.some((f) => f.id === item.id)) {
                    fullOrdering.push(item.id);
                  }
                }
                handleReorder(fullOrdering);
              }
            }}>
              <CubeGallery images={cubeImages} rotate onDrop={handleCubeDropped} />
            </DragDropContext>
          </section>
        )}

        {/* Upload Section */}
        {showUpload && (
          <section className="mb-12 max-w-2xl mx-auto">
            <UploadDropzone onUploaded={handleUpload} />
          </section>
        )}

        {/* Spotify Section */}
        {spotifyStatus?.connected && (
          <section className="mb-8">
            <Collapsible open={spotifyOpen} onOpenChange={setSpotifyOpen}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-foreground">Spotify</h2>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-toggle-spotify">
                    {spotifyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent>
                <div className="space-y-6">
                  {/* Now Playing */}
                  <div>
                    <SpotifyNowPlaying />
                  </div>

                  {/* Tabs for Playlists and Album Art */}
                  <Tabs defaultValue="albums" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="albums" data-testid="tab-album-art">Recent Albums</TabsTrigger>
                      <TabsTrigger value="playlists" data-testid="tab-playlists">Playlists</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="albums">
                      <SpotifyAlbumArt />
                    </TabsContent>
                    
                    <TabsContent value="playlists">
                      <SpotifyPlaylists />
                    </TabsContent>
                  </Tabs>
                </div>
              </CollapsibleContent>
            </Collapsible>
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

          <DragDropContext onDragEnd={(result: DropResult) => {
            if (result.destination?.droppableId === "cube-gallery" && result.source.droppableId === "media-grid") {
              const draggedMedia = filteredMedia[result.source.index];
              if (draggedMedia) {
                handleCubeDropped(draggedMedia.id);
              }
            } else if (result.destination?.droppableId === "media-grid" && result.source.droppableId === "media-grid") {
              // Simple approach: reorder all items in mediaList based on the drag within filtered items
              const reorderedItems = [...filteredMedia];
              const [removed] = reorderedItems.splice(result.source.index, 1);
              reorderedItems.splice(result.destination.index, 0, removed);
              
              // Build new order of ALL media by replacing filtered items with their new order
              const newMediaList = mediaList.map(item => {
                const reorderedItem = reorderedItems.find(r => r.id === item.id);
                return reorderedItem || item;
              });
              
              // Get IDs in new order
              const fullOrdering = newMediaList.map(m => m.id);
              console.log("Reordering to:", fullOrdering);
              handleReorder(fullOrdering);
            }
          }}>
            <MediaGrid
              items={paginatedMedia}
              allItems={mediaList}
              onLike={handleLike}
              onDelete={handleDelete}
              onItemClick={setModalMedia}
            />
          </DragDropContext>

          {/* Pagination Controls */}
          {filteredMedia.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Modal using Shadcn Dialog */}
      <Dialog open={!!modalMedia} onOpenChange={(open) => !open && setModalMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 flex flex-col gap-0 border-0">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-white text-lg font-semibold">
              {modalMedia?.filename || "Media Viewer"}
            </h2>
            <div className="flex gap-2">
              <Popover open={showShareMenu} onOpenChange={setShowShareMenu}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-gray-900 border-gray-700 text-white p-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm mb-3">Share this media</h3>
                    
                    {/* Media Preview */}
                    {modalMedia && (
                      <div className="mb-3 rounded overflow-hidden bg-black/50 p-2">
                        {modalMedia.mediaType === "image" ? (
                          <img
                            src={modalMedia.url}
                            alt="preview"
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={modalMedia.url}
                            className="w-full h-24 object-cover rounded"
                          />
                        )}
                      </div>
                    )}

                    {/* Share Options */}
                    <div className="space-y-2">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => {
                          if (modalMedia) {
                            const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                            const shareUrl = `${appUrl}?media=${modalMedia.id}`;
                            navigator.clipboard.writeText(shareUrl).then(() => {
                              toast({ description: "Link copied to clipboard!" });
                              setShowShareMenu(false);
                            }).catch((err) => {
                              console.error("Copy error:", err);
                            });
                          }
                        }}
                        className="w-full px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors text-left"
                        data-testid="button-share-copy"
                      >
                        📋 Copy Link
                      </button>

                      {/* Facebook Share */}
                      <button
                        type="button"
                        onClick={() => {
                          if (modalMedia) {
                            const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                            const shareUrl = `${appUrl}?media=${modalMedia.id}`;
                            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                            window.open(facebookUrl, "_blank", "width=600,height=400");
                            setShowShareMenu(false);
                          }
                        }}
                        className="w-full px-3 py-2 rounded bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm transition-colors text-left font-medium"
                        data-testid="button-share-facebook"
                      >
                        f Share on Facebook
                      </button>

                      {/* Instagram Share */}
                      <button
                        type="button"
                        onClick={() => {
                          if (modalMedia) {
                            const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                            const shareUrl = `${appUrl}?media=${modalMedia.id}`;
                            const instagramUrl = `https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`;
                            window.open(instagramUrl, "_blank", "width=600,height=400");
                            setShowShareMenu(false);
                          }
                        }}
                        className="w-full px-3 py-2 rounded bg-gradient-to-r from-[#833AB4] to-[#FD1D1D] hover:from-[#6F2E92] hover:to-[#E1118F] text-white text-sm transition-colors text-left font-medium"
                        data-testid="button-share-instagram"
                      >
                        📷 Share on Instagram
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => {
                  console.log("Edit clicked");
                  if (modalMedia) {
                    navigate(`/edit/${modalMedia.id}`);
                    setModalMedia(null);
                  }
                }}
                className="p-2 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                data-testid="button-edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center flex-1 overflow-hidden p-4">
            {modalMedia?.mediaType === "image" ? (
              <img
                src={modalMedia?.url}
                alt={modalMedia?.filename}
                className="max-h-[75vh] max-w-full object-contain"
                draggable={false}
              />
            ) : modalMedia?.mediaType === "video" ? (
              <video
                src={modalMedia?.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
