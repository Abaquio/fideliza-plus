"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Gift, Percent, Calendar, Users, Filter, Trash2, RotateCcw } from "lucide-react"

import CrearCuponModal from "./modales/CrearCuponModal"
import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  // En producción, la variable VITE_API_URL DEBE estar configurada en Vercel.
  // Devolver un string vacío hará que las peticiones fallen de forma obvia si no lo está.
  return ""
}

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token") || ""
}

function clearTokenEverywhere() {
  sessionStorage.removeItem("token")
  localStorage.removeItem("token")
}

function notifyLogout() {
  window.dispatchEvent(new Event("auth:logout"))
}

async function safeJsonFetch(url, options) {
  const res = await fetch(url, options)

  if (res.status === 401) {
    const err = new Error("UNAUTHORIZED")
    err.status = 401
    throw err
  }

  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    const text = await res.text()
    throw new Error(`Respuesta no-JSON (${res.status}) en ${url}. ${text.slice(0, 80)}`)
  }
  const data = await res.json()
  return { res, data }
}

function formatFecha(fechaISO) {
  if (!fechaISO) return "—"
  const d = new Date(fechaISO)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-CL")
}

function formatDescuento(tipo, valor) {
  if (tipo === "porcentaje") return `${Number(valor)}%`
  if (tipo === "monto_fijo") return `$${Number(valor)}`
  return `$${Number(valor)}`
}

export default function Descuentos() {
  const [showModal, setShowModal] = useState(false)
  const [editingCupon, setEditingCupon] = useState(null)
  const [cupones, setCupones] = useState([])

  // ✅ Filtro visual
  const [filtroEstado, setFiltroEstado] = useState("activos") // activos | todos | eliminados

  // Confirmaciones
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)

  // Toast
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("")
  const [validadoMessage, setValidadoMessage] = useState("")

  const handleUnauthorized = () => {
    clearTokenEverywhere()
    notifyLogout()
  }

  const showValidado = (title, message) => {
    setValidadoTitle(title)
    setValidadoMessage(message)
    setValidadoOpen(true)
    window.clearTimeout(showValidado.__t)
    showValidado.__t = window.setTimeout(() => setValidadoOpen(false), 3200)
  }

  const fetchCupones = async () => {
    try {
      const API = getApiBase()
      const token = getToken()

      const { data } = await safeJsonFetch(`${API}/api/descuentos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.ok) setCupones(data.data || [])
    } catch (e) {
      if (e?.status === 401 || e?.message === "UNAUTHORIZED") {
        handleUnauthorized()
        return
      }
      console.error("Error cargando cupones:", e)
    }
  }

  useEffect(() => {
    fetchCupones()
  }, [])

  // ✅ Lógica de filtrado en frontend
  const cuponesFiltrados = useMemo(() => {
    return cupones.filter((c) => {
      const st = String(c.estado || "").toLowerCase()
      
      if (filtroEstado === "eliminados") return st === "eliminado"
      if (filtroEstado === "activos") return st !== "eliminado" 
      if (filtroEstado === "todos") return true 
      
      return st !== "eliminado"
    })
  }, [cupones, filtroEstado])

  const stats = useMemo(() => {
    const validos = cupones.filter(c => String(c.estado).toLowerCase() !== "eliminado")

    const activos = validos.filter((c) => String(c.estado).toLowerCase() === "activo").length
    const usados = validos.filter((c) => !!c.compra_id || String(c.estado).toLowerCase() === "usado").length
    
    const porVencer = validos.filter((c) => {
      if (!c.vence_en) return false
      const d = new Date(c.vence_en)
      if (Number.isNaN(d.getTime())) return false
      const diffDays = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    }).length

    return { activos, usados, porVencer }
  }, [cupones])

  // 🗑️ Eliminar (Soft Delete)
  const handleDelete = async (cupon) => {
    try {
      const API = getApiBase()
      const token = getToken()

      const { data } = await safeJsonFetch(`${API}/api/descuentos/${cupon.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!data.ok) {
        alert(data.message || "No se pudo eliminar")
        return
      }

      fetchCupones()
      showValidado("Cupón eliminado", "El cupón se ha movido a la papelera.")
    } catch (e) {
      if (e?.status === 401 || e?.message === "UNAUTHORIZED") {
        handleUnauthorized()
        return
      }
      console.error(e)
      alert("No se pudo eliminar (revisa consola)")
    }
  }

  // ♻️ Restaurar (Update estado -> activo)
  const handleRestore = async (cupon) => {
    try {
      const API = getApiBase()
      const token = getToken()

      const { data } = await safeJsonFetch(`${API}/api/descuentos/${cupon.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ estado: "activo" }) // Restauramos a activo
      })

      if (!data.ok) {
        alert(data.message || "No se pudo restaurar")
        return
      }

      fetchCupones()
      showValidado("Cupón restaurado", "El cupón está activo nuevamente.")
    } catch (e) {
      if (e?.status === 401 || e?.message === "UNAUTHORIZED") {
        handleUnauthorized()
        return
      }
      console.error(e)
      alert("No se pudo restaurar (revisa consola)")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setValidadoOpen(false)}
      />

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Mover a papelera"
        message="El cupón quedará inactivo. Podrás restaurarlo desde el filtro 'Papelera'."
        confirmLabel="Sí, mover"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={() => {
          const target = deleteTarget
          setConfirmDeleteOpen(false)
          setDeleteTarget(null)
          if (target) handleDelete(target)
        }}
      />

      {/* Confirmar Restauración */}
      <ConfirmDialog
        open={confirmRestoreOpen}
        title="Restaurar Cupón"
        message="El cupón volverá a estar activo y podrá ser canjeado por los clientes."
        confirmLabel="Sí, restaurar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmRestoreOpen(false)
          setRestoreTarget(null)
        }}
        onConfirm={() => {
          const target = restoreTarget
          setConfirmRestoreOpen(false)
          setRestoreTarget(null)
          if (target) handleRestore(target)
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Descuentos y Cupones</h1>
          <p className="text-muted-foreground">Crea y gestiona cupones canjeables por puntos</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* ✅ Filtro Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/50 transition-colors appearance-none"
            >
              <option value="activos">Visibles</option>
              <option value="eliminados">Papelera</option>
              <option value="todos">Todo el historial</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditingCupon(null)
              setShowModal(true)
            }}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-smooth shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Crear Cupón
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Cupones Activos</span>
          </div>
          <p className="text-3xl font-bold">{stats.activos}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Total Canjeados</span>
          </div>
          <p className="text-3xl font-bold">{stats.usados}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-5 h-5 text-chart-3" />
            <span className="text-sm text-muted-foreground">Ahorro Total</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-chart-4" />
            <span className="text-sm text-muted-foreground">Por Vencer (7d)</span>
          </div>
          <p className="text-3xl font-bold">{stats.porVencer}</p>
        </div>
      </div>

      {/* Cupones Grid */}
      {cuponesFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">
            {filtroEstado === "eliminados" 
              ? "La papelera está vacía." 
              : "No hay cupones para mostrar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cuponesFiltrados.map((cupon, index) => {
            const status = String(cupon.estado || "").toLowerCase()
            const isExpired = status === "expirado" || status === "vencido"
            const isDeleted = status === "eliminado"
            const isActive = status === "activo"

            const createdBy = cupon.usuarios?.nombre || cupon.usuarios?.email || "—"
            const usado = !!cupon.compra_id || status === "canjeado" || status === "usado"
            const usedCount = usado ? 1 : 0

            return (
              <div
                key={cupon.id}
                className={`
                  relative border border-border rounded-xl p-6 hover-lift animate-scale-in transition-all
                  ${isDeleted ? "bg-red-50/50 border-red-100 opacity-80" : "bg-gradient-to-br from-card via-card to-muted/20"}
                  ${isExpired ? "opacity-70" : ""}
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDeleted ? "bg-red-100" : "bg-gradient-to-br from-primary to-accent"}`}>
                      {isDeleted ? <Trash2 className="w-6 h-6 text-red-500" /> : <Gift className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-mono decoration-dotted">{cupon.codigo}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full uppercase font-semibold tracking-wide ${
                          isDeleted ? "bg-red-100 text-red-600" :
                          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${isDeleted ? "text-muted-foreground line-through" : "text-primary"}`}>
                      {formatDescuento(cupon.tipo_descuento, cupon.valor)}
                    </p>
                    <p className="text-xs text-muted-foreground">descuento</p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Creado por</p>
                    <p className="text-sm font-bold line-clamp-1">{createdBy}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Costo</p>
                    <p className="text-lg font-bold">{Number(cupon.costo_puntos || 0)} pts</p>
                  </div>
                </div>

                {/* Uso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{usado ? "Canjeado" : "Disponible"}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isDeleted ? "bg-red-300" : "bg-gradient-to-r from-primary to-accent"}`}
                      style={{ width: usado ? "100%" : "0%" }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Vence: {formatFecha(cupon.vence_en)}</span>
                  </div>
                  
                  {isDeleted ? (
                    // ✅ BOTÓN RESTAURAR (Solo si eliminado)
                    <button
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      onClick={() => {
                        setRestoreTarget(cupon)
                        setConfirmRestoreOpen(true)
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </button>
                  ) : (
                    // ✅ BOTONES NORMALES (Si activo)
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                        onClick={() => {
                          setEditingCupon(cupon)
                          setShowModal(true)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => {
                          setDeleteTarget(cupon)
                          setConfirmDeleteOpen(true)
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <CrearCuponModal
        open={showModal}
        editingCupon={editingCupon}
        onClose={() => {
          setShowModal(false)
          setEditingCupon(null)
        }}
        onSaved={({ action }) => {
          setShowModal(false)
          setEditingCupon(null)
          fetchCupones()
          showValidado(
            action === "edit" ? "Cupón actualizado" : "Cupón creado",
            action === "edit"
              ? "Los cambios se guardaron correctamente."
              : "El cupón se creó correctamente."
          )
        }}
      />
    </div>
  )
}