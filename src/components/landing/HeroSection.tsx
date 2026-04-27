"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function HeroSection() {
  const { isSignedIn } = useAuth();
  const signupLink = isSignedIn ? "/workflow" : "/sign-up";

  return (
    <div className="relative pt-40 pb-8 px-6 flex flex-col items-center text-center max-w-5xl mx-auto z-10">
      <h1 className="text-4xl md:text-[62px] font-bold text-white tracking-tight leading-[1.05] mb-6">
        <span className="opacity-90">NextFlow.ai</span> is the world's most <br />
        powerful creative AI suite.
      </h1>
      
      <p className="text-sm md:text-[15px] text-zinc-400 font-medium max-w-2xl mb-10 tracking-tight">
        Generate, enhance, and edit images, videos, or 3D meshes for free with AI.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link 
          href={signupLink} 
          className="px-10 py-3.5 bg-white text-black text-[15px] font-bold rounded-full hover:bg-zinc-200 transition-all active:scale-95"
        >
          Start for free
        </Link>
        <Link 
          href="/workflow" 
          className="px-10 py-3.5 bg-white/5 text-white text-[15px] font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm"
        >
          Launch App
        </Link>
      </div>
    </div>
  );
}
