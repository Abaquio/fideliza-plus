import { Store, Bell, Palette, Shield, Save } from "lucide-react"

export default function Configuracion() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Configuración</h2>
        <p className="text-muted-foreground">Personaliza tu sistema de fidelización</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#480048] to-[#601848] flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Información del Negocio</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre del Negocio</label>
              <input
                type="text"
                defaultValue="Mi Negocio"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email de Contacto</label>
              <input
                type="email"
                defaultValue="contacto@minegocio.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
              <input
                type="tel"
                defaultValue="555-0100"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
            </div>
          </div>
        </div>

        {/* Points Configuration */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C04848] to-[#F07241] flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Configuración de Puntos</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Puntos por Peso Gastado</label>
              <input
                type="number"
                defaultValue="10"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
              <p className="text-xs text-muted-foreground mt-1">Por cada $10 gastados, el cliente recibe 1 punto</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Valor del Punto (en pesos)</label>
              <input
                type="number"
                defaultValue="1"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
              <p className="text-xs text-muted-foreground mt-1">Cada punto equivale a $1 en descuentos</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Puntos de Bienvenida</label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
              <p className="text-xs text-muted-foreground mt-1">Puntos otorgados al registrarse</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#601848] to-[#C04848] flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Notificaciones</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: "Notificar nuevos clientes", checked: true },
              { label: "Notificar canjes de cupones", checked: true },
              { label: "Notificar compras mayores a $1000", checked: false },
              { label: "Resumen diario por email", checked: true },
            ].map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-5 h-5 rounded border-border text-[#480048] focus:ring-[#480048]"
                />
                <span className="text-sm text-foreground">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Seguridad</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cambiar Contraseña</label>
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048] mb-2"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
              />
            </div>
            <button className="w-full px-4 py-2 text-sm font-medium text-[#480048] hover:bg-[#480048] hover:text-white border border-[#480048] rounded-lg transition-colors">
              Actualizar Contraseña
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-[#480048] hover:bg-[#601848] text-white rounded-lg transition-colors shadow-lg shadow-[#480048]/20">
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}
