import { cn } from "@/lib/utils";
import { Globe, Video, FileText, MessageSquare } from "lucide-react";
import React from "react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Web Page Q&A",
      description: "Scrapes and indexes any public URL, then answers questions grounded in the page content.",
      icon: <Globe className="w-6 h-6" />,
    },
    {
      title: "Video Insights",
      description: "Extracts video transcripts, chunks and embeds them, then answers questions about the video.",
      icon: <Video className="w-6 h-6" />,
    },
    {
      title: "Document Processing",
      description: "Accepts PDF, DOCX, PPTX, XLSX, CSV, TXT, JSON, Markdown, and HTML uploads for Q&A.",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "Interactive Chat",
      description: "Engage with your data through a sleek, real-time conversational interface.",
      icon: <MessageSquare className="w-6 h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800 border-b lg:border-b-0",
        index >= 4 && "lg:border-b-0"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-[#FF6B2C]/10 dark:from-[#FF6B2C]/10 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-[#FF6B2C]/10 dark:from-[#FF6B2C]/10 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400 group-hover/feature:text-[#FF6B2C] transition-colors">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10 font-mono">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-[#FF6B2C] transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10 font-mono leading-relaxed">
        {description}
      </p>
    </div>
  );
};
