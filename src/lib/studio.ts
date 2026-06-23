// Shared types, presets and helpers for the CaseCraft design studio.

export type Platform = "iOS" | "Android";

export interface PhoneModel {
  id: string;
  label: string;
  platform: Platform;
  /** physical screen size, e.g. 6.1" */
  size: string;
  /** width / height ratio of the case back */
  ratio: number;
}

export const PHONE_MODELS: PhoneModel[] = [
  {
    id: "iphone-15-pro-max",
    label: "iPhone 15 Pro Max",
    platform: "iOS",
    size: '6.7"',
    ratio: 0.48,
  },
  { id: "iphone-15-pro", label: "iPhone 15 Pro", platform: "iOS", size: '6.1"', ratio: 0.49 },
  { id: "iphone-15", label: "iPhone 15", platform: "iOS", size: '6.1"', ratio: 0.49 },
  { id: "iphone-14", label: "iPhone 14", platform: "iOS", size: '6.1"', ratio: 0.49 },
  { id: "iphone-se", label: "iPhone SE", platform: "iOS", size: '4.7"', ratio: 0.5 },
  {
    id: "galaxy-s24-ultra",
    label: "Galaxy S24 Ultra",
    platform: "Android",
    size: '6.8"',
    ratio: 0.46,
  },
  { id: "galaxy-s24", label: "Galaxy S24", platform: "Android", size: '6.2"', ratio: 0.47 },
  { id: "galaxy-s23", label: "Galaxy S23", platform: "Android", size: '6.1"', ratio: 0.47 },
  { id: "pixel-8-pro", label: "Pixel 8 Pro", platform: "Android", size: '6.7"', ratio: 0.47 },
  { id: "pixel-8", label: "Pixel 8", platform: "Android", size: '6.2"', ratio: 0.48 },
  { id: "oneplus-12", label: "OnePlus 12", platform: "Android", size: '6.8"', ratio: 0.46 },
  {
    id: "nothing-phone-2",
    label: "Nothing Phone (2)",
    platform: "Android",
    size: '6.7"',
    ratio: 0.47,
  },
];

export function getModel(id: string): PhoneModel {
  return PHONE_MODELS.find((m) => m.id === id) ?? PHONE_MODELS[0];
}

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "transparent" };

/** CSS for the editor's "clear case" indicator — a soft checkerboard. */
export const TRANSPARENT_CHECKERBOARD =
  "repeating-conic-gradient(#dcdce4 0% 25%, #ffffff 0% 50%) 50% / 18px 18px";

export interface SolidSwatch {
  id: string;
  color: string;
}

export const SOLID_SWATCHES: SolidSwatch[] = [
  { id: "violet", color: "#7c3aed" },
  { id: "ink", color: "#1c1b22" },
  { id: "rose", color: "#f43f5e" },
  { id: "amber", color: "#f59e0b" },
  { id: "emerald", color: "#10b981" },
  { id: "sky", color: "#0ea5e9" },
  { id: "cream", color: "#f6f1e7" },
  { id: "blush", color: "#fbcfe8" },
  { id: "sand", color: "#d6c2a3" },
  { id: "slate", color: "#475569" },
];

export interface GradientPreset {
  id: string;
  from: string;
  to: string;
  angle: number;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: "violet-dream", from: "#a78bfa", to: "#5b21b6", angle: 145 },
  { id: "sunset", from: "#fb7185", to: "#f59e0b", angle: 150 },
  { id: "ocean", from: "#22d3ee", to: "#2563eb", angle: 145 },
  { id: "mint", from: "#6ee7b7", to: "#059669", angle: 150 },
  { id: "peach", from: "#fde68a", to: "#fb7185", angle: 150 },
  { id: "candy", from: "#f0abfc", to: "#6366f1", angle: 150 },
  { id: "midnight", from: "#334155", to: "#0f172a", angle: 150 },
  { id: "blush", from: "#fbcfe8", to: "#fda4af", angle: 150 },
];

export const STICKERS: string[] = [
  "❤️",
  "⭐",
  "✨",
  "🔥",
  "🌈",
  "🌸",
  "🌟",
  "💫",
  "🦋",
  "🐱",
  "🐶",
  "🌙",
  "☀️",
  "🍃",
  "🌺",
  "🍓",
  "🍑",
  "🥑",
  "🍕",
  "🎧",
  "🎸",
  "📷",
  "🚀",
  "👑",
  "💎",
  "🎀",
  "😎",
  "🤍",
  "💜",
  "🌊",
];

export interface FontOption {
  id: string;
  label: string;
  family: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "sans", label: "Sans", family: '"Manrope", ui-sans-serif, sans-serif' },
  { id: "serif", label: "Serif", family: 'Georgia, "Times New Roman", serif' },
  { id: "mono", label: "Mono", family: '"Courier New", ui-monospace, monospace' },
  { id: "rounded", label: "Round", family: '"Trebuchet MS", "Segoe UI", sans-serif' },
];

export const TEXT_COLORS: string[] = [
  "#ffffff",
  "#1c1b22",
  "#7c3aed",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#fbbf24",
  "#ec4899",
  "#000000",
];

export type Layer =
  | {
      id: string;
      type: "text";
      text: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      color: string;
      fontId: string;
      bold: boolean;
    }
  | {
      id: string;
      type: "sticker";
      content: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
    }
  | {
      id: string;
      type: "image";
      src: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      /** natural width / height of the photo, used to size it correctly */
      aspect?: number;
    };

export interface DesignState {
  v: 1;
  modelId: string;
  background: Background;
  layers: Layer[];
}

export const CASE_BASE_PRICE_CENTS = 2499;

// --- Starter templates (Browse Templates gallery) ---------------------------

export interface Template {
  id: string;
  name: string;
  category: string;
  design: DesignState;
}

const DEFAULT_TEMPLATE_MODEL = "iphone-15-pro";

/** Distributive omit so each Layer variant keeps its own fields when "id" is removed. */
type LayerSpec = Layer extends infer L ? (L extends Layer ? Omit<L, "id"> : never) : never;

function tpl(background: Background, layers: LayerSpec[]): DesignState {
  return {
    v: 1,
    modelId: DEFAULT_TEMPLATE_MODEL,
    background,
    layers: layers.map((l) => ({ ...l, id: uid() }) as Layer),
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "violet-dream",
    name: "Violet Dream",
    category: "Gradient",
    design: tpl({ type: "gradient", from: "#a78bfa", to: "#5b21b6", angle: 145 }, [
      { type: "sticker", content: "✨", x: 0.5, y: 0.34, scale: 1.1, rotation: 0 },
      {
        type: "text",
        text: "dream\nbig",
        x: 0.5,
        y: 0.6,
        scale: 1.5,
        rotation: 0,
        color: "#ffffff",
        fontId: "sans",
        bold: true,
      },
    ]),
  },
  {
    id: "sunset-vibes",
    name: "Sunset Vibes",
    category: "Gradient",
    design: tpl({ type: "gradient", from: "#fb7185", to: "#f59e0b", angle: 150 }, [
      {
        type: "text",
        text: "good\nvibes",
        x: 0.5,
        y: 0.5,
        scale: 1.7,
        rotation: -6,
        color: "#ffffff",
        fontId: "serif",
        bold: true,
      },
      { type: "sticker", content: "🌅", x: 0.74, y: 0.78, scale: 0.9, rotation: 0 },
    ]),
  },
  {
    id: "cosmic",
    name: "Cosmic",
    category: "Space",
    design: tpl({ type: "gradient", from: "#334155", to: "#0f172a", angle: 150 }, [
      { type: "sticker", content: "🌙", x: 0.66, y: 0.3, scale: 1.3, rotation: 0 },
      { type: "sticker", content: "⭐", x: 0.3, y: 0.24, scale: 0.6, rotation: 0 },
      { type: "sticker", content: "✨", x: 0.28, y: 0.6, scale: 0.7, rotation: 0 },
      { type: "sticker", content: "💫", x: 0.7, y: 0.66, scale: 0.7, rotation: 0 },
      {
        type: "text",
        text: "to the moon",
        x: 0.5,
        y: 0.86,
        scale: 0.9,
        rotation: 0,
        color: "#ffffff",
        fontId: "mono",
        bold: false,
      },
    ]),
  },
  {
    id: "cutie",
    name: "Cutie",
    category: "Cute",
    design: tpl({ type: "gradient", from: "#fbcfe8", to: "#fda4af", angle: 150 }, [
      { type: "sticker", content: "🦋", x: 0.36, y: 0.36, scale: 1.0, rotation: -12 },
      { type: "sticker", content: "🌸", x: 0.68, y: 0.6, scale: 0.95, rotation: 10 },
      {
        type: "text",
        text: "stay\nsweet",
        x: 0.5,
        y: 0.5,
        scale: 1.2,
        rotation: 0,
        color: "#9d174d",
        fontId: "rounded",
        bold: true,
      },
    ]),
  },
  {
    id: "minimal-ink",
    name: "Minimal Ink",
    category: "Minimal",
    design: tpl({ type: "solid", color: "#1c1b22" }, [
      {
        type: "text",
        text: "less\nis more",
        x: 0.5,
        y: 0.5,
        scale: 1.3,
        rotation: 0,
        color: "#ffffff",
        fontId: "serif",
        bold: false,
      },
    ]),
  },
  {
    id: "tropical",
    name: "Tropical",
    category: "Nature",
    design: tpl({ type: "gradient", from: "#6ee7b7", to: "#059669", angle: 150 }, [
      { type: "sticker", content: "🌺", x: 0.32, y: 0.7, scale: 1.1, rotation: -8 },
      { type: "sticker", content: "🍃", x: 0.68, y: 0.3, scale: 1.1, rotation: 14 },
      {
        type: "text",
        text: "aloha",
        x: 0.5,
        y: 0.5,
        scale: 1.6,
        rotation: 0,
        color: "#ffffff",
        fontId: "rounded",
        bold: true,
      },
    ]),
  },
  {
    id: "on-fire",
    name: "On Fire",
    category: "Bold",
    design: tpl({ type: "solid", color: "#0a0a0a" }, [
      { type: "sticker", content: "🔥", x: 0.5, y: 0.36, scale: 1.5, rotation: 0 },
      {
        type: "text",
        text: "no\nlimits",
        x: 0.5,
        y: 0.64,
        scale: 1.6,
        rotation: 0,
        color: "#f59e0b",
        fontId: "sans",
        bold: true,
      },
    ]),
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    category: "Gradient",
    design: tpl({ type: "gradient", from: "#22d3ee", to: "#2563eb", angle: 145 }, [
      { type: "sticker", content: "🌊", x: 0.5, y: 0.62, scale: 1.6, rotation: 0 },
      {
        type: "text",
        text: "wander",
        x: 0.5,
        y: 0.32,
        scale: 1.2,
        rotation: 0,
        color: "#ffffff",
        fontId: "serif",
        bold: true,
      },
    ]),
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Deep clone a design and give every layer a fresh id (so templates spawn editable copies). */
export function cloneDesign(design: DesignState): DesignState {
  return {
    v: 1,
    modelId: design.modelId,
    background: { ...design.background },
    layers: design.layers.map((l) => ({ ...l, id: uid() }) as Layer),
  };
}

export function createDefaultDesign(modelId?: string): DesignState {
  return {
    v: 1,
    modelId: PHONE_MODELS.find((m) => m.id === modelId)?.id ?? PHONE_MODELS[0].id,
    background: { type: "gradient", from: "#a78bfa", to: "#5b21b6", angle: 145 },
    layers: [],
  };
}

export function backgroundToCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "transparent") return TRANSPARENT_CHECKERBOARD;
  return `linear-gradient(${bg.angle}deg, ${bg.from} 0%, ${bg.to} 100%)`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Safely coerce stored jsonb back into a DesignState. */
export function parseDesign(raw: unknown): DesignState {
  const base = createDefaultDesign();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Partial<DesignState>;
  return {
    v: 1,
    modelId: typeof obj.modelId === "string" ? obj.modelId : base.modelId,
    background: obj.background ?? base.background,
    layers: Array.isArray(obj.layers) ? (obj.layers as Layer[]) : [],
  };
}

/** Base width (in cqw units) of a photo at scale 1, used by CaseArtwork. */
export const IMAGE_BASE_CQW = 100;

/**
 * Pick a starting scale so a freshly added photo is sized to fit inside the
 * case (whole photo visible, as large as possible) regardless of its aspect.
 * `aspect` = photo width / height, `caseRatio` = case width / height.
 */
export function imageFitScale(aspect: number, caseRatio: number): number {
  const maxWidthCqw = 96; // leave a hair of margin on the sides
  const caseHeightCqw = 100 / caseRatio; // the case is 100cqw wide
  const maxHeightCqw = caseHeightCqw * 0.94;
  const scaleByWidth = maxWidthCqw / IMAGE_BASE_CQW;
  const scaleByHeight = (maxHeightCqw * aspect) / IMAGE_BASE_CQW;
  return Math.max(0.2, Math.min(scaleByWidth, scaleByHeight));
}

/** Load a File, downscale it, and return a data URL plus its natural aspect ratio. */
export function fileToCompressedDataUrl(
  file: File,
  max = 900,
  quality = 0.82,
): Promise<{ src: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const aspect = img.width && img.height ? img.width / img.height : 1;
      let { width, height } = img;
      const scale = Math.min(1, max / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const hasAlpha = file.type === "image/png";
      resolve({ src: canvas.toDataURL(hasAlpha ? "image/png" : "image/jpeg", quality), aspect });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
