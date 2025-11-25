import CubeGallery from "../CubeGallery";

export default function CubeGalleryExample() {
  const sampleImages = [
    { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", alt: "Mountain landscape" },
    { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e", alt: "Nature scene" },
    { src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff", alt: "Forest path" },
    { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470", alt: "Sunset over mountains" },
    { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e", alt: "Beach sunset" },
    { src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1", alt: "Lake reflection" },
  ];

  return <CubeGallery images={sampleImages} rotate={true} />;
}
