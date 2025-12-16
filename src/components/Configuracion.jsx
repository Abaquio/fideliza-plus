import { Store, DollarSign, Bell, Palette, Database, Mail } from "lucide-react"

export default function Configuracion() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu tienda y sistema de fidelización</p>
      </div>

      {/* Información de la Tienda */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Información de la Tienda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Tienda</label>
            <input
              type="text"
              defaultValue="Mi Tienda Plus"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email de Contacto</label>
            <input
              type="email"
              defaultValue="contacto@mitienda.com"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              defaultValue="+34 600 000 000"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sitio Web</label>
            <input
              type="url"
              defaultValue="https://mitienda.com"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <textarea
              rows={3}
              defaultValue="Calle Principal 123, Madrid, España"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </div>

      {/* Configuración de Puntos */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in animate-delay-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent" />
          Sistema de Puntos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tasa de Conversión</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue="1"
                  className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">puntos por cada</span>
                <input
                  type="number"
                  defaultValue="1"
                  className="w-20 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">$</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Puntos de Bienvenida</label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Puntos otorgados al registrarse</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-medium mb-3">Niveles de Cliente</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-chart-4/10 rounded">
                <span className="text-sm">🥇 Oro</span>
                <span className="text-sm font-medium">≥ 5000 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">🥈 Plata</span>
                <span className="text-sm font-medium">≥ 2000 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                <span className="text-sm">🥉 Bronce</span>
                <span className="text-sm font-medium">{"< 2000 pts"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in animate-delay-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-chart-3" />
          Notificaciones
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email al Cliente</p>
                <p className="text-sm text-muted-foreground">Notificar al cliente después de cada compra</p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Recordatorios de Puntos</p>
                <p className="text-sm text-muted-foreground">
                  Recordar a clientes cuando estén cerca de canjear cupones
                </p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Reportes Semanales</p>
                <p className="text-sm text-muted-foreground">Recibir resumen de actividad cada semana</p>
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* Apariencia */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in animate-delay-300">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-chart-4" />
          Apariencia
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-primary to-accent rounded-lg border-2 border-primary">
            <div className="w-full aspect-square rounded mb-2" />
            <p className="text-sm font-medium">Verde Esmeralda</p>
            <p className="text-xs text-muted-foreground">Actual</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg border-2 border-transparent hover:border-border transition-colors">
            <div className="w-full aspect-square rounded mb-2" />
            <p className="text-sm font-medium">Azul Oceánico</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border-2 border-transparent hover:border-border transition-colors">
            <div className="w-full aspect-square rounded mb-2" />
            <p className="text-sm font-medium">Púrpura Moderno</p>
          </button>
          <button className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg border-2 border-transparent hover:border-border transition-colors">
            <div className="w-full aspect-square rounded mb-2" />
            <p className="text-sm font-medium">Naranja Vibrante</p>
          </button>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end gap-3 animate-fade-in">
        <button className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">Cancelar</button>
        <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-lg shadow-primary/20">
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}
