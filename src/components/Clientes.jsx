"use client"

import { useState } from "react"
import { Search, Plus, Eye, Edit, Mail, Phone } from "lucide-react"

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)

  const clientes = [
    {
      id: 1,
      name: "María González",
      email: "maria@email.com",
      phone: "+34 612 345 678",
      points: 8540,
      purchases: 42,
      tier: "Oro",
      joined: "15/01/2024",
    },
    {
      id: 2,
      name: "Pedro Sánchez",
      email: "pedro@email.com",
      phone: "+34 623 456 789",
      points: 7230,
      purchases: 38,
      tier: "Oro",
      joined: "22/01/2024",
    },
    {
      id: 3,
      name: "Laura Torres",
      email: "laura@email.com",
      phone: "+34 634 567 890",
      points: 6890,
      purchases: 35,
      tier: "Plata",
      joined: "03/02/2024",
    },
    {
      id: 4,
      name: "Carlos Ruiz",
      email: "carlos@email.com",
      phone: "+34 645 678 901",
      points: 5420,
      purchases: 28,
      tier: "Plata",
      joined: "10/02/2024",
    },
    {
      id: 5,
      name: "Ana Martínez",
      email: "ana@email.com",
      phone: "+34 656 789 012",
      points: 3210,
      purchases: 18,
      tier: "Bronce",
      joined: "28/02/2024",
    },
  ]

  const getTierColor = (tier) => {
    switch (tier) {
      case "Oro":
        return "bg-chart-4/20 text-chart-4 border-chart-4/30"
      case "Plata":
        return "bg-muted text-foreground border-border"
      case "Bronce":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return "bg-muted text-foreground border-border"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes y sus puntos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Todos los niveles</option>
            <option>Oro</option>
            <option>Plata</option>
            <option>Bronce</option>
          </select>
        </div>
      </div>

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente, index) => (
          <div
            key={cliente.id}
            className="bg-card border border-border rounded-xl p-6 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {cliente.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{cliente.name}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getTierColor(cliente.tier)}`}
                  >
                    {cliente.tier}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{cliente.phone}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-2xl font-bold text-primary">{cliente.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Puntos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{cliente.purchases}</p>
                <p className="text-xs text-muted-foreground">Compras</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              Cliente desde {cliente.joined}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Nuevo Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: María González"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+34 600 000 000"
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
                  Crear Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
