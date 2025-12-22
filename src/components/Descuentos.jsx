"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Gift, Percent, Calendar, Users } from "lucide-react"

import CrearCuponModal from "./modales/CrearCuponModal"
import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

function getApiBase() {
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
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

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const stats = useMemo(() => {
    const activos = cupones.filter((c) => String(c.estado).toLowerCase() === "activo").length
    const usados = cupones.filter((c) => !!c.compra_id || String(c.estado).toLowerCase() === "usado")
      .length
    const porVencer = cupones.filter((c) => {
      if (!c.vence_en) return false
      const d = new Date(c.vence_en)
      if (Number.isNaN(d.getTime())) return false
      const diffDays = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    }).length

    return { activos, usados, porVencer }
  }, [cupones])

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
      showValidado("Cupón eliminado", "El cupón se eliminó correctamente.")
    } catch (e) {
      if (e?.status === 401 || e?.message === "UNAUTHORIZED") {
        handleUnauthorized()
        return
      }
      console.error(e)
      alert("No se pudo eliminar (revisa consola)")
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Confirmar eliminación"
        message="¿Seguro que quieres eliminar este cupón?"
        confirmLabel="Sí, eliminar"
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Descuentos y Cupones</h1>
          <p className="text-muted-foreground">Crea y gestiona cupones canjeables por puntos</p>
        </div>
        <button
          onClick={() => {
            setEditingCupon(null)
            setShowModal(true)
          }}
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

      {/* Cupones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cupones.map((cupon, index) => {
          const status = String(cupon.estado || "").toLowerCase()
          const isExpired = status === "expirado"
          const isActive = status === "activo"

          const createdBy = cupon.usuarios?.nombre || cupon.usuarios?.email || "—"

          const usado = !!cupon.compra_id || status === "usado"
          const usedCount = usado ? 1 : 0

          return (
            <div
              key={cupon.id}
              className={`
                bg-gradient-to-br from-card via-card to-muted/20
                border border-border rounded-xl p-6 hover-lift animate-scale-in
                ${isExpired ? "opacity-60" : ""}
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono">{cupon.codigo}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? "Activo" : cupon.estado}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
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
                  <span className="text-muted-foreground">Uso</span>
                  <span className="font-medium">Usos: {usedCount}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
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
              </div>
            </div>
          )
        })}
      </div>

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
