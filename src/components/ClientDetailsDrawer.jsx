"use client"

import { useEffect, useState } from "react"
import { X, User, Mail, Phone, BadgeInfo } from "lucide-react"

export default function ClientDetailsDrawer({ open, onClose, client, onEdit }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)

  // Carga detalle desde la API cuando se abre el drawer
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!open || !client?.id) {
        setDetail(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/clientes/${client.id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setDetail(data)
      } catch (e) {
        console.error("Detalle cliente:", e)
        if (!cancelled) setError("No se pudo cargar el detalle del cliente.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, client?.id])

  // Fuente única de datos para el render (sin romper diseño)
  const data = detail || client || {}

  const nombre = data.nombreCompleto || data.nombre_completo || "—"
  const rut = data.rut_formateado || data.rut || "—"
  const dv = data.dv || "—"
  const email = data.email || "—"
  const telefono = data.telefono || "—"
  const puntos = data.puntos ?? 0
  const compras = data.compras ?? 0

  // Iniciales para el avatar
  const iniciales =
    nombre && nombre !== "—"
      ? nombre
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase() ?? "")
          .join("") || "—"
      : "—"

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop (se mantiene borroso por el contenedor externo) */}
      <div
        className={`absolute inset-0 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer a la derecha (misma estructura y clases base) */}
      <aside
        className={`absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl border-l border-border transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header con gradiente y botón cerrar */}
        <div className="py-4 px-6 bg-gradient-to-r from-[#480048] via-[#601848] to-[#F07241] text-white flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detalles de cliente</h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/15 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
          {/* Cabecera con avatar y nombre */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] text-white flex items-center justify-center text-lg font-bold shadow-md">
              {iniciales}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-foreground truncate">{nombre}</div>
              <div className="text-sm text-muted-foreground">Cliente activo</div>
            </div>
          </div>

          {/* Estado de carga / error (no altera diseño principal) */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgeInfo className="w-4 h-4" />
              Cargando…
            </div>
          )}
          {error && !loading && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {/* Secciones (misma estructura visual) */}
          <div className="space-y-6">
            {/* Datos principales */}
            <section>
              <div className="text-xs font-semibold tracking-wide text-muted-foreground mb-3">
                DATOS PRINCIPALES
              </div>
              <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">NOMBRE COMPLETO</div>
                  <div className="text-sm font-medium text-foreground">{nombre}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">RUT</div>
                  <div className="text-sm font-medium text-foreground">{rut}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">DV</div>
                  <div className="text-sm font-medium text-foreground">{dv}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">PUNTOS</div>
                  <div className="text-sm font-medium text-foreground">{puntos}</div>
                </div>
              </div>
            </section>

            {/* Contacto */}
            <section>
              <div className="text-xs font-semibold tracking-wide text-muted-foreground mb-3">
                CONTACTO
              </div>
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">EMAIL</div>
                    <div className="text-sm font-medium text-foreground break-all">{email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">TELÉFONO</div>
                    <div className="text-sm font-medium text-foreground break-words">{telefono}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Acciones (mantiene estilos) */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => onEdit?.(data)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-[#480048] to-[#F07241] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#480048]/25 transition-all"
              >
                Editar cliente
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 border border-border rounded-lg bg-secondary hover:bg-secondary/80 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}