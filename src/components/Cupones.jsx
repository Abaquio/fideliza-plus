import { Ticket, Plus, Percent, Calendar } from "lucide-react"

export default function Cupones() {
  const cupones = [
    {
      id: 1,
      nombre: "20% Descuento",
      codigo: "DESC20",
      puntos: 500,
      activo: true,
      canjes: 45,
      vencimiento: "2025-02-28",
    },
    {
      id: 2,
      nombre: "Envío Gratis",
      codigo: "ENVIO0",
      puntos: 300,
      activo: true,
      canjes: 78,
      vencimiento: "2025-03-15",
    },
    {
      id: 3,
      nombre: "$50 de Descuento",
      codigo: "AHORRO50",
      puntos: 800,
      activo: true,
      canjes: 23,
      vencimiento: "2025-02-20",
    },
    {
      id: 4,
      nombre: "2x1 en Productos",
      codigo: "2X1PROMO",
      puntos: 1000,
      activo: false,
      canjes: 12,
      vencimiento: "2025-01-31",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Cupones</h2>
          <p className="text-muted-foreground">Gestiona los cupones de recompensa disponibles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#480048] hover:bg-[#601848] text-white rounded-lg transition-colors shadow-lg shadow-[#480048]/20">
          <Plus className="w-5 h-5" />
          Crear Cupón
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#480048] to-[#601848] flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">Cupones Activos</span>
          </div>
          <p className="text-3xl font-bold text-foreground">3</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C04848] to-[#F07241] flex items-center justify-center">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">Canjes del Mes</span>
          </div>
          <p className="text-3xl font-bold text-foreground">158</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#601848] to-[#C04848] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">Por Vencer</span>
          </div>
          <p className="text-3xl font-bold text-foreground">1</p>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cupones.map((cupon) => (
          <div
            key={cupon.id}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div
              className={`h-2 ${cupon.activo ? "bg-gradient-to-r from-[#480048] to-[#F07241]" : "bg-gray-300"}`}
            ></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{cupon.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    Código: <span className="font-mono font-semibold text-[#480048]">{cupon.codigo}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cupon.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {cupon.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Costo en puntos</span>
                  <span className="font-semibold text-[#F07241]">{cupon.puntos} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Canjes realizados</span>
                  <span className="font-medium">{cupon.canjes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vencimiento</span>
                  <span className="font-medium text-sm">{cupon.vencimiento}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-[#480048] hover:bg-[#480048] hover:text-white border border-[#480048] rounded-lg transition-colors">
                  Editar
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium bg-[#480048] hover:bg-[#601848] text-white rounded-lg transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
