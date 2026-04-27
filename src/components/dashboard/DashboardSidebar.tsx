'use client'

import { Home, Workflow, CreditCard, Box, Type, Image as ImageIcon, Video, Zap, Scissors, Frame } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Workflow, label: 'Node Editor', href: '/dashboard/workflow/new' },
]

const nodeTypes = [
  { icon: Type, label: 'Text Node', color: '#3b82f6' },
  { icon: ImageIcon, label: 'Upload Image', color: '#10b981' },
  { icon: Video, label: 'Upload Video', color: '#f59e0b' },
  { icon: Zap, label: 'Run LLM', color: '#7c3aed' },
  { icon: Scissors, label: 'Crop Image', color: '#10b981' },
  { icon: Frame, label: 'Extract Frame', color: '#f59e0b' },
]

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="w-[220px] h-screen bg-[#111111] border-r border-[#1a1a1a] flex flex-col py-6 px-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
          NF
        </div>
        <span className="text-white font-semibold text-lg">NextFlow</span>
      </Link>

      {/* Main Nav */}
      <div className="flex flex-col gap-1 mb-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-white/5 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Tools Section */}
      <div className="flex-1">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-4">
          Tools
        </h3>
        <div className="flex flex-col gap-1">
          {nodeTypes.map((node) => (
            <div
              key={node.label}
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 opacity-60"
            >
              <node.icon size={16} style={{ color: node.color }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-6 border-t border-[#1a1a1a] flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col">
            <span className="text-xs text-white font-medium">Account</span>
            <Link href="#" className="text-[10px] text-zinc-500 hover:text-white transition-colors">
              Manage Profile
            </Link>
          </div>
        </div>
        
        <Link href="#" className="px-3 text-xs text-zinc-500 hover:text-white transition-colors">
          Pricing
        </Link>
      </div>
    </div>
  )
}
