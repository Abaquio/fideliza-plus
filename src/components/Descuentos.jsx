"use client"

import { useState } from "react"
import { Plus, Gift, Percent, Calendar, Users } from "lucide-react"

export default function Descuentos() {
  const [showModal, setShowModal] = useState(false)

  const cupones = [
    {
      id: 1,
      code: "VERANO2025",
      discount: "20%",
      points: 500,
      minPurchase: 50,
      expiresAt: "31/12/2025",
      used: 45,
      total: 100,
      status: "active",
    },
    {
      id: 2,
      code: "WELCOME10",
      discount: "10%",
      points: 200,
      minPurchase: 20,
      expiresAt: "31/01/2026",
      used: 123,
      total: 500,
      status: "active",
    },
    {
      id: 3,
      code: "FIDELIZA50",
      discount: "$50",
      points: 1000,
      minPurchase: 100,
      expiresAt: "15/03/2026",
      used: 8,
      total: 50,
      status: "active",
    },
    {
      id: 4,
      code: "BLACKFRIDAY",
      discount: "30%",
      points: 800,
      minPurchase: 75,
      expiresAt: "30/11/2025",
      used: 234,
      total: 1000,
      status: "expired",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Descuentos y Cupones</h1>
          <p className="text-muted-foreground">Crea y gestiona cupones canjeables por puntos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Crear Cupón
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Cupones Activos</span>
          </div>
          <p className="text-3xl font-bold">3</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Total Canjeados</span>
          </div>
          <p className="text-3xl font-bold">410</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-5 h-5 text-chart-3" />
            <span className="text-sm text-muted-foreground">Ahorro Total</span>
          </div>
          <p className="text-3xl font-bold">$8.2K</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-chart-4" />
            <span className="text-sm text-muted-foreground">Por Vencer</span>
          </div>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>

      {/* Cupones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cupones.map((cupon, index) => (
          <div
            key={cupon.id}
            className={`
              bg-gradient-to-br from-card via-card to-muted/20 
              border border-border rounded-xl p-6 hover-lift animate-scale-in
              ${cupon.status === "expired" ? "opacity-60" : ""}
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header del Cupón */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono">{cupon.code}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      cupon.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cupon.status === "active" ? "Activo" : "Expirado"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{cupon.discount}</p>
                <p className="text-xs text-muted-foreground">descuento</p>
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Costo en Puntos</p>
                <p className="text-lg font-bold">{cupon.points} pts</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Compra Mínima</p>
                <p className="text-lg font-bold">${cupon.minPurchase}</p>
              </div>
            </div>

            {/* Progreso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Uso</span>
                <span className="font-medium">
                  {cupon.used} / {cupon.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
                  style={{ width: `${(cupon.used / cupon.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Vence: {cupon.expiresAt}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                  Editar
                </button>
                <button className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Cupón */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Crear Nuevo Cupón</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código del Cupón</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  placeholder="VERANO2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo Descuento</label>
                  <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Porcentaje</option>
                    <option>Monto Fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valor</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Costo en Puntos</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Compra Mínima ($)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Expiración</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad Máxima</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="100"
                />
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
                  Crear Cupón
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
