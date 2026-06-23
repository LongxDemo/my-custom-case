import { cn } from "@/lib/utils";

interface CaseLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/** Case-outline mark + the CaseCraft wordmark ("Craft" in violet). */
export function CaseLogo({ className, size = 28, showWordmark = true }: CaseLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="5"
          y="2.5"
          width="14"
          height="19"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-foreground"
        />
        <circle cx="9" cy="6.5" r="1.4" className="fill-primary" />
        <circle cx="12.2" cy="6.5" r="1.4" className="fill-foreground/30" />
      </svg>
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-foreground">
          Case<span className="text-primary">Craft</span>
        </span>
      )}
    </div>
  );
}
