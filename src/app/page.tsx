import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Mockup from "@/components/landing/Mockup";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white/20 selection:text-white overflow-x-hidden font-sans">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-60 pointer-events-none"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />
      
      {/* Top Gradient Overlay for pure black navbar area */}
      <div className="fixed top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-0 pointer-events-none" />
      
      {/* Global Grain/Noise */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay z-10" />
      
      <Navbar />
      
      <div className="relative z-20">
        <HeroSection />
        <Mockup />
      </div>

      <footer className="relative py-20 px-6 border-t border-white/5 bg-black z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-zinc-500 text-[13px] font-medium tracking-tight">
            © 2026 NextFlow AI. Built with Gemini 3 Flash.
          </div>
          <div className="flex gap-10 text-[13px] font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
