"use client"

import { LayoutDashboard, Users, ShoppingCart, Tag, UserCog, Settings, X } from "lucide-react"
import { NavLink } from "react-router-dom"

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user")
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function resolveRoleName(user) {
  // Trata varias formas comunes:
  // user.rol, user.role, user.rol_nombre, user.roles.nombre, user.rol.nombre, etc.
  const candidates = [
    user?.rol,
    user?.role,
    user?.rol_nombre,
    user?.rolNombre,
    user?.roles?.nombre,
    user?.rol?.nombre,
    user?.usuario?.roles?.nombre,
  ].filter(Boolean)

  const role = String(candidates[0] || "").trim()
  return role
}

export default function Sidebar({ currentView, setCurrentView, isOpen, setIsOpen }) {
  const storedUser = getStoredUser()
  const roleName = resolveRoleName(storedUser)

  const isVendedor = roleName.toLowerCase() === "vendedor"
  const isAdmin = roleName.toLowerCase() === "administrador" || roleName.toLowerCase() === "admin"

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { id: "clientes", label: "Clientes", icon: Users, to: "/clientes" },
    { id: "compras", label: "Compras / Movimientos", icon: ShoppingCart, to: "/compras" },
    { id: "descuentos", label: "Descuentos", icon: Tag, to: "/descuentos" },

    // ✅ Restricción: vendedor NO ve staff/configuración
    { id: "staff", label: "Staff", icon: UserCog, to: "/staff", hidden: isVendedor },
    { id: "configuracion", label: "Configuración", icon: Settings, to: "/configuracion", hidden: isVendedor },
  ].filter((i) => !i.hidden)

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 
          w-64 bg-card border-r border-border 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
              F+
            </div>
            <span className="font-semibold text-lg">Fideliza+</span>
          </div>

          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={() => {
                  setCurrentView(item.id)
                  setIsOpen(false)
                }}
                className={({ isActive }) => {
                  const active = isActive || currentView === item.id
                  return `
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                    transition-smooth text-left
                    animate-fade-in
                    ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    }
                  `
                }}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer del Sidebar - ✅ NUEVO: Enlace de Ayuda */}
        <div className="p-4 border-t border-border">
          <a
            href="https://horn-louse-710.notion.site/Fideliza-Medical-Season-298a4bec326280d7994eeb827a411fdd"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              💡 ¿Necesitas Ayuda?
            </p>
            <p className="text-xs text-muted-foreground">Ver documentación y manual</p>
          </a>
        </div>
      </aside>
    </>
  )
}