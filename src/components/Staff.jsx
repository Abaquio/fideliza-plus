"use client"

import { useEffect, useState } from "react"
import { Plus, Shield, Mail, Phone, Calendar } from "lucide-react"
import CrearStaffModal from "./modales/CrearStaffModal"

// ✅ NUEVO (validado)
import ValidadoCard from "../ui/validado"

function getApiBase() {
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
}

async function safeJsonFetch(url, options) {
  const res = await fetch(url, options)
  const ct = res.headers.get("content-type") || ""

  if (!ct.includes("application/json")) {
    const text = await res.text()
    throw new Error(
      `Respuesta no-JSON (${res.status}) en ${url}. Primeros chars: ${text.slice(0, 80)}`
    )
  }

  const data = await res.json()
  return { res, data }
}

export default function Staff() {
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [staff, setStaff] = useState([])

  // ✅ NUEVO: validado toast
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Acción realizada")
  const [validadoMessage, setValidadoMessage] = useState("La operación se completó correctamente.")

  const fetchStaff = async () => {
    try {
      const API = getApiBase()
      const token = localStorage.getItem("token")

      const url = `${API}/api/staff`

      const { data } = await safeJsonFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.ok) setStaff(data.data || [])
    } catch (err) {
      console.error("Error cargando staff", err)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

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

  const showValidado = (action) => {
    if (action === "edit") {
      setValidadoTitle("Usuario actualizado")
      setValidadoMessage("Los cambios se guardaron correctamente.")
    } else {
      setValidadoTitle("Usuario creado")
      setValidadoMessage("El nuevo miembro del staff se creó correctamente.")
    }
    setValidadoOpen(true)

    // auto cerrar suave (no afecta el diseño)
    window.clearTimeout(showValidado.__t)
    showValidado.__t = window.setTimeout(() => setValidadoOpen(false), 3200)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ✅ NUEVO: ValidadoCard (se muestra aunque el modal se cierre) */}
      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setValidadoOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff</h1>
          <p className="text-muted-foreground">Gestiona el equipo y sus permisos</p>
        </div>

        <button
          onClick={() => {
            setEditingMember(null)
            setShowModal(true)
          }}
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
          <p className="text-3xl font-bold">{staff.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Activos</p>
          <p className="text-3xl font-bold text-primary">{staff.filter((s) => s.activo).length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Administradores</p>
          <p className="text-3xl font-bold">
            {staff.filter((s) => s.roles?.nombre === "Administrador").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Vendedores</p>
          <p className="text-3xl font-bold">
            {staff.filter((s) => s.roles?.nombre === "Vendedor").length}
          </p>
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
                  {member.nombre
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{member.nombre}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getRoleColor(
                      member.roles?.nombre
                    )}`}
                  >
                    {member.roles?.nombre}
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${member.activo ? "bg-primary" : "bg-muted"}`} />
            </div>

            {/* Información de Contacto */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>—</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Registrado</span>
              </div>
            </div>

            {/* Permisos */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permisos
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                  {member.roles?.nombre || "Sin rol"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Estado: {member.activo ? "Activo" : "Inactivo"}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  onClick={() => {
                    setEditingMember(member)
                    setShowModal(true)
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CrearStaffModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={(info) => {
          // mantiene tu comportamiento (cerrar + refrescar)
          setShowModal(false)
          setEditingMember(null)
          fetchStaff()

          // ✅ NUEVO: validado
          const action = info?.action || (editingMember ? "edit" : "create")
          showValidado(action)
        }}
        editingMember={editingMember}
      />
    </div>
  )
}
