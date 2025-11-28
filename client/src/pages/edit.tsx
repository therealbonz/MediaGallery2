import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Type, Move, Maximize, Download, Save, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Media } from "@shared/schema";

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export default function EditPage() {
  const [, params] = useRoute("/edit/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(100);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [newText, setNewText] = useState("Your text here");
  const [fontSize, setFontSize] = useState(32);
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial");

  const mediaId = params?.id ? parseInt(params.id) : null;

  const { data: media, isLoading } = useQuery<Media>({
    queryKey: ["/api/media", mediaId],
    enabled: !!mediaId,
  });

  const saveMutation = useMutation({
    mutationFn: async (dataUrl: string) => {
      return apiRequest("POST", `/api/media/${mediaId}/update-image`, { imageData: dataUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media", mediaId] });
      toast({ title: "Image saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save image", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!mediaId) return;
    
    // Fetch media directly to ensure we get the URL
    const fetchMedia = async () => {
      try {
        const response = await fetch(`/api/media/${mediaId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        
        if (data?.url && data.mediaType === "image") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            setOriginalImage(img);
            setImageLoaded(true);
          };
          img.onerror = () => {
            toast({ title: "Failed to load image", variant: "destructive" });
          };
          img.src = data.url;
        }
      } catch (err) {
        toast({ title: "Failed to load image data", variant: "destructive" });
      }
    };
    
    fetchMedia();
  }, [mediaId, toast]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !originalImage) return;

    const scaleFactor = scale / 100;
    const newWidth = Math.round(originalImage.width * scaleFactor);
    const newHeight = Math.round(originalImage.height * scaleFactor);

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    textLayers.forEach((layer) => {
      ctx.font = `${layer.fontSize * scaleFactor}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = "top";

      if (layer.id === selectedLayerId) {
        const metrics = ctx.measureText(layer.text);
        const textHeight = layer.fontSize * scaleFactor;
        ctx.strokeStyle = "#00aaff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(
          layer.x * scaleFactor - 4,
          layer.y * scaleFactor - 4,
          metrics.width + 8,
          textHeight + 8
        );
        ctx.setLineDash([]);
      }

      ctx.fillText(layer.text, layer.x * scaleFactor, layer.y * scaleFactor);
    });
  }, [originalImage, scale, textLayers, selectedLayerId]);

  useEffect(() => {
    if (imageLoaded) {
      renderCanvas();
    }
  }, [imageLoaded, renderCanvas]);

  const addTextLayer = () => {
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: newText,
      x: 50,
      y: 50,
      fontSize,
      color: textColor,
      fontFamily,
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateSelectedLayer = (updates: Partial<TextLayer>) => {
    if (!selectedLayerId) return;
    setTextLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayerId ? { ...layer, ...updates } : layer
      )
    );
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setTextLayers((prev) => prev.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const scaleFactor = scale / 100;

    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.font = `${layer.fontSize * scaleFactor}px ${layer.fontFamily}`;
      const metrics = ctx.measureText(layer.text);
      const textHeight = layer.fontSize * scaleFactor;

      const layerX = layer.x * scaleFactor;
      const layerY = layer.y * scaleFactor;

      if (
        x >= layerX &&
        x <= layerX + metrics.width &&
        y >= layerY &&
        y <= layerY + textHeight
      ) {
        setSelectedLayerId(layer.id);
        setIsDragging(true);
        setDragOffset({ x: x - layerX, y: y - layerY });
        return;
      }
    }

    setSelectedLayerId(null);
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const scaleFactor = scale / 100;
    // Apply inverse scaling to get position in original image coordinates
    const newX = (x - dragOffset.x) / scaleFactor;
    const newY = (y - dragOffset.y) / scaleFactor;

    setTextLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayerId ? { ...layer, x: Math.max(0, newX), y: Math.max(0, newY) } : layer
      )
    );
  }, [isDragging, selectedLayerId, scale, dragOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouseup listener to handle dragging outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    saveMutation.mutate(dataUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `edited-${media?.filename || "image"}.png`;
    link.href = dataUrl;
    link.click();
  };

  const selectedLayer = textLayers.find((l) => l.id === selectedLayerId);

  if (!mediaId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Invalid media ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (media?.mediaType !== "image") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Only images can be edited</p>
        <Button onClick={() => navigate("/")} data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate">
              Edit: {media?.filename}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!imageLoaded}
              data-testid="button-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleSave}
              disabled={!imageLoaded || saveMutation.isPending}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div
            ref={containerRef}
            className="bg-muted/30 rounded-lg p-4 flex items-center justify-center overflow-auto min-h-[500px]"
          >
            {imageLoaded ? (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[70vh] cursor-crosshair shadow-lg"
                style={{ imageRendering: "auto" }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                data-testid="canvas-editor"
              />
            ) : (
              <div className="text-muted-foreground">Loading image...</div>
            )}
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" data-testid="tab-text">
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="resize" data-testid="tab-resize">
                  <Maximize className="w-4 h-4 mr-2" />
                  Resize
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add Text</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text-input">Text</Label>
                      <Input
                        id="text-input"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Enter text..."
                        data-testid="input-new-text"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="font-size">Size: {fontSize}px</Label>
                        <Slider
                          id="font-size"
                          min={12}
                          max={120}
                          step={1}
                          value={[fontSize]}
                          onValueChange={([v]) => setFontSize(v)}
                          data-testid="slider-font-size"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="text-color">Color</Label>
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-9 w-full p-1"
                          data-testid="input-text-color"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="font-family">Font</Label>
                      <select
                        id="font-family"
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        data-testid="select-font-family"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Impact">Impact</option>
                      </select>
                    </div>
                    <Button
                      onClick={addTextLayer}
                      className="w-full"
                      data-testid="button-add-text"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Text Layer
                    </Button>
                  </CardContent>
                </Card>

                {selectedLayer && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Selected Layer</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={deleteSelectedLayer}
                          className="h-6 w-6 text-destructive"
                          data-testid="button-delete-layer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Edit Text</Label>
                        <Input
                          value={selectedLayer.text}
                          onChange={(e) =>
                            updateSelectedLayer({ text: e.target.value })
                          }
                          data-testid="input-edit-text"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Size: {selectedLayer.fontSize}px</Label>
                          <Slider
                            min={12}
                            max={120}
                            step={1}
                            value={[selectedLayer.fontSize]}
                            onValueChange={([v]) =>
                              updateSelectedLayer({ fontSize: v })
                            }
                            data-testid="slider-edit-font-size"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={selectedLayer.color}
                            onChange={(e) =>
                              updateSelectedLayer({ color: e.target.value })
                            }
                            className="h-9 w-full p-1"
                            data-testid="input-edit-color"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Move className="w-3 h-3" />
                        Drag text on canvas to reposition
                      </p>
                    </CardContent>
                  </Card>
                )}

                {textLayers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Text Layers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {textLayers.map((layer) => (
                          <button
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              layer.id === selectedLayerId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover-elevate"
                            }`}
                            data-testid={`layer-${layer.id}`}
                          >
                            {layer.text.substring(0, 20)}
                            {layer.text.length > 20 ? "..." : ""}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resize" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Resize Image</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Scale: {scale}%</Label>
                      <Slider
                        min={10}
                        max={200}
                        step={5}
                        value={[scale]}
                        onValueChange={([v]) => setScale(v)}
                        data-testid="slider-scale"
                      />
                    </div>
                    {originalImage && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Original: {originalImage.width} x {originalImage.height}
                        </p>
                        <p>
                          New: {Math.round(originalImage.width * (scale / 100))} x{" "}
                          {Math.round(originalImage.height * (scale / 100))}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(50)}
                        data-testid="button-scale-50"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(100)}
                        data-testid="button-scale-100"
                      >
                        100%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(150)}
                        data-testid="button-scale-150"
                      >
                        150%
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
