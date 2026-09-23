import { ArcRevealHero } from "@/components/ui/arc-preloader-hero";
import { MynaHero } from "@/components/ui/myna-hero";

export default function DemoOne() {
  return (
    <ArcRevealHero greetingHold={800}>
      <MynaHero />
    </ArcRevealHero>
  );
}
