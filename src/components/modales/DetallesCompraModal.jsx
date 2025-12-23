"use client"

import { useEffect, useMemo, useState } from "react"
import { X, ArrowUpRight, Pencil, Save, Ban } from "lucide-react"

// ✅ Componentes UI (ajusta la ruta si tu carpeta está en otro lugar)
import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

function formatCLP(n) {
  const num = Number(n || 0)
  return num.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
}

function formatFecha(fechaISO) {
  if (!fechaISO) return "—"
  const d = new Date(fechaISO)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-CL")
}

function toDatetimeLocalValue(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function safeLower(s) {
  return String(s || "").toLowerCase()
}

export default function DetallesCompraModal({ open, onClose, compra, sucursales = [], onUpdate }) {
  if (!open || !compra) return null

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // ✅ Confirm + Validado
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validadoOpen, setValidadoOpen] = useState(false)

  // formulario edición
  const [monto, setMonto] = useState("")
  const [estado, setEstado] = useState("vigente")
  const [fechaCompra, setFechaCompra] = useState("")
  const [numeroFolio, setNumeroFolio] = useState("")
  const [sucursalId, setSucursalId] = useState("")

  useEffect(() => {
    // al abrir / cambiar compra, resetea modo edición y precarga valores
    setIsEditing(false)
    setSaving(false)
    setConfirmOpen(false)
    setValidadoOpen(false)

    setMonto(String(compra.monto ?? ""))
    setEstado(safeLower(compra.estado) === "anulada" ? "anulada" : "vigente")
    setFechaCompra(toDatetimeLocalValue(compra.fecha_compra))
    setNumeroFolio(compra.numero_folio || "")

    // si en compra viene sucursal_id úsalo, si no, intenta calzar por nombre
    if (compra.sucursal_id) {
      setSucursalId(compra.sucursal_id)
    } else if (compra.sucursal && sucursales?.length) {
      const found = sucursales.find((s) => s.nombre === compra.sucursal)
      setSucursalId(found?.id || "")
    } else {
      setSucursalId("")
    }
  }, [compra, open, sucursales])

  const estadoLabel = useMemo(() => {
    const e = safeLower(compra.estado)
    if (e === "vigente") return "Vigente"
    if (e === "anulada") return "Anulada"
    return String(compra.estado || "—")
  }, [compra.estado])

  const estadoChipClass =
    safeLower(compra.estado) === "vigente"
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-red-500/10 text-red-700"

  const handleStartEdit = () => setIsEditing(true)

  const handleCancelEdit = () => {
    // volver a valores originales
    setMonto(String(compra.monto ?? ""))
    setEstado(safeLower(compra.estado) === "anulada" ? "anulada" : "vigente")
    setFechaCompra(toDatetimeLocalValue(compra.fecha_compra))
    setNumeroFolio(compra.numero_folio || "")

    if (compra.sucursal_id) setSucursalId(compra.sucursal_id)
    else if (compra.sucursal && sucursales?.length) {
      const found = sucursales.find((s) => s.nombre === compra.sucursal)
      setSucursalId(found?.id || "")
    } else setSucursalId("")

    setIsEditing(false)
  }

  // ✅ Validaciones antes de abrir confirm
  const validateBeforeConfirm = () => {
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      alert("Monto inválido. Debe ser 0 o mayor.")
      return false
    }
    return true
  }

  // ✅ Confirmar guardado
  const confirmarGuardar = async () => {
    try {
      if (!onUpdate) {
        alert("Falta conectar onUpdate en el componente padre (Compras.jsx).")
        return
      }

      const montoNum = Number(monto)
      if (!Number.isFinite(montoNum) || montoNum < 0) {
        alert("Monto inválido. Debe ser 0 o mayor.")
        return
      }

      setSaving(true)

      const payload = {
        monto: montoNum,
        estado, // vigente/anulada (DB)
        numero_folio: numeroFolio || null,
        fecha_compra: fechaCompra ? new Date(fechaCompra).toISOString() : null,
        sucursal_id: sucursalId || null,
      }

      await onUpdate(compra.id, payload)

      setConfirmOpen(false)
      setIsEditing(false)
      setValidadoOpen(true)

      window.setTimeout(() => {
        setValidadoOpen(false)
      }, 2200)
    } catch (e) {
      console.error(e)
      alert(e?.message || "No se pudo actualizar la compra")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl animate-scale-in overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Detalles de la compra</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Información completa del movimiento registrado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {/* Resumen principal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Monto</p>
              {!isEditing ? (
                <p className="text-xl font-bold">{formatCLP(compra.monto)}</p>
              ) : (
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "") {
                      setMonto("")
                      return
                    }
                    const num = Number(raw)
                    if (!Number.isFinite(num)) return
                    setMonto(String(Math.max(0, num)))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault()
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Puntos otorgados</p>
              <p className="text-xl font-bold text-primary inline-flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />+{Number(compra.puntos || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Se recalcula automáticamente.</p>
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Estado</p>

              {!isEditing ? (
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${estadoChipClass}`}
                >
                  {estadoLabel || "—"}
                </span>
              ) : (
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="vigente">Vigente</option>
                  <option value="anulada">Anulada</option>
                </select>
              )}
            </div>
          </div>

          {/* Datos */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border">
              <h3 className="font-semibold">Datos de la compra</h3>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Folio</p>
                {!isEditing ? (
                  <p className="font-mono font-medium">{compra.numero_folio || "—"}</p>
                ) : (
                  <input
                    value={numeroFolio}
                    onChange={(e) => setNumeroFolio(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 000123"
                  />
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                {!isEditing ? (
                  <p className="font-medium">{formatFecha(compra.fecha_compra)}</p>
                ) : (
                  <input
                    type="datetime-local"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Sucursal</p>
                {!isEditing ? (
                  <p className="font-medium">{compra.sucursal || "—"}</p>
                ) : (
                  <select
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">—</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Vendedor</p>
                <p className="font-medium">{compra.vendedor || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">No editable.</p>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border">
              <h3 className="font-semibold">Cliente</h3>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-lg font-bold">
                {compra.cliente_inicial || "?"}
              </div>

              <div className="min-w-0">
                <p className="font-semibold truncate">{compra.cliente_nombre || "—"}</p>
                <p className="text-sm text-muted-foreground truncate">{compra.cliente_rut || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border flex flex-col sm:flex-row gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cerrar
              </button>

              <button
                onClick={handleStartEdit}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-60"
              >
                <Ban className="w-4 h-4" />
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (!validateBeforeConfirm()) return
                  setConfirmOpen(true)
                }}
                disabled={saving}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          )}
        </div>

        {/* ✅ Confirmar edición */}
        <ConfirmDialog
          open={confirmOpen}
          title="Confirmar cambios"
          message="¿Deseas guardar los cambios realizados en esta compra?"
          confirmLabel={saving ? "Guardando..." : "Guardar"}
          cancelLabel="Cancelar"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmarGuardar}
        />

        {/* ✅ Validación OK */}
        <ValidadoCard
          open={validadoOpen}
          title="Acción realizada"
          message="Compra actualizada correctamente."
          onClose={() => setValidadoOpen(false)}
        />
      </div>
    </div>
  )
}
