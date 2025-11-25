import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Heart, Trash2 } from "lucide-react";
import type { Media } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface MediaGridProps {
  items: Media[];
  allItems?: Media[];
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  onItemClick?: (media: Media) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export default function MediaGrid({ items, allItems = items, onLike, onDelete, onItemClick, onReorder }: MediaGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Deterministic span assignment based on media ID
  const spanMap = useMemo(() => {
    const map = new Map<number, number>();
    allItems.forEach((media) => {
      map.set(media.id, (media.id % 3 === 0) ? 2 : 1);
    });
    return map;
  }, [allItems]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Reorder within the currently displayed (filtered) items
    const reorderedItems = [...items];
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Create mapping from ID to new order in the reordered items
    const reorderedIdMap = new Map<number, number>();
    reorderedItems.forEach((item, index) => {
      reorderedIdMap.set(item.id, index);
    });

    // Build full ordering: preserve non-filtered items, update filtered items
    const fullOrdering: number[] = [];
    let reorderedIndex = 0;
    
    for (const item of allItems) {
      if (reorderedIdMap.has(item.id)) {
        // This item was in the filtered set, use the reordered version
        fullOrdering.push(reorderedItems[reorderedIndex].id);
        reorderedIndex++;
      } else {
        // This item was not filtered, keep it in place
        fullOrdering.push(item.id);
      }
    }

    onReorder?.(fullOrdering);
  };

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
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="media-grid">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-[180px]"
          >
            {items.map((media, index) => (
              <Draggable key={media.id} draggableId={String(media.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    data-testid={`media-item-${media.id}`}
                    className={`relative rounded-lg overflow-hidden group cursor-pointer transition-all ${
                      snapshot.isDragging
                        ? "scale-95 shadow-2xl opacity-80 z-50"
                        : "hover:scale-[1.02] shadow-md hover:shadow-xl"
                    }`}
                    style={{
                      gridRow: `span ${spanMap.get(media.id) || 1}`,
                      ...provided.draggableProps.style,
                    }}
                    onClick={() => !snapshot.isDragging && onItemClick?.(media)}
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
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
