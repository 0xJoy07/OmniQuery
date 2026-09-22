import { ArcRevealHero } from "@/components/ui/arc-preloader-hero";

export default function DemoOne() {
  return (
    <ArcRevealHero greetingHold={800}>
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Omni Query
        </h1>
      </div>
    </ArcRevealHero>
  );
}
