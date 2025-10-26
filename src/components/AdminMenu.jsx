"use client"

import { useState, useEffect, useRef } from "react"
import { User, Settings, LogOut, UserCircle } from "lucide-react"

export default function AdminMenu({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Opciones del menú
  const menuOptions = [
    {
      id: 1,
      icon: UserCircle,
      label: "Ver perfil",
      onClick: () => {
        if (onNavigate) {
          onNavigate("perfil")
        }
        setIsOpen(false)
      },
    },
    {
      id: 2,
      icon: Settings,
      label: "Configuración",
      onClick: () => {
        if (onNavigate) {
          onNavigate("configuracion")
        }
        setIsOpen(false)
      },
    },
    {
      id: 3,
      icon: LogOut,
      label: "Cerrar sesión",
      onClick: () => {
        console.log("Cerrar sesión")
        setIsOpen(false)
      },
      danger: true,
    },
  ]

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#480048] flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium hidden md:block">Admin</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          {menuOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  option.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
