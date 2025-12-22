"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Topbar({ user, toggleSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showDropdown) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown])

  const handleViewProfile = () => {
    setShowDropdown(false)
    navigate("/perfil")
  }

  const clearSessionEverywhere = () => {
    // ✅ Limpia ambos, porque ahora el token puede estar en sessionStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
  }

  const handleLogout = () => {
    setShowDropdown(false)

    clearSessionEverywhere()

    // ✅ Dispara eventos "compatibles" por si App escucha uno u otro
    window.dispatchEvent(new Event("auth-changed"))
    window.dispatchEvent(new Event("auth:logout"))

    navigate("/login", { replace: true })
  }

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-40 animate-slide-in-left">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-3 hover:bg-muted px-3 py-2 rounded-lg transition-smooth"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
            {user?.avatar}
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg animate-scale-in">
            <div className="p-3 border-b border-border">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <div className="p-2">
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Ver Perfil</span>
              </button>

              <div className="my-1 border-t border-border"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
