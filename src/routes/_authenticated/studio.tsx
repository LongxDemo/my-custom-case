import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bold,
  Copy,
  Eye,
  ImagePlus,
  Palette,
  Redo2,
  ShoppingBag,
  Smartphone,
  Sticker,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  CASE_BASE_PRICE_CENTS,
  FONT_OPTIONS,
  GRADIENT_PRESETS,
  PHONE_MODELS,
  SOLID_SWATCHES,
  STICKERS,
  TEXT_COLORS,
  backgroundToCss,
  cloneDesign,
  createDefaultDesign,
  fileToCompressedDataUrl,
  getModel,
  getTemplate,
  imageFitScale,
  parseDesign,
  uid,
  type DesignState,
  type Layer,
} from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/studio")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { id?: string; model?: string; template?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
    model: typeof search.model === "string" ? search.model : undefined,
    template: typeof search.template === "string" ? search.template : undefined,
  }),
  component: StudioPage,
});

type Tool = "model" | "background" | "text" | "stickers" | "photo";

// --- Undo / redo history -----------------------------------------------------

interface HistState {
  past: DesignState[];
  present: DesignState;
  future: DesignState[];
}
type Updater = DesignState | ((d: DesignState) => DesignState);
type HistAction =
  | { type: "commit"; updater: Updater }
  | { type: "live"; updater: Updater }
  | { type: "checkpoint" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; present: DesignState };

function apply(updater: Updater, present: DesignState): DesignState {
  return typeof updater === "function" ? updater(present) : updater;
}

function historyReducer(s: HistState, a: HistAction): HistState {
  switch (a.type) {
    case "commit": {
      const next = apply(a.updater, s.present);
      if (next === s.present) return s;
      return { past: [...s.past, s.present], present: next, future: [] };
    }
    case "live": {
      const next = apply(a.updater, s.present);
      if (next === s.present) return s;
      return { ...s, present: next };
    }
    case "checkpoint":
      return { past: [...s.past, s.present], present: s.present, future: [] };
    case "undo": {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
    }
    case "redo": {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return { past: [...s.past, s.present], present: next, future: s.future.slice(1) };
    }
    case "reset":
      return { past: [], present: a.present, future: [] };
    default:
      return s;
  }
}

function initialDesign(modelIdParam?: string, templateParam?: string): DesignState {
  if (templateParam) {
    const t = getTemplate(templateParam);
    if (t) return cloneDesign(t.design);
  }
  return createDefaultDesign(modelIdParam);
}

function StudioPage() {
  const { id, model: modelIdParam, template: templateParam } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [hist, dispatch] = useReducer(historyReducer, undefined, () => {
    const present = initialDesign(modelIdParam, templateParam);
    return { past: [], present, future: [] };
  });
  const design = hist.present;
  const canUndo = hist.past.length > 0;
  const canRedo = hist.future.length > 0;

  const setDesign = useCallback((updater: Updater) => dispatch({ type: "commit", updater }), []);
  const setDesignLive = useCallback((updater: Updater) => dispatch({ type: "live", updater }), []);
  const checkpoint = useCallback(() => dispatch({ type: "checkpoint" }), []);

  const gesturing = useRef(false);
  const beginGesture = useCallback(() => {
    if (gesturing.current) return;
    gesturing.current = true;
    checkpoint();
  }, [checkpoint]);
  const endGesture = useCallback(() => {
    gesturing.current = false;
  }, []);

  const [name, setName] = useState(() =>
    templateParam ? (getTemplate(templateParam)?.name ?? "Untitled design") : "Untitled design",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>(templateParam ? "text" : "model");
  const [designId, setDesignId] = useState<string | undefined>(id);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    centerX: number;
    centerY: number;
    startDist: number;
    startScale: number;
    maxScale: number;
  } | null>(null);

  // Load an existing design when editing.
  const { data: existing } = useQuery({
    queryKey: ["design", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("id, name, design_json")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "Untitled design");
      dispatch({ type: "reset", present: parseDesign(existing.design_json) });
      setDesignId(existing.id);
    }
  }, [existing]);

  const model = getModel(design.modelId);
  const selected = design.layers.find((l) => l.id === selectedId) ?? null;

  const patchLayers = (d: DesignState, layerId: string, patch: Partial<Layer>): DesignState => ({
    ...d,
    layers: d.layers.map((l) => (l.id === layerId ? ({ ...l, ...patch } as Layer) : l)),
  });

  /** Committed layer edit (its own undo step). */
  const updateLayer = (layerId: string, patch: Partial<Layer>) =>
    setDesign((d) => patchLayers(d, layerId, patch));

  /** Continuous layer edit during a drag/slider gesture (no per-frame undo step). */
  const updateLayerLive = (layerId: string, patch: Partial<Layer>) =>
    setDesignLive((d) => patchLayers(d, layerId, patch));

  const addLayer = (layer: Layer) => {
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };

  const removeLayer = (layerId: string) => {
    setDesign((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== layerId) }));
    setSelectedId(null);
  };

  const reorder = (layerId: string, dir: "front" | "back") =>
    setDesign((d) => {
      const idx = d.layers.findIndex((l) => l.id === layerId);
      if (idx < 0) return d;
      const layers = [...d.layers];
      const [item] = layers.splice(idx, 1);
      if (dir === "front") layers.push(item);
      else layers.unshift(item);
      return { ...d, layers };
    });

  const duplicate = (layer: Layer) => {
    const copy = {
      ...layer,
      id: uid(),
      x: Math.min(layer.x + 0.06, 0.92),
      y: Math.min(layer.y + 0.06, 0.92),
    };
    addLayer(copy as Layer);
  };

  // --- Drag handling ---
  const onLayerPointerDown = (e: React.PointerEvent, layer: Layer) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    beginGesture();
    dragRef.current = {
      id: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: layer.x,
      originY: layer.y,
      width: rect.width,
      height: rect.height,
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  // Start a drag-to-resize gesture from a selected layer's corner handle.
  const onLayerResizePointerDown = (e: React.PointerEvent, layer: Layer) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    beginGesture();
    const centerX = rect.left + layer.x * rect.width;
    const centerY = rect.top + layer.y * rect.height;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
    resizeRef.current = {
      id: layer.id,
      centerX,
      centerY,
      startDist,
      startScale: layer.scale,
      maxScale: layer.type === "image" ? 10 : 3,
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const resize = resizeRef.current;
    if (resize) {
      const dist = Math.hypot(e.clientX - resize.centerX, e.clientY - resize.centerY);
      const next = (resize.startScale * dist) / resize.startDist;
      const clamped = Math.max(0.3, Math.min(resize.maxScale, next));
      updateLayerLive(resize.id, { scale: clamped });
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.width;
    const dy = (e.clientY - drag.startY) / drag.height;
    const clamp = (n: number) => Math.max(0.02, Math.min(0.98, n));
    updateLayerLive(drag.id, { x: clamp(drag.originX + dx), y: clamp(drag.originY + dy) });
  };

  const endDrag = () => {
    if (dragRef.current || resizeRef.current) endGesture();
    dragRef.current = null;
    resizeRef.current = null;
  };

  // --- Tool actions ---
  const addText = () =>
    addLayer({
      id: uid(),
      type: "text",
      text: "Your text",
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      color: "#ffffff",
      fontId: "sans",
      bold: true,
    });

  const addSticker = (content: string) =>
    addLayer({ id: uid(), type: "sticker", content, x: 0.5, y: 0.5, scale: 1, rotation: 0 });

  const onUploadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const { src, aspect } = await fileToCompressedDataUrl(file);
      addLayer({
        id: uid(),
        type: "image",
        src,
        aspect,
        x: 0.5,
        y: 0.5,
        scale: imageFitScale(aspect, model.ratio),
        rotation: 0,
      });
      toast.success("Photo added");
    } catch {
      toast.error("Couldn't add that photo. Try another image.");
    }
  };

  // --- Persistence ---
  const saveMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      if (!user) throw new Error("Not signed in");
      const payload = {
        user_id: user.id,
        name: name.trim() || "Untitled design",
        phone_model: model.label,
        platform: model.platform,
        design_json: JSON.parse(JSON.stringify(design)) as Json,
      };
      if (designId) {
        const { error } = await supabase
          .from("designs")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", designId);
        if (error) throw error;
        return designId;
      }
      const { data, error } = await supabase.from("designs").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (savedId) => {
      setDesignId(savedId);
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      queryClient.invalidateQueries({ queryKey: ["design", savedId] });
    },
  });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync();
      toast.success("Design saved");
    } catch {
      toast.error("Couldn't save your design.");
    }
  };

  const handlePreview = async () => {
    try {
      const savedId = await saveMutation.mutateAsync();
      navigate({ to: "/preview", search: { id: savedId } });
    } catch {
      toast.error("Couldn't open preview.");
    }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const savedId = await saveMutation.mutateAsync();
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        design_id: savedId,
        phone_model: model.label,
        status: "pending",
        price_cents: CASE_BASE_PRICE_CENTS,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed! Track it under Orders.");
      navigate({ to: "/orders" });
    },
    onError: () => toast.error("Couldn't place the order."),
  });

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 pt-4 pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to designs"
          onClick={() => navigate({ to: "/designs" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "undo" })}
        >
          <Undo2 className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "redo" })}
        >
          <Redo2 className="h-[18px] w-[18px]" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Design name"
          className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-1 text-base font-semibold shadow-none focus-visible:border-input focus-visible:bg-card"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Preview"
          onClick={handlePreview}
          disabled={saveMutation.isPending}
        >
          <Eye className="h-5 w-5" />
        </Button>
        <Button
          size="sm"
          className="h-9 rounded-xl"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </header>

      {/* Canvas */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-8 py-4"
        onPointerMove={onCanvasPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <CaseSilhouette
          ref={canvasRef}
          ratio={model.ratio}
          className="max-h-full"
          style={{ width: "min(62vw, 230px)" }}
        >
          <CaseArtwork
            design={design}
            selectedId={selectedId}
            onLayerPointerDown={onLayerPointerDown}
            onLayerResizePointerDown={onLayerResizePointerDown}
            onBackgroundPointerDown={() => setSelectedId(null)}
          />
        </CaseSilhouette>
      </div>

      {/* Selected layer controls */}
      {selected && (
        <SelectedLayerBar
          layer={selected}
          onUpdate={(patch) => updateLayer(selected.id, patch)}
          onUpdateLive={(patch) => updateLayerLive(selected.id, patch)}
          onGestureStart={beginGesture}
          onGestureEnd={endGesture}
          onDuplicate={() => duplicate(selected)}
          onDelete={() => removeLayer(selected.id)}
          onReorder={(dir) => reorder(selected.id, dir)}
        />
      )}

      {/* Tool panel */}
      <div className="shrink-0 border-t border-border bg-card">
        <ToolPanel
          tool={tool}
          design={design}
          setDesign={setDesign}
          onAddText={addText}
          onAddSticker={addSticker}
          onUploadPhoto={onUploadPhoto}
          onOrder={() => orderMutation.mutate()}
          orderPending={orderMutation.isPending}
        />
        {/* Tab bar */}
        <div className="grid grid-cols-5 border-t border-border pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {TOOLS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTool(key)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                tool === key ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={tool === key ? 2.4 : 1.9} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOOLS: { key: Tool; label: string; icon: typeof Type }[] = [
  { key: "model", label: "Model", icon: Smartphone },
  { key: "background", label: "Background", icon: Palette },
  { key: "text", label: "Text", icon: Type },
  { key: "stickers", label: "Stickers", icon: Sticker },
  { key: "photo", label: "Photo", icon: ImagePlus },
];

function SelectedLayerBar({
  layer,
  onUpdate,
  onUpdateLive,
  onGestureStart,
  onGestureEnd,
  onDuplicate,
  onDelete,
  onReorder,
}: {
  layer: Layer;
  onUpdate: (patch: Partial<Layer>) => void;
  onUpdateLive: (patch: Partial<Layer>) => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (dir: "front" | "back") => void;
}) {
  // Photos can be enlarged far past the case for full-bleed / zoomed-in looks.
  const sizeMax = layer.type === "image" ? 10 : 3;
  return (
    <div className="shrink-0 border-t border-border bg-violet-soft/60 px-4 py-3">
      {layer.type === "text" && (
        <div className="mb-3 space-y-2">
          <Input
            value={layer.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            aria-label="Edit text"
            className="h-9 bg-card text-sm"
            placeholder="Type something…"
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Text color ${c}`}
                  onClick={() => onUpdate({ color: c })}
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full border",
                    layer.color === c ? "ring-2 ring-primary ring-offset-1" : "border-border",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdate({ fontId: f.id })}
                style={{ fontFamily: f.family }}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  layer.fontId === f.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
            <Button
              size="icon-sm"
              variant={layer.bold ? "default" : "outline"}
              aria-label="Bold"
              onClick={() => onUpdate({ bold: !layer.bold })}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="w-10 text-xs font-medium text-muted-foreground">Size</span>
        <Slider
          value={[layer.scale]}
          min={0.3}
          max={sizeMax}
          step={0.05}
          onValueChange={([v]) => {
            onGestureStart();
            onUpdateLive({ scale: v });
          }}
          onValueCommit={onGestureEnd}
          className="flex-1"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="w-10 text-xs font-medium text-muted-foreground">Turn</span>
        <Slider
          value={[layer.rotation]}
          min={-180}
          max={180}
          step={1}
          onValueChange={([v]) => {
            onGestureStart();
            onUpdateLive({ rotation: v });
          }}
          onValueCommit={onGestureEnd}
          className="flex-1"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg"
            onClick={() => onReorder("back")}
          >
            Back
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg"
            onClick={() => onReorder("front")}
          >
            Front
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Button size="icon-sm" variant="outline" aria-label="Duplicate" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="destructive" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolPanel({
  tool,
  design,
  setDesign,
  onAddText,
  onAddSticker,
  onUploadPhoto,
  onOrder,
  orderPending,
}: {
  tool: Tool;
  design: DesignState;
  setDesign: React.Dispatch<React.SetStateAction<DesignState>>;
  onAddText: () => void;
  onAddSticker: (content: string) => void;
  onUploadPhoto: (file?: File) => void;
  onOrder: () => void;
  orderPending: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (tool === "model") {
    return (
      <PanelShell title="Phone model">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {PHONE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setDesign((d) => ({ ...d, modelId: m.id }))}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-left",
                design.modelId === m.id ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {m.platform} · {m.size}
              </p>
            </button>
          ))}
        </div>
        <Button className="mt-3 rounded-xl" size="sm" onClick={onOrder} disabled={orderPending}>
          <ShoppingBag className="h-4 w-4" />
          {orderPending
            ? "Placing order…"
            : `Order this case · $${(CASE_BASE_PRICE_CENTS / 100).toFixed(2)}`}
        </Button>
      </PanelShell>
    );
  }

  if (tool === "background") {
    const bg = design.background;
    return (
      <PanelShell title="Background">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            aria-label="Transparent / clear case"
            onClick={() => setDesign((d) => ({ ...d, background: { type: "transparent" } }))}
            className={cn(
              "relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border",
              bg.type === "transparent" ? "ring-2 ring-primary ring-offset-2" : "border-border",
            )}
            style={{ background: backgroundToCss({ type: "transparent" }) }}
          >
            <span className="rounded bg-card/85 px-1 text-[9px] font-bold uppercase tracking-wide text-foreground">
              Clear
            </span>
          </button>
          {GRADIENT_PRESETS.map((g) => {
            const active = bg.type === "gradient" && bg.from === g.from && bg.to === g.to;
            return (
              <button
                key={g.id}
                aria-label={`Gradient ${g.id}`}
                onClick={() =>
                  setDesign((d) => ({
                    ...d,
                    background: { type: "gradient", from: g.from, to: g.to, angle: g.angle },
                  }))
                }
                className={cn(
                  "h-12 w-12 shrink-0 rounded-xl border",
                  active ? "ring-2 ring-primary ring-offset-2" : "border-border",
                )}
                style={{ background: backgroundToCss({ type: "gradient", ...g }) }}
              />
            );
          })}
          {SOLID_SWATCHES.map((s) => {
            const active = bg.type === "solid" && bg.color === s.color;
            return (
              <button
                key={s.id}
                aria-label={`Color ${s.id}`}
                onClick={() =>
                  setDesign((d) => ({ ...d, background: { type: "solid", color: s.color } }))
                }
                className={cn(
                  "h-12 w-12 shrink-0 rounded-xl border",
                  active ? "ring-2 ring-primary ring-offset-2" : "border-border",
                )}
                style={{ background: s.color }}
              />
            );
          })}
        </div>
      </PanelShell>
    );
  }

  if (tool === "text") {
    return (
      <PanelShell title="Text">
        <Button size="sm" className="rounded-xl" onClick={onAddText}>
          <Type className="h-4 w-4" />
          Add a text layer
        </Button>
      </PanelShell>
    );
  }

  if (tool === "stickers") {
    return (
      <PanelShell title="Stickers">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STICKERS.map((s, i) => (
            <button
              key={i}
              onClick={() => onAddSticker(s)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-2xl"
            >
              {s}
            </button>
          ))}
        </div>
      </PanelShell>
    );
  }

  // photo
  return (
    <PanelShell title="Your photo">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onUploadPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button size="sm" className="rounded-xl" onClick={() => fileRef.current?.click()}>
        <ImagePlus className="h-4 w-4" />
        Upload a photo
      </Button>
    </PanelShell>
  );
}

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
