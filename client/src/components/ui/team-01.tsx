"use client";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { StaticImageData } from "next/image";
import Anushikha from "../../image/Anushikha.png";
import Srijan from "../../image/Srijan.png";
import Joy from "../../image/Joy.jpeg"

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip-linkedin-team01)">
      <path
        d="M13.633 13.633h-2.37V9.92c0-.885-.017-2.025-1.234-2.025-1.235 0-1.424.965-1.424 1.96v3.778h-2.37V5.998H8.51v1.043h.031a2.5 2.5 0 0 1 2.246-1.233c2.403 0 2.846 1.58 2.846 3.637zM3.56 4.954a1.376 1.376 0 1 1 0-2.751 1.376 1.376 0 0 1 0 2.751m1.185 8.679H2.372V5.998h2.373zM14.815.001H1.18A1.17 1.17 0 0 0 0 1.154v13.691A1.17 1.17 0 0 0 1.18 16h13.635A1.17 1.17 0 0 0 16 14.845V1.153A1.17 1.17 0 0 0 14.815 0"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip-linkedin-team01">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

type team = {
  name: string;
  image: string | StaticImageData;
  socials: {
    website?: string;
    linkedin?: string;
  };
}[];

const teamData: team = [
  {
    name: "Anushikha Kundu",
    image: Anushikha,
    socials: {
      linkedin: "https://www.linkedin.com/in/anushikha-kundu-841781324/",
    },
  },
  {
    name: "Joy Sengupta",
    image: Joy,
    socials: {
      website: "https://0x-joy.vercel.app",
      linkedin: "https://www.linkedin.com/in/beinggojo",
    },
  },
  {
    name: "Srijan Mandal",
    image: Srijan,
    socials: {
      linkedin: "https://www.linkedin.com/in/srijan-mandal-b2018a324/",
    },
  },
];

const Team = () => {
  return (
    <section id="about">
      <style>{`
        @keyframes blob-morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          33% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          66% {
            border-radius: 50% 40% 60% 50% / 40% 70% 40% 60%;
          }
        }
        .animate-blob {
          animation: blob-morph 8s ease-in-out infinite;
        }
      `}</style>
      <div className="lg:py-20 sm:py-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16 flex flex-col items-center justify-center gap-8 md:gap-16">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4"
          >
            <Badge variant={"outline"} className="px-3 py-1 h-auto text-sm border-[#FF6B2C] text-[#FF6B2C] font-mono">
              The Team
            </Badge>
            <h2 className="text-3xl md:text-5xl font-mono font-bold text-foreground">
              Meet the minds behind OmniQuery
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {teamData?.map((value, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="group flex flex-col items-center justify-center gap-6"
                >
                  <img
                    className="animate-blob w-full max-w-[280px] aspect-square object-cover group-hover:scale-105 group-hover:grayscale transition-all duration-700 ease-in-out shadow-[0_0_20px_rgba(255,107,44,0.1)] group-hover:shadow-[0_0_30px_rgba(255,107,44,0.3)]"
                    src={typeof value.image === "string" ? value.image : value.image.src}
                    alt={value.name}
                  />
                  <div className="w-full flex flex-col gap-4 items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h3 className="text-xl md:text-2xl font-mono font-bold text-foreground">
                        {value.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {value.socials.website && (
                        <a
                          href={value.socials.website}
                          className="p-2 hover:bg-[#FF6B2C]/10 text-muted-foreground hover:text-[#FF6B2C] rounded-full transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe size={18} />
                        </a>
                      )}
                      {value.socials.linkedin && (
                        <a
                          href={value.socials.linkedin}
                          className="p-2 hover:bg-[#FF6B2C]/10 text-muted-foreground hover:text-[#FF6B2C] rounded-full transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkedinIcon size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
