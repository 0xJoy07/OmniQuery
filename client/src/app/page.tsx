import { ArcRevealHero } from "@/components/ui/arc-preloader-hero";
import ChatInterface from "@/components/chat-interface";

export default function DemoOne() {
  return (
    <ArcRevealHero greetingHold={800}>
      <div className="flex min-h-screen w-full flex-col items-center justify-center pt-10">
        <ChatInterface />
      </div>
    </ArcRevealHero>
  );
}
