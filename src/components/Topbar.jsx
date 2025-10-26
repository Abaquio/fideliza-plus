"use client"

import { Menu } from "lucide-react"
import NotificationsPopover from "./NotificationsPopover"
import AdminMenu from "./AdminMenu"

export default function Topbar({ toggleSidebar, sidebarOpen, onNavigate }) {
  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center">
            <span className="text-white font-bold text-sm">F+</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Mi Negocio</h1>
            <p className="text-xs text-muted-foreground">Sistema de Fidelización</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationsPopover />
        <AdminMenu onNavigate={onNavigate} />
      </div>
    </header>
  )
}
