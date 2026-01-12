"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getAuthToken() {
  // soporte local + session + varias llaves
  const keys = ["token", "authToken", "access_token", "accessToken"]
  for (const k of keys) {
    const a = localStorage.getItem(k)
    if (a) return a
    const b = sessionStorage.getItem(k)
    if (b) return b
  }
  return ""
}

async function fetchMe() {
  const token = getAuthToken()
  if (!token) return null

  // probamos ambas por si montaste distinto
  const candidates = [`${API_URL}/api/auth/me`, `${API_URL}/auth/me`]

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await resp.json().catch(() => ({}))

      // tu backend responde { ok:true, user:{...} }
      const u = json?.user || json?.data
      if (resp.ok && (json?.ok === true || typeof json?.ok === "undefined") && u) {
        return u
      }
    } catch {
      // seguimos
    }
  }

  return null
}

export default function Topbar({ user, toggleSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // ✅ este user es el REAL (BD)
  const [me, setMe] = useState(null)

  // ✅ mantener compatibilidad: si hay props user, lo usamos como fallback,
  // pero priorizamos "me" cuando exista
  const effectiveUser = me || user || {}

  const displayName = effectiveUser?.nombre || effectiveUser?.name || "Usuario"
  const displayEmail = effectiveUser?.email || ""
  const displayAvatar =
    effectiveUser?.avatar ||
    (displayName?.[0] ? displayName[0].toUpperCase() : "U")

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

  // ✅ carga inicial desde BD
  useEffect(() => {
    const run = async () => {
      const u = await fetchMe()
      if (u) setMe(u)
    }
    run()
  }, [])

  // ✅ cuando se actualiza el perfil, recargar /me (BD)
  useEffect(() => {
    const reload = async () => {
      const u = await fetchMe()
      if (u) setMe(u)
    }

    window.addEventListener("profile-updated", reload)
    window.addEventListener("auth-changed", reload)

    return () => {
      window.removeEventListener("profile-updated", reload)
      window.removeEventListener("auth-changed", reload)
    }
  }, [])

  const handleViewProfile = () => {
    setShowDropdown(false)
    navigate("/perfil")
  }

  const clearSessionEverywhere = () => {
    const keys = ["token", "authToken", "access_token", "accessToken", "user", "usuario", "authUser"]
    keys.forEach((k) => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })
  }

  const handleLogout = () => {
    setShowDropdown(false)
    clearSessionEverywhere()

    window.dispatchEvent(new Event("auth-changed"))
    window.dispatchEvent(new Event("profile-updated"))

    navigate("/login", { replace: true })
  }

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-40 animate-slide-in-left">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-3 hover:bg-muted px-3 py-2 rounded-lg transition-smooth"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
            {displayAvatar}
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg animate-scale-in">
            <div className="p-3 border-b border-border">
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
