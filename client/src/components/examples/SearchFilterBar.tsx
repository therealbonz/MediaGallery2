import { useState } from "react";
import SearchFilterBar from "../SearchFilterBar";

export default function SearchFilterBarExample() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState("all");
  const [likedFilter, setLikedFilter] = useState("all");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        mediaTypeFilter={mediaType}
        onMediaTypeChange={setMediaType}
        likedFilter={likedFilter}
        onLikedFilterChange={setLikedFilter}
      />
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>Search:</strong> {searchQuery || "None"}
        </p>
        <p className="text-sm">
          <strong>Media Type:</strong> {mediaType}
        </p>
        <p className="text-sm">
          <strong>Liked Filter:</strong> {likedFilter}
        </p>
      </div>
    </div>
  );
}
