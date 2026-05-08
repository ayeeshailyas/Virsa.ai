import React from 'react';
import { X, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { StyleId } from '../services/gemini';

interface HeritageStory {
  title: string;
  story: string;
}

const STORIES: Record<StyleId, HeritageStory> = {
  TRUCK_ART: {
    title: "🚛 The Rolling Canvas",
    story: "Pakistan's truck art began in the 1920s. Each floral motif and chain pattern tells a story of love, longing, or pilgrimage. Every truck is a moving masterpiece."
  },
  MUGHAL: {
    title: "🕌 Empire of Symmetry",
    story: "Mughal architecture blended Persian, Islamic, and Indian styles. The Taj Mahal took 22 years and 20,000 workers to build. Symmetry wasn't just beauty—it was divine order."
  },
  MULTANI_BLUE: {
    title: "💠 Blue of the Sufis",
    story: "Multan's blue pottery dates back 700 years. The distinctive cobalt blue comes from local minerals. Each piece is fired twice and hand-painted by master craftsmen."
  },
  PHULKARI: {
    title: "🧵 Flowers of Punjab",
    story: "Phulkari means 'flower work.' Women stitched these vibrant shawls for weddings and festivals. No two patterns are ever exactly alike—each tells a family's unique story."
  }
};

interface HeritageStoryModalProps {
  styleId: StyleId;
  onClose: () => void;
}

export const HeritageStoryModal = ({ styleId, onClose }: HeritageStoryModalProps) => {
  const story = STORIES[styleId];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-card-dark border border-neon-blue/30 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)]">
        {/* Header Decor */}
        <div className="truck-art-trim" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
              <BookOpen size={20} />
            </div>
            <h3 className="font-display text-2xl uppercase tracking-wide text-white leading-none">
              {story.title}
            </h3>
          </div>

          <p className="text-white/70 leading-relaxed font-sans">
            {story.story}
          </p>

          <div className="pt-4 flex flex-col gap-3">
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-neon-blue">Heritage Archive</span>
              </div>
              <ExternalLink size={14} className="text-neon-blue group-hover:translate-x-1 transition-transform" />
            </a>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Understood
            </button>
          </div>
        </div>

        {/* Footer Decor */}
        <div className="h-2 bg-gradient-to-r from-neon-blue via-neon-pink to-neon-green opacity-50" />
      </div>
    </div>
  );
};
