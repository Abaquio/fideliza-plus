"use client"

import { useEffect, useMemo, useState } from "react"
import {
  X,
  User,
  Mail,
  Phone,
  IdCard,
  Shield,
  Calendar,
  Star,
  Database, // ✅ NUEVO
} from "lucide-react"

function formatWhen(ts) {
  if (!ts) return "-"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("es-CL")
}

function formatDate(ts) {
  if (!ts) return "-"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("es-CL")
}

function computeTier(points) {
  if (points >= 7000) return "Oro"
  if (points >= 4000) return "Plata"
  return "Bronce"
}

function getTierColor(tier) {
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

function safeText(v) {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s.length ? s : "-"
}

/** 🔹 Obtiene el nombre de la fuente sin romper nada */
function getFuenteNombre(cliente) {
  return (
    cliente?.fuente_nombre ||
    cliente?.fuente?.nombre ||
    cliente?.fuente ||
    "-"
  )
}

export default function VerClienteModal({ open, cliente, onClose }) {
  const [c, setC] = useState(null)

  useEffect(() => {
    if (!open) return
    setC(cliente || null)
  }, [open, cliente])

  const tier = useMemo(
    () => computeTier(Number(c?.points || c?.puntos_total || 0)),
    [c]
  )

  const joined = useMemo(
    () => (c?.creado_en ? formatDate(c.creado_en) : c?.joined || "-"),
    [c]
  )

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      {/* Modal tamaño L */}
      <div
        className="
          bg-card border border-border rounded-xl p-6 w-full max-w-3xl animate-scale-in
          max-h-[90vh] overflow-y-auto overscroll-contain
        "
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Perfil del cliente</h2>
            <p className="text-sm text-muted-foreground">
              Vista completa del perfil y métricas.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top card */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
                {safeText(c?.nombres)?.charAt(0) || "C"}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">
                  {safeText(
                    `${c?.nombres || ""} ${c?.apellidos || ""}`.trim()
                  )}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getTierColor(
                      tier
                    )}`}
                  >
                    {tier}
                  </span>

                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                      c?.estado === "bloqueado"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-primary/10 text-primary border-primary/30"
                    }`}
                  >
                    {c?.estado === "bloqueado" ? "Bloqueado" : "Activo"}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Cliente desde {joined}
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xl font-bold text-primary">
                  {Number(c?.points || c?.puntos_total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Puntos</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xl font-bold">
                  {Number(c?.purchases || c?.compras_total || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Compras</p>
              </div>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identidad */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">Identidad</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <IdCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">RUT</p>
                  <p className="text-sm font-medium">{safeText(c?.rut)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="text-sm font-medium">
                    {safeText(
                      `${c?.nombres || ""} ${c?.apellidos || ""}`.trim()
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="text-sm font-medium">
                    {c?.estado === "bloqueado" ? "Bloqueado" : "Activo"}
                  </p>
                </div>
              </div>

              {/* ✅ NUEVO: Fuente */}
              <div className="flex items-start gap-3">
                <Database className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fuente</p>
                  <p className="text-sm font-medium">
                    {safeText(getFuenteNombre(c))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">Contacto</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">
                    {safeText(c?.email)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">
                    {safeText(c?.telefono)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fidelización */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">Fidelización</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nivel</p>
                  <p className="text-sm font-medium">{tier}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Creado en</p>
                  <p className="text-sm font-medium">
                    {c?.creado_en ? formatWhen(c.creado_en) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actividad */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">Actividad</p>
            <p className="text-sm text-muted-foreground">
              Aquí podemos mostrar últimas compras, movimientos de puntos y
              cupones cuando conectemos esos endpoints.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
