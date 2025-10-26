"use client"

import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Ticket,
  Settings,
  X,
} from "lucide-react"

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "compras", label: "Compras", icon: ShoppingBag },
  { id: "cupones", label: "Cupones", icon: Ticket },
  { id: "configuracion", label: "Configuración", icon: Settings },
]

export default function Sidebar({
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
}) {
  const Item = ({ item }) => {
    const Icon = item.icon
    const isActive = activeSection === item.id

    return (
      <button
        key={item.id}
        onClick={() => {
          // Navega a la ruta y cierra el sidebar en móvil
          setActiveSection(item.id)
          setIsOpen(false)
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg
          transition-all duration-200 text-left
          ${
            isActive
              ? "bg-[#480048] text-white shadow-lg shadow-[#480048]/20"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }
        `}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="font-medium">{item.label}</span>
      </button>
    )
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          // Sutil fondo sólido (no afecta funcionalidad)
          background:
            "linear-gradient(to bottom right, #ffffff 0%, #fafafa 100%)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">F+</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#480048] to-[#F07241] bg-clip-text text-transparent">
                Fideliza+
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </nav>

          {/* Footer de ayuda (opcional) */}
          <div className="p-4 border-t border-border">
            <div className="bg-gradient-to-br from-[#480048] to-[#601848] rounded-lg p-4 text-white shadow-md">
              <p className="text-sm font-semibold mb-1">¿Necesitas ayuda?</p>
              <p className="text-xs opacity-90 mb-3">Contacta a soporte técnico</p>
              <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                Contactar
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}