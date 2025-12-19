import { Shield } from "lucide-react"

export default function CrearStaffModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold mb-4">Agregar Miembro del Staff</h2>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre completo</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Roberto García"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="usuario@empresa.com"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rol
            </label>
            <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Seleccionar rol...</option>
              <option value="admin">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium mb-2">Sucursal</label>
            <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Seleccionar sucursal...</option>
              <option value="1">Casa Matriz</option>
              <option value="2">Sucursal Centro</option>
            </select>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" />
            <span className="text-sm">Usuario activo</span>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            <button
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              Crear Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
