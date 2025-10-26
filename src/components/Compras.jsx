import { Calendar, DollarSign, Package, Filter } from "lucide-react"

export default function Compras() {
  const compras = [
    { id: 1, cliente: "María González", fecha: "2025-01-24", monto: 1250, puntos: 125, productos: 3 },
    { id: 2, cliente: "Carlos Ruiz", fecha: "2025-01-24", monto: 890, puntos: 89, productos: 2 },
    { id: 3, cliente: "Ana Martínez", fecha: "2025-01-23", monto: 2100, puntos: 210, productos: 5 },
    { id: 4, cliente: "Luis Pérez", fecha: "2025-01-23", monto: 650, puntos: 65, productos: 1 },
    { id: 5, cliente: "Roberto Silva", fecha: "2025-01-22", monto: 3400, puntos: 340, productos: 8 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Compras</h2>
          <p className="text-muted-foreground">Historial de transacciones y puntos otorgados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#480048] hover:bg-[#601848] text-white rounded-lg transition-colors shadow-lg shadow-[#480048]/20">
          <Package className="w-5 h-5" />
          Nueva Compra
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048] appearance-none">
              <option>Todos los montos</option>
              <option>$0 - $500</option>
              <option>$500 - $1000</option>
              <option>$1000+</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-lg transition-colors">
            <Filter className="w-5 h-5" />
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#480048] to-[#601848] rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-2">Total Ventas Hoy</p>
          <p className="text-3xl font-bold mb-1">$8,290</p>
          <p className="text-sm opacity-75">89 transacciones</p>
        </div>
        <div className="bg-gradient-to-br from-[#601848] to-[#C04848] rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-2">Puntos Otorgados</p>
          <p className="text-3xl font-bold mb-1">829</p>
          <p className="text-sm opacity-75">Hoy</p>
        </div>
        <div className="bg-gradient-to-br from-[#C04848] to-[#F07241] rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-2">Ticket Promedio</p>
          <p className="text-3xl font-bold mb-1">$93</p>
          <p className="text-sm opacity-75">Por compra</p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Puntos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Productos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compras.map((compra) => (
                <tr key={compra.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{compra.id.toString().padStart(4, "0")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{compra.cliente}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{compra.fecha}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#480048]">${compra.monto.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F07241]/10 text-[#F07241] rounded-full text-sm font-medium">
                      +{compra.puntos}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{compra.productos} items</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
