import { Orbit, Pause, Play, RotateCcw, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BODIES, BODY_BY_ID, EARTH_YEAR, PLANETS, type BodyId } from "@/lib/solar/bodies";
import { simClock } from "@/lib/solar/runtime";
import { useSolarStore } from "@/lib/solar/store";
import { cn } from "@/lib/utils";

const SPEED_MIN = 0.25;
const SPEED_MAX = 32;

let bootDone = false;

function BootScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "done">(bootDone ? "done" : "in");

  useEffect(() => {
    if (bootDone) {
      setPhase("done");
      return;
    }

    const finish = () => {
      if (bootDone) return;
      bootDone = true;
      setPhase("out");
      window.setTimeout(() => setPhase("done"), 320);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    window.setTimeout(finish, 1700);
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6"
      style={{
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "auto",
        transition: "opacity 320ms linear",
      }}
      aria-busy={phase === "in"}
      aria-label="Kalibracja mapy gwiazd"
    >
      <p className="text-xs font-medium tracking-[0.32em] text-muted uppercase">Obserwatorium</p>
      <h1 className="font-display mt-3 text-6xl leading-none tracking-tight text-fg md:text-8xl">
        Helios
      </h1>
      <p className="mt-5 text-sm text-muted">Kalibracja mapy gwiazd</p>
      <div className="mt-10 h-px w-44 overflow-hidden bg-border md:w-56">
        <div className="boot-bar h-full origin-left bg-fg" />
      </div>
    </div>
  );
}

function Credit() {
  return (
    <p className="pointer-events-auto max-w-[16rem] text-[11px] leading-snug text-faint md:max-w-none">
      Wykonano przez Max Mad za pomocą narzędzia{" "}
      <a
        href="https://grok.com"
        className="text-muted underline decoration-border underline-offset-2 transition-colors duration-(--motion-quick) hover:text-fg"
        target="_blank"
        rel="noreferrer"
      >
        Grok Build
      </a>
    </p>
  );
}

function YearReadout() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) el.textContent = (simClock.time / EARTH_YEAR).toFixed(2).replace(".", ",");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span ref={ref} className="tabular-nums text-muted">
      0,00
    </span>
  );
}

function SpeedControl() {
  const speed = useSolarStore((s) => s.speed);
  const setSpeed = useSolarStore((s) => s.setSpeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <label htmlFor="sim-speed" className="sr-only">
        Tempo
      </label>
      {ready ? (
        <Slider
          id="sim-speed"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={0.25}
          value={[speed]}
          onValueChange={(v) => setSpeed(v[0] ?? 1)}
          aria-label="Prędkość symulacji"
        />
      ) : (
        <div className="h-11 flex-1" />
      )}
      <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted">
        {speed.toFixed(2).replace(/\.00$/, "")}×
      </span>
    </div>
  );
}

function InfoPanel() {
  const selectedId = useSolarStore((s) => s.selectedId);
  const select = useSolarStore((s) => s.select);
  if (!selectedId) return null;
  const body = BODY_BY_ID[selectedId];

  const rows: [string, string][] = [
    ["Odległość", body.facts.distance],
    ["Okres", body.facts.year],
    ["Doba", body.facts.day],
  ];

  return (
    <aside
      className="pointer-events-auto w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-bg/80 p-2.5 md:p-4"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.04em] text-faint">{body.facts.kind}</p>
          <h2 className="font-display mt-0.5 text-lg leading-tight text-fg md:text-2xl">
            {body.name}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => select(null)}
          aria-label="Zamknij panel"
        >
          <X />
        </Button>
      </div>
      <p className="mt-2 hidden text-sm leading-relaxed text-pretty text-muted md:line-clamp-3 md:block">
        {body.facts.summary}
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2 md:mt-3 md:pt-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-faint">{label}</dt>
            <dd className="mt-0.5 text-xs text-fg md:text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function PlanetStrip() {
  const selectedId = useSolarStore((s) => s.selectedId);
  const select = useSolarStore((s) => s.select);
  const items = BODIES;

  return (
    <div
      className="pointer-events-auto flex max-w-full gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="listbox"
      aria-label="Ciała niebieskie"
    >
      {items.map((body) => {
        const active = selectedId === body.id;
        return (
          <button
            key={body.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => select(active ? null : body.id)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center px-2.5 text-xs tracking-wide transition-[color,opacity] duration-(--motion-quick) ease-[var(--ease-smooth-out)] md:px-3 md:text-sm",
              active ? "text-fg" : "text-faint hover:text-muted",
            )}
          >
            {body.name}
          </button>
        );
      })}
    </div>
  );
}

function Transport() {
  const paused = useSolarStore((s) => s.paused);
  const showOrbits = useSolarStore((s) => s.showOrbits);
  const showLabels = useSolarStore((s) => s.showLabels);
  const togglePaused = useSolarStore((s) => s.togglePaused);
  const setShowOrbits = useSolarStore((s) => s.setShowOrbits);
  const setShowLabels = useSolarStore((s) => s.setShowLabels);
  const resetView = useSolarStore((s) => s.resetView);

  return (
    <div className="pointer-events-auto flex w-full items-center gap-1 border-t border-border pt-2 md:gap-3 md:pt-3">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={togglePaused}
          aria-label={paused ? "Wznów" : "Pauza"}
        >
          <span className="relative size-4">
            <Pause
              className={cn(
                "absolute inset-0 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-in-out)]",
                paused ? "scale-[0.25] opacity-0 blur-sm" : "scale-100 opacity-100 blur-none",
              )}
            />
            <Play
              className={cn(
                "absolute inset-0 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-in-out)]",
                paused ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-sm",
              )}
            />
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={resetView}
          aria-label="Widok całości"
        >
          <RotateCcw />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-11", showOrbits ? "text-fg" : "text-faint")}
          onClick={() => setShowOrbits(!showOrbits)}
          aria-pressed={showOrbits}
          aria-label="Ścieżki orbit"
        >
          <Orbit />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-11", showLabels ? "text-fg" : "text-faint")}
          onClick={() => setShowLabels(!showLabels)}
          aria-pressed={showLabels}
          aria-label="Etykiety"
        >
          <Tag />
        </Button>
      </div>

      <SpeedControl />

      <p className="hidden shrink-0 text-xs text-faint md:block">
        <YearReadout /> r.
      </p>
    </div>
  );
}

export function Overlay() {
  const togglePaused = useSolarStore((s) => s.togglePaused);
  const setSpeed = useSolarStore((s) => s.setSpeed);
  const select = useSolarStore((s) => s.select);
  const resetView = useSolarStore((s) => s.resetView);
  const setShowOrbits = useSolarStore((s) => s.setShowOrbits);
  const setShowLabels = useSolarStore((s) => s.setShowLabels);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePaused();
      } else if (e.code === "Escape") {
        select(null);
      } else if (e.key === "[" || e.key === "-") {
        const s = useSolarStore.getState().speed;
        setSpeed(Math.max(SPEED_MIN, s - 0.25));
      } else if (e.key === "]" || e.key === "=" || e.key === "+") {
        const s = useSolarStore.getState().speed;
        setSpeed(Math.min(SPEED_MAX, s + 0.25));
      } else if (e.key === "r" || e.key === "R") {
        resetView();
      } else if (e.key === "o" || e.key === "O") {
        setShowOrbits(!useSolarStore.getState().showOrbits);
      } else if (e.key === "l" || e.key === "L") {
        setShowLabels(!useSolarStore.getState().showLabels);
      } else if (e.key >= "1" && e.key <= "8") {
        const planet = PLANETS[Number(e.key) - 1];
        if (planet) select(planet.id as BodyId);
      } else if (e.key === "9") {
        select("moon");
      } else if (e.key === "0") {
        select("sun");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePaused, setSpeed, select, resetView, setShowOrbits, setShowLabels]);

  return (
    <>
      <BootScreen />
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-5">
        <header className="flex flex-col items-stretch gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="hud-enter">
            <h1 className="font-display text-2xl leading-none tracking-tight text-fg md:text-4xl">
              Helios
            </h1>
            <p className="mt-1 text-xs text-faint">Obserwatorium Układu Słonecznego</p>
            <div className="mt-2">
              <Credit />
            </div>
          </div>
          <div className="w-full max-w-sm md:ml-auto">
            <InfoPanel />
          </div>
        </header>

        <div className="flex flex-col items-stretch gap-2">
          <PlanetStrip />
          <Transport />
        </div>
      </div>
    </>
  );
}
