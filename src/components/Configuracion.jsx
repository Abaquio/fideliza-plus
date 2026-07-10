import React, { useEffect, useMemo, useState } from "react"
import { Store, DollarSign } from "lucide-react"

// Ajusta estos imports si en tu proyecto están en otra ruta
import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token") || ""
}

export default function Configuracion() {
  /**
   * API_BASE blindado (no rompe prod/local)
   * - Si VITE_API_URL ya trae /api, se respeta
   * - Si no, se le agrega /api
   */
  const API_BASE = useMemo(() => {
    const fromEnv = import.meta?.env?.VITE_API_URL;
    let base = "";
    if (fromEnv) {
      base = String(fromEnv).replace(/\/$/, "");
    } else {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") base = "http://localhost:4000";
    }
    const raw = base;
    return raw.endsWith("/api") ? raw : `${raw}/api`
  }, [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Modo edición por sección
  const [editTienda, setEditTienda] = useState(false)
  const [editPuntos, setEditPuntos] = useState(false)

  // UI Confirm + Validado
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validadoOpen, setValidadoOpen] = useState(false)

  // Para saber qué sección pidió guardar (solo UX)
  const [seccionGuardar, setSeccionGuardar] = useState(null) // "tienda" | "puntos" | null

  // Form
  const [form, setForm] = useState({
    tienda_nombre: "",
    tienda_email: "",
    tienda_telefono: "",
    tienda_web: "",
    tienda_descripcion: "",
    puntos_por_cada_monto: 1,
    monto_base_puntos: 1000,
    puntos_bienvenida: 100,
  })

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }))

  const cargar = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      const token = getToken()

      const res = await fetch(`${API_BASE}/configuracion`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.message || "No se pudo cargar la configuración")
        setLoading(false)
        return
      }

      const cfg = data.data || {}
      setForm({
        tienda_nombre: cfg.tienda_nombre ?? "",
        tienda_email: cfg.tienda_email ?? "",
        tienda_telefono: cfg.tienda_telefono ?? "",
        tienda_web: cfg.tienda_web ?? "",
        tienda_descripcion: cfg.tienda_descripcion ?? "",
        puntos_por_cada_monto: cfg.puntos_por_cada_monto ?? 1,
        monto_base_puntos: cfg.monto_base_puntos ?? 1000,
        puntos_bienvenida: cfg.puntos_bienvenida ?? 100,
      })
    } catch (e) {
      setErrorMsg("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validarFront = () => {
    if (!form.tienda_nombre?.trim()) return "El nombre de la tienda es obligatorio"
    if (!form.tienda_email?.trim() || !form.tienda_email.includes("@")) return "Email de contacto inválido"

    const ppm = Number(form.puntos_por_cada_monto)
    const mbp = Number(form.monto_base_puntos)
    const pb = Number(form.puntos_bienvenida)

    if (!Number.isFinite(ppm) || ppm < 1) return "La tasa de puntos debe ser >= 1"
    if (!Number.isFinite(mbp) || mbp < 1) return "El monto base debe ser >= 1"
    if (!Number.isFinite(pb) || pb < 0) return "Los puntos de bienvenida deben ser >= 0"

    return ""
  }

  const onClickGuardarSeccion = (seccion) => {
    const msg = validarFront()
    if (msg) {
      setErrorMsg(msg)
      return
    }
    setSeccionGuardar(seccion)
    setConfirmOpen(true)
  }

  const guardar = async () => {
    setConfirmOpen(false)
    setSaving(true)
    setErrorMsg("")

    try {
      const token = getToken()

      // Guardamos la configuración completa (simple, robusto, no rompe nada)
      const payload = {
        tienda_nombre: form.tienda_nombre.trim(),
        tienda_email: form.tienda_email.trim(),
        tienda_telefono: form.tienda_telefono?.trim() || null,
        tienda_web: form.tienda_web?.trim() || null,
        tienda_descripcion: form.tienda_descripcion?.trim() || null,
        puntos_por_cada_monto: Math.floor(Number(form.puntos_por_cada_monto)),
        monto_base_puntos: Math.floor(Number(form.monto_base_puntos)),
        puntos_bienvenida: Math.floor(Number(form.puntos_bienvenida)),
      }

      const res = await fetch(`${API_BASE}/configuracion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.message || "No se pudo guardar la configuración")
        setSaving(false)
        return
      }

      // Refrescamos con lo que devuelve backend
      const cfg = data.data || {}
      setForm({
        tienda_nombre: cfg.tienda_nombre ?? "",
        tienda_email: cfg.tienda_email ?? "",
        tienda_telefono: cfg.tienda_telefono ?? "",
        tienda_web: cfg.tienda_web ?? "",
        tienda_descripcion: cfg.tienda_descripcion ?? "",
        puntos_por_cada_monto: cfg.puntos_por_cada_monto ?? 1,
        monto_base_puntos: cfg.monto_base_puntos ?? 1000,
        puntos_bienvenida: cfg.puntos_bienvenida ?? 100,
      })

      // Cerramos edición de la sección que estaba editando (o ambas por seguridad)
      if (seccionGuardar === "tienda") setEditTienda(false)
      if (seccionGuardar === "puntos") setEditPuntos(false)
      setSeccionGuardar(null)

      setValidadoOpen(true)
      window.setTimeout(() => setValidadoOpen(false), 2500)
    } catch (e) {
      setErrorMsg("Error de conexión con el servidor")
    } finally {
      setSaving(false)
    }
  }

  const cancelarEdicionTienda = async () => {
    setEditTienda(false)
    await cargar()
  }

  const cancelarEdicionPuntos = async () => {
    setEditPuntos(false)
    await cargar()
  }

  const inputDisabledClass = "opacity-70 cursor-not-allowed"
  const sectionDisabled = loading || saving

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Validado */}
      <ValidadoCard
        open={validadoOpen}
        title="Configuración guardada"
        message="Los cambios se guardaron correctamente."
        onClose={() => setValidadoOpen(false)}
      />

      {/* Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Guardar configuración"
        message={`¿Confirmas guardar los cambios de ${
          seccionGuardar === "tienda" ? "Información de la Tienda" : "Sistema de Puntos"
        }?`}
        confirmLabel={saving ? "Guardando..." : "Guardar"}
        cancelLabel="Cancelar"
        onCancel={() => {
          if (!saving) {
            setConfirmOpen(false)
            setSeccionGuardar(null)
          }
        }}
        onConfirm={guardar}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu tienda y sistema de fidelización</p>
      </div>

      {!!errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* ==========================
          Información de la Tienda
         ========================== */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Información de la Tienda
          </h2>

          {!editTienda ? (
            <button
              type="button"
              onClick={() => setEditTienda(true)}
              disabled={sectionDisabled}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelarEdicionTienda}
                disabled={sectionDisabled}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onClickGuardarSeccion("tienda")}
                disabled={sectionDisabled}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Tienda</label>
            <input
              type="text"
              value={form.tienda_nombre}
              onChange={(e) => setField("tienda_nombre", e.target.value)}
              disabled={!editTienda || sectionDisabled}
              className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                !editTienda ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email de Contacto</label>
            <input
              type="email"
              value={form.tienda_email}
              onChange={(e) => setField("tienda_email", e.target.value)}
              disabled={!editTienda || sectionDisabled}
              className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                !editTienda ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={form.tienda_telefono}
              onChange={(e) => setField("tienda_telefono", e.target.value)}
              placeholder="+56 9 0000 0000"
              disabled={!editTienda || sectionDisabled}
              className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                !editTienda ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sitio Web</label>
            <input
              type="url"
              value={form.tienda_web}
              onChange={(e) => setField("tienda_web", e.target.value)}
              placeholder="https://mitienda.com"
              disabled={!editTienda || sectionDisabled}
              className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                !editTienda ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              rows={3}
              value={form.tienda_descripcion}
              onChange={(e) => setField("tienda_descripcion", e.target.value)}
              placeholder="Dirección / descripción de la tienda"
              disabled={!editTienda || sectionDisabled}
              className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none resize-none ${
                !editTienda ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
              }`}
            />
          </div>
        </div>
      </div>

      {/* ======================
          Sistema de Puntos
         ====================== */}
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in animate-delay-100">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            Sistema de Puntos
          </h2>

          {!editPuntos ? (
            <button
              type="button"
              onClick={() => setEditPuntos(true)}
              disabled={sectionDisabled}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelarEdicionPuntos}
                disabled={sectionDisabled}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onClickGuardarSeccion("puntos")}
                disabled={sectionDisabled}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tasa de Conversión</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.puntos_por_cada_monto}
                  onChange={(e) => setField("puntos_por_cada_monto", e.target.value)}
                  disabled={!editPuntos || sectionDisabled}
                  className={`flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                    !editPuntos ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
                  }`}
                />
                <span className="text-sm text-muted-foreground">puntos por cada</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.monto_base_puntos}
                  onChange={(e) => setField("monto_base_puntos", e.target.value)}
                  disabled={!editPuntos || sectionDisabled}
                  className={`w-24 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                    !editPuntos ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
                  }`}
                />
                <span className="text-sm text-muted-foreground">$</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ej: {Number(form.puntos_por_cada_monto || 1)} punto(s) por cada ${Number(form.monto_base_puntos || 1000)} (CLP)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Puntos de Bienvenida</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.puntos_bienvenida}
                onChange={(e) => setField("puntos_bienvenida", e.target.value)}
                disabled={!editPuntos || sectionDisabled}
                className={`w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none ${
                  !editPuntos ? inputDisabledClass : "focus:ring-2 focus:ring-primary"
                }`}
              />
              <p className="text-xs text-muted-foreground mt-1">Puntos otorgados al registrarse</p>
            </div>
          </div>

          {/* Caja informativa (solo visual, no rompe diseño) */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-medium mb-3">Niveles de Cliente</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-chart-4/10 rounded">
                <span className="text-sm">🥇 Oro</span>
                <span className="text-sm font-medium">≥ 5000 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">🥈 Plata</span>
                <span className="text-sm font-medium">≥ 2000 pts</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                <span className="text-sm">🥉 Bronce</span>
                <span className="text-sm font-medium">{"< 2000 pts"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
