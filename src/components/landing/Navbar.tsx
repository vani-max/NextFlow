"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const signupLink = isSignedIn ? "/workflow" : "/sign-up";
  const loginLink = isSignedIn ? "/workflow" : "/sign-in";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-transparent">
      {/* Logo */}
      <div className="flex-1">
        <Link href="/" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H8V20H4V4Z" fill="white" />
                <path d="M16 4H20V20H16V4Z" fill="white" />
                <path d="M8 12H16V16H8V12Z" fill="white" />
            </svg>
        </Link>
      </div>

      {/* Center Links */}
      <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold text-zinc-300 uppercase tracking-widest">
        <Link href="/workflow" className="hover:text-white transition-colors">App</Link>
        <button className="flex items-center gap-1 hover:text-white transition-colors">
            Features <ChevronDown className="w-3 h-3" />
        </button>
        <Link href="#" className="hover:text-white transition-colors">Image</Link>
        <Link href="#" className="hover:text-white transition-colors">Video</Link>
        <Link href="#" className="hover:text-white transition-colors">Upscaler</Link>
        <Link href="#" className="hover:text-white transition-colors">API</Link>
        <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
        <Link href="#" className="hover:text-white transition-colors">Enterprise</Link>
      </div>

      {/* Auth Buttons */}
      <div className="flex-1 flex justify-end items-center gap-2">
        <Link 
          href={signupLink} 
          className="px-5 py-2 text-[11px] font-bold bg-white text-black rounded-full hover:bg-zinc-200 transition-all active:scale-95"
        >
          Sign up for free
        </Link>
        <Link 
          href={loginLink} 
          className="px-5 py-2 text-[11px] font-bold bg-[#111] text-white border border-white/5 rounded-full hover:bg-[#1a1a1a] transition-all active:scale-95"
        >
          Log in
        </Link>
      </div>
    </nav>
  );
}
