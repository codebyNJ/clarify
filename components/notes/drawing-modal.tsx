"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Undo2, Trash2, Pen, Eraser } from "lucide-react";

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageDataUrl: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

export function DrawingModal({ isOpen, onClose, onSave }: DrawingModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentWidth, setCurrentWidth] = useState(2);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const colors = [
    "#000000", "#E8613A", "#3B82F6", "#10B981",
    "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280",
  ];
  const widths = [1, 2, 4, 8];

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * (canvas.width / rect.width),
          y: (touch.clientY - rect.top) * (canvas.height / rect.height),
        };
      }

      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    },
    []
  );

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: Stroke | null) => {
      if (!stroke || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.isEraser ? stroke.width * 3 : stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = stroke.isEraser
        ? "destination-out"
        : "source-over";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    },
    []
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => drawStroke(ctx, stroke));
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }
  }, [strokes, drawStroke]);

  useEffect(() => {
    if (isOpen) redrawCanvas();
  }, [isOpen, redrawCanvas]);

  useEffect(() => {
    if (isOpen) {
      setStrokes([]);
      setTool("pen");
      setCurrentColor("#000000");
      setCurrentWidth(2);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 50);
    }
  }, [isOpen]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const point = getCanvasPoint(e);
      if (!point) return;
      setIsDrawing(true);
      currentStrokeRef.current = {
        points: [point],
        color: currentColor,
        width: currentWidth,
        isEraser: tool === "eraser",
      };
    },
    [getCanvasPoint, currentColor, currentWidth, tool]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStrokeRef.current) return;
      const point = getCanvasPoint(e);
      if (!point) return;
      currentStrokeRef.current.points.push(point);
      redrawCanvas();
    },
    [isDrawing, getCanvasPoint, redrawCanvas]
  );

  const handlePointerUp = useCallback(() => {
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setIsDrawing(false);
    if (stroke && stroke.points.length > 1) {
      setStrokes((prev) => [...prev, stroke]);
    }
  }, []);

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setStrokes([]);
    currentStrokeRef.current = null;
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  }, [onSave, onClose, redrawCanvas]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleUndo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[90vw] max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Drawing</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border/50 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setTool("pen")}
              className={`p-1.5 rounded-md transition-colors ${
                tool === "pen"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Pen"
            >
              <Pen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-1.5 rounded-md transition-colors ${
                tool === "eraser"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setCurrentColor(color);
                  setTool("pen");
                }}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  currentColor === color && tool === "pen"
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-1.5">
            {widths.map((w) => (
              <button
                key={w}
                onClick={() => setCurrentWidth(w)}
                className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                  currentWidth === w
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: w + 2, height: w + 2 }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-md hover:bg-muted disabled:opacity-30"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            width={1200}
            height={600}
            className="w-full border border-border rounded-lg cursor-crosshair bg-white"
            style={{ touchAction: "none" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium text-white bg-[#E8613A] hover:bg-[#d4552f] transition-colors rounded-lg"
          >
            Insert Drawing
          </button>
        </div>
      </div>
    </div>
  );
}
