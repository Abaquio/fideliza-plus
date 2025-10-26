"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, ShoppingCart, Gift, TrendingUp, X } from "lucide-react"

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef(null)

  // Notificaciones de ejemplo
  const notifications = [
    {
      id: 1,
      icon: ShoppingCart,
      text: "Nueva compra registrada por María González",
      time: "hace 5 min",
      unread: true,
    },
    {
      id: 2,
      icon: Gift,
      text: "Juan Pérez canjeó un cupón de descuento",
      time: "hace 15 min",
      unread: true,
    },
    {
      id: 3,
      icon: TrendingUp,
      text: "Has alcanzado 50 clientes registrados",
      time: "hace 1 hora",
      unread: false,
    },
    {
      id: 4,
      icon: Bell,
      text: "Recordatorio: Revisar cupones por vencer",
      time: "hace 2 horas",
      unread: false,
    },
  ]

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
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
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-secondary rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-[#F07241] rounded-full"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">{notification.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    {notification.unread && (
                      <div className="flex-shrink-0">
                        <span className="w-2 h-2 bg-[#F07241] rounded-full block"></span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <button className="w-full text-center text-sm text-[#480048] hover:text-[#601848] font-medium transition-colors">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
