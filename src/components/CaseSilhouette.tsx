import { forwardRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Camera rendering mode:
 *  - "lenses": full camera module with lenses + flash (a finished device look)
 *  - "blank":  the same camera-shaped area but empty — a plain cutout/reserved zone
 *  - "none":   no camera at all (used by tiny status thumbnails)
 */
export type CameraMode = "lenses" | "blank" | "none";

interface CaseSilhouetteProps {
  className?: string;
  style?: CSSProperties;
  /** width / height ratio, e.g. 0.48 for a typical phone */
  ratio?: number;
  /** the printed artwork shown on the back of the case (rendered full-bleed) */
  children?: React.ReactNode;
  /** how the camera area is drawn on the back (default "lenses") */
  camera?: CameraMode;
  /** render an empty, dashed "placeholder" case instead of a finished device */
  dashed?: boolean;
}

/**
 * A photo-real phone-case mockup used across the app.
 * Renders the device frame, glass camera island, side buttons, a glossy
 * reflection and a soft contact shadow. `children` is the printed artwork
 * and fills the entire back of the case. The forwarded ref points at the
 * artwork surface so the studio can measure it for drag math.
 */
export const CaseSilhouette = forwardRef<HTMLDivElement, CaseSilhouetteProps>(
  function CaseSilhouette(
    { className, style, ratio = 0.48, children, camera = "lenses", dashed = false },
    ref,
  ) {
    return (
      <div
        className={cn("relative", className)}
        style={{
          aspectRatio: String(ratio),
          filter: "drop-shadow(0 22px 30px rgba(24,18,40,0.28))",
          ...style,
        }}
      >
        {/* Side buttons (back view: power on the left, volume pair on the right) */}
        <span
          aria-hidden
          className="absolute -right-[2px] top-[22%] h-[7%] w-[3px] rounded-r-sm"
          style={{ background: "linear-gradient(180deg,#3a3a40,#1b1b1f)" }}
        />
        <span
          aria-hidden
          className="absolute -right-[2px] top-[33%] h-[11%] w-[3px] rounded-r-sm"
          style={{ background: "linear-gradient(180deg,#3a3a40,#1b1b1f)" }}
        />
        <span
          aria-hidden
          className="absolute -left-[2px] top-[27%] h-[14%] w-[3px] rounded-l-sm"
          style={{ background: "linear-gradient(180deg,#3a3a40,#1b1b1f)" }}
        />

        {/* Device / case body */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[14%/7%] p-[3.5%]"
          style={{
            background: "linear-gradient(150deg,#2c2c31 0%,#161618 45%,#000 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 2px 3px rgba(255,255,255,0.18)",
          }}
        >
          {/* Printed artwork surface */}
          <div
            ref={ref}
            className={cn(
              "relative h-full w-full overflow-hidden rounded-[12%/6%]",
              dashed ? "border-2 border-dashed border-border bg-muted/50" : "bg-card",
            )}
            style={
              dashed
                ? undefined
                : {
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.18)",
                  }
            }
          >
            {children}

            {/* Glossy diagonal reflection */}
            {!dashed && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(125deg,rgba(255,255,255,0.32) 0%,rgba(255,255,255,0.08) 18%,rgba(255,255,255,0) 38%,rgba(255,255,255,0) 70%,rgba(255,255,255,0.10) 100%)",
                }}
              />
            )}
          </div>

          {/* Camera island */}
          {camera !== "none" && <CameraIsland blank={camera === "blank"} />}
        </div>
      </div>
    );
  },
);

function CameraIsland({ blank = false }: { blank?: boolean }) {
  // "Blank" keeps the camera footprint but leaves it empty — a plain cutout
  // shape with a soft recessed edge, no lenses or flash.
  if (blank) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[5%] aspect-square w-[34%] rounded-[26%]"
        style={{
          // Solid, opaque blank fill so artwork never shows through the cutout.
          background: "linear-gradient(150deg,#ededf2,#d7d7df)",
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 2px 5px rgba(0,0,0,0.20), 0 1px 1px rgba(255,255,255,0.5)",
        }}
      />
    );
  }
  return (
    <div
      className="pointer-events-none absolute left-[8%] top-[5%] grid aspect-square w-[34%] grid-cols-2 grid-rows-2 place-items-center gap-[6%] rounded-[26%] p-[7%]"
      style={{
        background: "linear-gradient(150deg,#3a3a3f,#161618)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 4px 8px rgba(0,0,0,0.45)",
      }}
    >
      <Lens />
      <Lens />
      <Lens />
      {/* Flash + microphone in the 4th cell */}
      <div className="flex h-full w-full flex-col items-center justify-center gap-[18%]">
        <span
          className="h-[34%] w-[34%] rounded-full"
          style={{ background: "radial-gradient(circle at 35% 30%,#fff6d8,#caa14a)" }}
        />
        <span className="h-[16%] w-[16%] rounded-full bg-black/70" />
      </div>
    </div>
  );
}

function Lens() {
  return (
    <span
      className="relative block aspect-square w-full rounded-full"
      style={{
        background: "radial-gradient(circle at 38% 32%,#5b6470 0%,#21242b 42%,#050608 100%)",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.10), 0 1px 1px rgba(0,0,0,0.6)",
      }}
    >
      <span
        aria-hidden
        className="absolute left-[24%] top-[20%] h-[26%] w-[26%] rounded-full"
        style={{
          background: "radial-gradient(circle,rgba(255,255,255,0.85),rgba(255,255,255,0) 70%)",
        }}
      />
    </span>
  );
}
