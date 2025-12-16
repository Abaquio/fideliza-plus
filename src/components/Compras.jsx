"use client"

import { useState } from "react"
import { Plus, Search, Filter, ArrowUpRight, Calendar } from "lucide-react"

export default function Compras() {
  const [showModal, setShowModal] = useState(false)

  const compras = [
    {
      id: "C-001",
      customer: "María González",
      amount: 125.0,
      points: 125,
      date: "16/12/2025 14:30",
      status: "Completada",
      items: 3,
    },
    {
      id: "C-002",
      customer: "Carlos Ruiz",
      amount: 89.5,
      points: 90,
      date: "16/12/2025 14:18",
      status: "Completada",
      items: 2,
    },
    {
      id: "C-003",
      customer: "Ana Martínez",
      amount: 210.0,
      points: 210,
      date: "16/12/2025 14:05",
      status: "Completada",
      items: 5,
    },
    {
      id: "C-004",
      customer: "Luis Hernández",
      amount: 67.0,
      points: 67,
      date: "16/12/2025 13:22",
      status: "Completada",
      items: 1,
    },
    {
      id: "C-005",
      customer: "Laura Torres",
      amount: 155.0,
      points: 155,
      date: "16/12/2025 12:45",
      status: "Completada",
      items: 4,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compras / Movimientos</h1>
          <p className="text-muted-foreground">Registra compras y gestiona puntos de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nueva Compra
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total del día</p>
          <p className="text-3xl font-bold">$646.50</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Compras del día</p>
          <p className="text-3xl font-bold">15</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Puntos otorgados</p>
          <p className="text-3xl font-bold text-primary">647</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="px-4 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha
          </button>
          <button className="px-4 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Puntos</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compras.map((compra, index) => (
                <tr
                  key={compra.id}
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">{compra.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {compra.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{compra.customer}</p>
                        <p className="text-xs text-muted-foreground">{compra.items} items</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold">${compra.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                      <ArrowUpRight className="w-3 h-3" />+{compra.points}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{compra.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {compra.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary/80 text-sm font-medium">Ver detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Registrar Compra</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cliente</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Seleccionar cliente...</option>
                  <option>María González</option>
                  <option>Carlos Ruiz</option>
                  <option>Ana Martínez</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Monto de Compra</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Puntos a otorgar</p>
                <p className="text-2xl font-bold text-primary">0 pts</p>
                <p className="text-xs text-muted-foreground mt-1">1 punto por cada $1</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
