"use client"

import { useEffect, useState, useMemo } from "react"
import { X, Pencil, Save, Ban, Calendar, User, Ticket } from "lucide-react"

import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

function formatFecha(fechaISO) {
  if (!fechaISO) return "—"
  const d = new Date(fechaISO)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-CL")
}

function safeLower(s) {
  return String(s || "").toLowerCase()
}

export default function DetallesMovimientoModal({ open, onClose, movimiento, onUpdate, cupones = [] }) {
  if (!open || !movimiento) return null

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados locales
  const [puntos, setPuntos] = useState("")
  const [cuponId, setCuponId] = useState("")

  // Modales internos
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validadoOpen, setValidadoOpen] = useState(false)

  useEffect(() => {
    setIsEditing(false)
    setSaving(false)
    setConfirmOpen(false)
    setValidadoOpen(false)

    setPuntos(String(movimiento.puntos || 0))
    setCuponId(movimiento.cupon_id || "")
  }, [movimiento, open])

  const isCanje = safeLower(movimiento.tipo) === "canje"

  // Filtrar cupones activos + el actual (por si el actual ya venció, que aparezca igual)
  const cuponesDisponibles = useMemo(() => {
    return cupones.filter(c => 
      c.id === movimiento.cupon_id || safeLower(c.estado) === 'activo'
    )
  }, [cupones, movimiento.cupon_id])

  const handleStartEdit = () => setIsEditing(true)

  const handleCancelEdit = () => {
    setPuntos(String(movimiento.puntos || 0))
    setCuponId(movimiento.cupon_id || "")
    setIsEditing(false)
  }

  // ✅ Al cambiar cupón, actualizamos el costo automáticamente
  const handleCuponChange = (e) => {
    const newId = e.target.value
    setCuponId(newId)

    if (newId) {
      const cup = cupones.find(c => c.id === newId)
      if (cup && cup.costo_puntos) {
        // Costo es negativo en movimientos
        setPuntos(String(-Math.abs(cup.costo_puntos)))
      }
    }
  }

  const validateBeforeConfirm = () => {
    const pt = Number(puntos)
    if (!Number.isFinite(pt) || !Number.isInteger(pt)) {
      alert("Los puntos deben ser un número entero.")
      return false
    }
    if (pt === 0) {
      alert("El movimiento no puede ser 0.")
      return false
    }
    if (isCanje && !cuponId) {
      alert("Debes seleccionar un cupón para un movimiento de canje.")
      return false
    }
    return true
  }

  const confirmarGuardar = async () => {
    try {
      if (!onUpdate) return
      setSaving(true)

      const payload = {
        puntos: Number(puntos),
        // Si es canje enviamos el nuevo cupón, si no, undefined
        cupon_id: isCanje ? cuponId : undefined
      }

      await onUpdate(movimiento.id, payload)

      setConfirmOpen(false)
      setIsEditing(false)
      setValidadoOpen(true)
      
      setTimeout(() => setValidadoOpen(false), 2200)

    } catch (e) {
      console.error(e)
      alert(e?.message || "Error al actualizar movimiento")
    } finally {
      setSaving(false)
    }
  }

  const tipoLabel = isCanje ? "Canje de Cupón" : "Ajuste Manual"
  const tipoColor = isCanje ? "text-purple-600 bg-purple-50" : "text-blue-600 bg-blue-50"

  // Buscar info del cupón seleccionado actual (para mostrar nombre/código en select)
  const selectedCuponInfo = cupones.find(c => c.id === cuponId)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-xl animate-scale-in overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Detalle del Movimiento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? "Editando información..." : "Información del ajuste o canje realizado."}
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
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Tarjeta Principal */}
          <div className="flex gap-4">
            <div className="flex-1 bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Puntos</p>
              {!isEditing ? (
                <p className={`text-2xl font-bold ${Number(movimiento.puntos) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {Number(movimiento.puntos) > 0 ? "+" : ""}{movimiento.puntos}
                </p>
              ) : (
                <input
                  type="number"
                  step="1"
                  value={puntos}
                  // Si es canje, preferimos que se actualice solo al cambiar cupón, pero permitimos editar manual si hace falta
                  onChange={(e) => setPuntos(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-bold text-xl"
                />
              )}
            </div>

            <div className="flex-1 bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-center">
               <span className={`self-start px-3 py-1 rounded-full text-xs font-bold ${tipoColor}`}>
                 {tipoLabel}
               </span>
               {isCanje && !isEditing && (
                 <p className="text-xs text-muted-foreground mt-2">
                   Código: <span className="font-mono text-foreground">{movimiento.cupon_codigo || "—"}</span>
                 </p>
               )}
            </div>
          </div>

          {/* Selector de Cupón (Solo visible en Edit + Canje) */}
          {isEditing && isCanje && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
              <label className="text-sm font-medium text-purple-900 mb-2 block-flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Cambiar Cupón
              </label>
              <select
                value={cuponId}
                onChange={handleCuponChange}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">Selecciona un cupón...</option>
                {cuponesDisponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} — {c.tipo_descuento === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`} (Costo: {c.costo_puntos})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Al cambiar el cupón, los puntos se actualizarán automáticamente a su costo.
              </p>
            </div>
          )}

          {/* Datos Generales */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
             <div className="p-4 border-b border-border bg-muted/20">
               <h3 className="font-semibold text-sm">Información General</h3>
             </div>
             <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
               
               <div>
                 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                   <Calendar className="w-3 h-3" /> Fecha
                 </p>
                 <p className="text-sm font-medium">{formatFecha(movimiento.creado_en)}</p>
               </div>

               <div>
                 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                   <User className="w-3 h-3" /> Usuario Responsable
                 </p>
                 <p className="text-sm font-medium">{movimiento.usuario_nombre || "—"}</p>
               </div>

               {/* Info estática del cupón original o seleccionado */}
               {isCanje && (
                 <div className="col-span-2 pt-2 border-t border-border mt-2">
                   <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                     <Ticket className="w-3 h-3" /> Detalles del Cupón
                   </p>
                   {isEditing && selectedCuponInfo ? (
                      <p className="text-sm text-purple-700 font-medium">
                        Nuevo: {selectedCuponInfo.codigo} — Costo {selectedCuponInfo.costo_puntos} pts
                      </p>
                   ) : (
                      movimiento.cupones ? (
                        <p className="text-sm">
                          {movimiento.cupones.codigo} ({movimiento.cupones.tipo_descuento}) · Valor: {movimiento.cupones.valor}
                        </p>
                      ) : <p className="text-sm text-muted-foreground italic">Cupón eliminado o no encontrado</p>
                   )}
                 </div>
               )}

             </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
              {movimiento.cliente_inicial || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{movimiento.cliente_nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{movimiento.cliente_rut}</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex flex-col sm:flex-row gap-3">
          {!isEditing ? (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cerrar
            </button>
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
                  if (validateBeforeConfirm()) setConfirmOpen(true)
                }}
                disabled={saving}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}
        </div>

        {/* Dialogs internos */}
        <ConfirmDialog
          open={confirmOpen}
          title="Guardar cambios"
          message="¿Estás seguro de modificar este movimiento? Esto afectará el saldo del cliente."
          confirmLabel={saving ? "Guardando..." : "Sí, guardar"}
          cancelLabel="Cancelar"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmarGuardar}
        />

        <ValidadoCard
          open={validadoOpen}
          title="Actualizado"
          message="El movimiento ha sido actualizado correctamente."
          onClose={() => setValidadoOpen(false)}
        />

      </div>
    </div>
  )
}