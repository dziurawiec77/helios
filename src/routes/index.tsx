import { createFileRoute } from "@tanstack/react-router";
import { Overlay } from "@/components/hud/overlay";
import { SolarSystem } from "@/components/solar/system";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="relative isolate h-dvh overflow-hidden bg-bg text-fg">
      <SolarSystem />
      <div className="vignette" aria-hidden />
      <Overlay />
    </main>
  );
}
