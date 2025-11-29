import { useState } from "react";
import MediaGrid from "../MediaGrid";
import type { Media } from "@shared/schema";

export default function MediaGridExample() {
  const [mockData, setMockData] = useState<Media[]>([
    {
      id: 1,
      filename: "mountain.jpg",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      mediaType: "image",
      liked: false,
      displayOrder: 0,
      userId: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      filename: "nature.jpg",
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
      mediaType: "image",
      liked: true,
      displayOrder: 1,
      userId: null,
      createdAt: new Date(),
    },
    {
      id: 3,
      filename: "forest.jpg",
      url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
      mediaType: "image",
      liked: false,
      displayOrder: 2,
      userId: null,
      createdAt: new Date(),
    },
    {
      id: 4,
      filename: "sunset.jpg",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      mediaType: "image",
      liked: false,
      displayOrder: 3,
      userId: null,
      createdAt: new Date(),
    },
    {
      id: 5,
      filename: "beach.jpg",
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
      mediaType: "image",
      liked: true,
      displayOrder: 4,
      userId: null,
      createdAt: new Date(),
    },
  ]);

  const handleLike = (id: number) => {
    setMockData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  const handleDelete = (id: number) => {
    setMockData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemClick = (media: Media) => {
    console.log("Media clicked:", media);
  };

  return (
    <div className="p-6">
      <MediaGrid
        items={mockData}
        allItems={mockData}
        onLike={handleLike}
        onDelete={handleDelete}
        onItemClick={handleItemClick}
      />
    </div>
  );
}
