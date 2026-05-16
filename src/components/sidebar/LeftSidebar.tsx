'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Type, Image, Video, Bot, Crop, Film } from 'lucide-react'

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`relative flex flex-col bg-[#111111] border-r border-[#222] transition-all duration-300 z-20 h-full ${collapsed ? 'w-[52px]' : 'w-[220px]'}`}>

      {/* Collapse toggle button — vertically centered */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-[#222] border border-[#333] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-white" />
          : <ChevronLeft size={12} className="text-white" />
        }
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-[#222]">
        <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
          <span className="text-white text-xs font-bold">NF</span>
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm">NextFlow</span>
        )}
      </div>

      {/* Search — hidden when collapsed */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-[#555]" />
            <input
              type="text"
              placeholder="Search nodes..."
              className="bg-transparent text-[13px] text-white placeholder-[#555] outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Node buttons */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest px-2 py-1">
            Quick Access
          </p>
        )}

        {[
          { type: 'text', label: 'Text Node', icon: Type, color: '#3b82f6' },
          { type: 'uploadImage', label: 'Upload Image', icon: Image, color: '#10b981' },
          { type: 'uploadVideo', label: 'Upload Video', icon: Video, color: '#f59e0b' },
          { type: 'llm', label: 'Run LLM', icon: Bot, color: '#7c3aed' },
          { type: 'cropImage', label: 'Crop Image', icon: Crop, color: '#10b981' },
          { type: 'extractFrame', label: 'Extract Frame', icon: Film, color: '#f59e0b' },
        ].map(({ type, label, icon: Icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab hover:bg-[#1a1a1a] border border-transparent hover:border-[#2a2a2a] transition-all group"
            title={collapsed ? label : ''}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}22`, border: `1px solid ${color}44` }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            {!collapsed && (
              <span className="text-[13px] text-[#ccc] group-hover:text-white transition-colors">
                {label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
