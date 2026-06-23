import { cn } from "@/lib/utils";
import {
  backgroundToCss,
  FONT_OPTIONS,
  IMAGE_BASE_CQW,
  type DesignState,
  type Layer,
} from "@/lib/studio";

interface CaseArtworkProps {
  design: DesignState;
  /** Currently selected layer (studio only). */
  selectedId?: string | null;
  /** Pointer-down on a layer — used by the studio to start dragging. */
  onLayerPointerDown?: (e: React.PointerEvent, layer: Layer) => void;
  /** Pointer-down on a selected layer's resize handle — starts a scale gesture. */
  onLayerResizePointerDown?: (e: React.PointerEvent, layer: Layer) => void;
  /** Tap empty canvas to deselect. */
  onBackgroundPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}

function fontFamily(id: string): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.family ?? FONT_OPTIONS[0].family;
}

/**
 * Renders a design's background + layers full-bleed inside a CaseSilhouette.
 * Uses container query width units (cqw) so it scales identically in the
 * full-size studio canvas and in tiny list thumbnails.
 */
export function CaseArtwork({
  design,
  selectedId,
  onLayerPointerDown,
  onLayerResizePointerDown,
  onBackgroundPointerDown,
  className,
}: CaseArtworkProps) {
  const interactive = Boolean(onLayerPointerDown);
  const selectedLayer = interactive ? design.layers.find((l) => l.id === selectedId) : undefined;
  // Transparent shows the editor checkerboard while designing, but renders as a
  // genuinely clear surface in thumbnails/previews (no confusing checkerboard).
  const bgCss =
    design.background.type === "transparent" && !interactive
      ? "transparent"
      : backgroundToCss(design.background);
  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{ background: bgCss, containerType: "inline-size" }}
      onPointerDown={onBackgroundPointerDown}
    >
      {design.layers.map((layer) => {
        const selected = interactive && layer.id === selectedId;
        return (
          <div
            key={layer.id}
            onPointerDown={onLayerPointerDown ? (e) => onLayerPointerDown(e, layer) : undefined}
            className={cn(
              "absolute select-none",
              interactive && "cursor-grab active:cursor-grabbing",
            )}
            style={{
              left: `${layer.x * 100}%`,
              top: `${layer.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              touchAction: "none",
            }}
          >
            <div
              className="relative"
              style={{
                outline: selected ? "2px dashed rgba(124,58,237,0.9)" : undefined,
                outlineOffset: "4px",
                borderRadius: "4px",
              }}
            >
              <LayerContent layer={layer} />
            </div>
          </div>
        );
      })}

      {/* Drag-to-resize handle, pinned to the canvas corner so it stays reachable
          even when the selected layer fills or overflows the case. */}
      {selectedLayer && onLayerResizePointerDown && (
        <button
          type="button"
          aria-label="Drag to resize"
          onPointerDown={(e) => {
            e.stopPropagation();
            onLayerResizePointerDown(e, selectedLayer);
          }}
          className="absolute bottom-1.5 right-1.5 z-20 grid h-8 w-8 cursor-nwse-resize place-items-center rounded-full border-2 border-primary bg-white text-primary shadow-lg"
          style={{ touchAction: "none" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 21H3v-6" />
            <path d="M15 3h6v6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function LayerContent({ layer }: { layer: Layer }) {
  if (layer.type === "text") {
    return (
      <span
        style={{
          display: "block",
          whiteSpace: "pre",
          color: layer.color,
          fontFamily: fontFamily(layer.fontId),
          fontWeight: layer.bold ? 800 : 500,
          fontSize: `${layer.scale * 12}cqw`,
          lineHeight: 1.1,
          textShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      >
        {layer.text}
      </span>
    );
  }
  if (layer.type === "sticker") {
    return (
      <span style={{ display: "block", fontSize: `${layer.scale * 20}cqw`, lineHeight: 1 }}>
        {layer.content}
      </span>
    );
  }
  return (
    <img
      src={layer.src}
      alt=""
      draggable={false}
      style={{
        display: "block",
        width: `${layer.scale * IMAGE_BASE_CQW}cqw`,
        maxWidth: "none", // override Tailwind preflight's `img { max-width: 100% }` so scaling works
        height: "auto",
        borderRadius: "6%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    />
  );
}
