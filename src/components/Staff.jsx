"use client"

import { useState } from "react"
import { Plus, Shield, Mail, Phone, Calendar } from "lucide-react"

export default function Staff() {
  const [showModal, setShowModal] = useState(false)

  const staff = [
    {
      id: 1,
      name: "Roberto García",
      email: "roberto@fidelizaplus.com",
      phone: "+34 611 222 333",
      role: "Administrador",
      permissions: ["all"],
      joinedAt: "10/01/2024",
      lastActive: "Hace 5 min",
      status: "active",
    },
    {
      id: 2,
      name: "Isabel Fernández",
      email: "isabel@fidelizaplus.com",
      phone: "+34 622 333 444",
      role: "Gerente",
      permissions: ["clientes", "compras", "descuentos"],
      joinedAt: "15/02/2024",
      lastActive: "Hace 1 hora",
      status: "active",
    },
    {
      id: 3,
      name: "Miguel Santos",
      email: "miguel@fidelizaplus.com",
      phone: "+34 633 444 555",
      role: "Vendedor",
      permissions: ["compras"],
      joinedAt: "01/03/2024",
      lastActive: "Hace 3 horas",
      status: "active",
    },
    {
      id: 4,
      name: "Carmen López",
      email: "carmen@fidelizaplus.com",
      phone: "+34 644 555 666",
      role: "Vendedor",
      permissions: ["compras"],
      joinedAt: "20/03/2024",
      lastActive: "Hace 2 días",
      status: "inactive",
    },
  ]

  const getRoleColor = (role) => {
    switch (role) {
      case "Administrador":
        return "bg-primary/20 text-primary border-primary/30"
      case "Gerente":
        return "bg-accent/20 text-accent border-accent/30"
      case "Vendedor":
        return "bg-muted text-foreground border-border"
      default:
        return "bg-muted text-foreground border-border"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff</h1>
          <p className="text-muted-foreground">Gestiona el equipo y sus permisos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Agregar Miembro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
          <p className="text-3xl font-bold">4</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Activos Hoy</p>
          <p className="text-3xl font-bold text-primary">3</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Administradores</p>
          <p className="text-3xl font-bold">1</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Vendedores</p>
          <p className="text-3xl font-bold">2</p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {staff.map((member, index) => (
          <div
            key={member.id}
            className="bg-card border border-border rounded-xl p-6 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${member.status === "active" ? "bg-primary" : "bg-muted"}`} />
            </div>

            {/* Información de Contacto */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Ingresó: {member.joinedAt}</span>
              </div>
            </div>

            {/* Permisos */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permisos
              </p>
              <div className="flex flex-wrap gap-2">
                {member.permissions.includes("all") ? (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">Acceso Total</span>
                ) : (
                  member.permissions.map((perm) => (
                    <span key={perm} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md capitalize">
                      {perm}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">Última actividad: {member.lastActive}</span>
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

      {/* Modal Agregar Miembro */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Agregar Miembro del Staff</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Roberto García"
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
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Seleccionar rol...</option>
                  <option>Administrador</option>
                  <option>Gerente</option>
                  <option>Vendedor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permisos</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    <span className="text-sm">Gestionar Clientes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    <span className="text-sm">Registrar Compras</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    <span className="text-sm">Gestionar Descuentos</span>
                  </label>
                </div>
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
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
