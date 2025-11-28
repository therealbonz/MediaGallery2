import { useRef, useState, useEffect, useMemo } from "react";
import { Droppable } from "@hello-pangea/dnd";

interface InputImage {
  src: string;
  alt?: string;
}

interface CubeGalleryProps {
  images: InputImage[];
  rotate?: boolean;
  onDrop?: (droppedIndex: number) => void;
}

interface Face {
  transform: string;
}

export default function CubeGallery({ images, rotate = true, onDrop }: CubeGalleryProps) {
  const cubeRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0 });

  const [rotationX, setRotationX] = useState(20);
  const [rotationY, setRotationY] = useState(30);
  const [hoverOffset, setHoverOffset] = useState({ x: 0, y: 0 });
  const [cubeSize, setCubeSize] = useState(260);
  const [expanded, setExpanded] = useState<number | null>(null);

  const normalizedImages = useMemo(
    () => images.map((img) => ({ src: img.src, alt: img.alt ?? "image" })),
    [images]
  );

  const selectedImages = useMemo(() => {
    const arr = [...normalizedImages];
    let n = arr.length;
    while (n > 1) {
      n--;
      const i = Math.floor(Math.random() * (n + 1));
      [arr[n], arr[i]] = [arr[i], arr[n]];
    }
    if (arr.length === 0) {
      return Array.from({ length: 6 }, () => ({ src: "", alt: "image" }));
    }
    const out = [] as { src: string; alt: string }[];
    for (let i = 0; i < 6; i++) out.push(arr[i % arr.length]);
    return out;
  }, [normalizedImages]);

  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      if (w < 450) setCubeSize(180);
      else if (w < 800) setCubeSize(220);
      else if (w < 1200) setCubeSize(260);
      else setCubeSize(300);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!rotate) return;
    let frame = 0;
    const animate = () => {
      if (!draggingRef.current) {
        setRotationY((r) => r + 0.18);
      } else {
        setRotationX((r) => r + velocityRef.current.y * 0.95);
        setRotationY((r) => r + velocityRef.current.x * 0.95);
        velocityRef.current.x *= 0.92;
        velocityRef.current.y *= 0.92;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [rotate]);

  const startDrag = (x: number, y: number) => {
    draggingRef.current = true;
    lastMoveRef.current = { x, y };
    document.body.style.touchAction = "none";
  };

  const moveDrag = (x: number, y: number) => {
    if (!draggingRef.current) return;
    const dx = x - lastMoveRef.current.x;
    const dy = y - lastMoveRef.current.y;

    setRotationY((r) => r + dx * 0.6);
    setRotationX((r) => r - dy * 0.6);

    velocityRef.current = { x: dx, y: dy };
    lastMoveRef.current = { x, y };
  };

  const endDrag = () => {
    draggingRef.current = false;
    document.body.style.touchAction = "";
  };

  const handleHover = (clientX: number, clientY: number) => {
    if (draggingRef.current) return;
    const el = cubeRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width - 0.5) * 15;
    const y = ((clientY - r.top) / r.height - 0.5) * -15;
    setHoverOffset({ x, y });
  };

  const half = cubeSize / 2;

  const faces: Face[] = useMemo(
    () => [
      { transform: `rotateY(0deg) translateZ(${half}px)` },
      { transform: `rotateY(90deg) translateZ(${half}px)` },
      { transform: `rotateY(180deg) translateZ(${half}px)` },
      { transform: `rotateY(-90deg) translateZ(${half}px)` },
      { transform: `rotateX(90deg) translateZ(${half}px)` },
      { transform: `rotateX(-90deg) translateZ(${half}px)` },
    ],
    [cubeSize]
  );

  return (
    <Droppable droppableId="cube-gallery" type="CUBE">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`w-full flex justify-center perspective-[1200px] select-none touch-none my-24 rounded-lg transition-colors ${
            snapshot.isDraggingOver ? "bg-muted/50" : ""
          }`}
          style={{
            cursor: draggingRef.current ? "grabbing" : "grab",
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => {
            moveDrag(e.clientX, e.clientY);
            handleHover(e.clientX, e.clientY);
          }}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) startDrag(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) {
              moveDrag(t.clientX, t.clientY);
              handleHover(t.clientX, t.clientY);
            }
          }}
          onTouchEnd={endDrag}
          aria-label="3D rotating image cube gallery"
          role="region"
          data-testid="cube-gallery"
        >
      <div
        ref={cubeRef}
        style={{
          width: cubeSize,
          height: cubeSize,
          position: "relative",
          transformStyle: "preserve-3d",
          transition: draggingRef.current
            ? "none"
            : "transform 0.25s cubic-bezier(.25,.46,.45,.94)",
          transform: `rotateX(${rotationX + hoverOffset.y}deg) rotateY(${rotationY + hoverOffset.x}deg)`,
        }}
      >
        {faces.map((face, i) => {
          const img = selectedImages[i] || { src: "", alt: "image" };
          const isOpen = expanded === i;

          return (
            <button
              key={i}
              type="button"
              data-testid={`cube-face-${i}`}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                transform: `${face.transform}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backfaceVisibility: "hidden" as const,
                transition:
                  "transform 0.35s ease, filter 0.35s ease, box-shadow 0.35s ease",
                transformOrigin: "center",
                filter: isOpen ? "brightness(1.12)" : "brightness(0.96)",
                boxShadow: isOpen
                  ? "0 0 35px rgba(0,0,0,0.6)"
                  : "0 0 18px rgba(0,0,0,0.35)",
                border: "none",
                background: "transparent",
                padding: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(isOpen ? null : i);
              }}
              onMouseEnter={() => !draggingRef.current && setExpanded(i)}
              onMouseLeave={() => setExpanded(null)}
              aria-pressed={isOpen}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                }}
                style={{
                  width: isOpen ? "85%" : "65%",
                  height: isOpen ? "85%" : "65%",
                  objectFit: "cover",
                  borderRadius: 18,
                  pointerEvents: "none",
                  transition: "all 0.35s ease",
                }}
              />
            </button>
          );
        })}
      </div>
      {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
