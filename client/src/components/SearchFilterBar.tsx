import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mediaTypeFilter: string;
  onMediaTypeChange: (type: string) => void;
  likedFilter: string;
  onLikedFilterChange: (filter: string) => void;
}

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  mediaTypeFilter,
  onMediaTypeChange,
  likedFilter,
  onLikedFilterChange,
}: SearchFilterBarProps) {
  const hasActiveFilters = mediaTypeFilter !== "all" || likedFilter !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <div className="flex gap-2">
        <Select value={mediaTypeFilter} onValueChange={onMediaTypeChange}>
          <SelectTrigger className="w-[140px]" data-testid="select-media-type">
            <SelectValue placeholder="Media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={likedFilter} onValueChange={onLikedFilterChange}>
          <SelectTrigger className="w-[140px]" data-testid="select-liked-filter">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All media</SelectItem>
            <SelectItem value="liked">Liked only</SelectItem>
            <SelectItem value="unliked">Unliked only</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Badge variant="secondary" className="px-3 self-center">
            <SlidersHorizontal className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )}
      </div>
    </div>
  );
}
