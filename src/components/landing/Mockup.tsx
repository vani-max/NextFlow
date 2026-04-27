"use client";

import Image from "next/image";

export default function Mockup() {
  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center mt-20 md:mt-32">
      {/* Vertical guide lines */}
      <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-white/5 -z-10" />
      <div className="absolute top-0 bottom-0 right-[25%] w-[1px] bg-white/5 -z-10" />

      {/* Monitor */}
      <div className="relative w-full max-w-[820px] aspect-video mb-0 z-20 group">
        <div className="absolute inset-0 bg-zinc-900 rounded-[2px] border-[10px] border-zinc-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] overflow-hidden">
            <Image 
                src="/imagee.png" 
                alt="NextFlow Mockup" 
                fill
                className="object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-1000"
            />
            {/* Screen Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Monitor Stand */}
      <div className="relative flex flex-col items-center z-10">
        <div className="w-40 h-28 bg-gradient-to-b from-zinc-800 to-zinc-900 border-x border-white/5" />
        <div className="w-[240px] h-2 bg-zinc-950 rounded-t-sm border-t border-white/10" />
      </div>

      {/* Desk Surface */}
      <div className="relative w-full h-[200px] bg-gradient-to-b from-[#141414] to-black border-t border-white/10 flex flex-col items-center justify-start pt-8 overflow-hidden shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
        
        {/* Keyboard and Mouse */}
        <div className="relative flex items-center justify-center gap-16 w-full max-w-3xl opacity-60">
            {/* Keyboard */}
            <div className="w-[420px] h-6 bg-zinc-200 rounded-[3px] shadow-2xl flex items-center justify-between px-2">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="w-3.5 h-3 bg-zinc-300/50 rounded-[0.5px]" />
                ))}
            </div>
            
            {/* Mouse */}
            <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-2xl relative">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-zinc-300 rounded-full" />
            </div>
        </div>
      </div>
    </div>
  );
}
