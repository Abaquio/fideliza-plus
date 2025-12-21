import { useEffect, useMemo, useState } from "react"
import { Shield } from "lucide-react"
import {
  validarEmail,
  validarYNormalizarNombre,
} from "../../utils/validaciones"

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
      `Respuesta no-JSON (${res.status}) en ${url}. Primeros chars: ${text.slice(0, 120)}`
    )
  }

  const data = await res.json()
  return { res, data }
}

export default function CrearStaffModal({ open, onClose, onSaved, editingMember }) {
  const isEdit = !!editingMember

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rolId: "",
    sucursalId: "",
    activo: true,
  })

  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    rolId: false,
  })

  const [fieldErrors, setFieldErrors] = useState({
    nombre: "",
    email: "",
    rolId: "",
  })

  const [roles, setRoles] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  /* ================= RESET / PRELOAD ================= */
  useEffect(() => {
    if (!open) return

    if (editingMember) {
      setForm({
        nombre: editingMember.nombre || "",
        email: editingMember.email || "",
        password: "",
        rolId: editingMember.roles?.id || "",
        sucursalId: editingMember.sucursales?.id || "",
        activo: !!editingMember.activo,
      })
    } else {
      setForm({
        nombre: "",
        email: "",
        password: "",
        rolId: "",
        sucursalId: "",
        activo: true,
      })
    }

    setTouched({ nombre: false, email: false, rolId: false })
    setFieldErrors({ nombre: "", email: "", rolId: "" })

    const fetchMeta = async () => {
      try {
        setLoadingMeta(true)
        const API = getApiBase()
        const token = localStorage.getItem("token")

        const { data } = await safeJsonFetch(`${API}/api/staff/meta`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (data.ok) {
          setRoles(data.roles || [])
          setSucursales((data.sucursales || []).filter((s) => s.activo !== false))
        }
      } catch (e) {
        console.error("Error cargando roles/sucursales:", e)
      } finally {
        setLoadingMeta(false)
      }
    }

    fetchMeta()
  }, [open, editingMember])

  /* ================= VALIDACIONES EN VIVO ================= */

  const validateNombreLive = (value) => {
    if (!value?.trim()) return "El nombre es obligatorio"
    try {
      validarYNormalizarNombre(value)
      return ""
    } catch {
      return "Solo letras y espacios"
    }
  }

  const validateEmailLive = (value) => {
    if (!value?.trim()) return "El email es obligatorio"
    return validarEmail(value.trim())
      ? ""
      : "Email inválido (falta @ o dominio)"
  }

  const validateRolLive = (value) => {
    if (!value) return "Selecciona un rol"
    return ""
  }

  const canSubmit = useMemo(() => {
    return (
      !fieldErrors.nombre &&
      !fieldErrors.email &&
      !fieldErrors.rolId &&
      form.nombre.trim() &&
      form.email.trim() &&
      form.rolId &&
      (isEdit || form.password)
    )
  }, [fieldErrors, form, isEdit])

  if (!open) return null

  /* ================= HANDLERS ================= */

  const markTouched = (key) =>
    setTouched((p) => ({ ...p, [key]: true }))

  const handleChange = (key) => (e) => {
    const value = e.target.value
    setForm((p) => ({ ...p, [key]: value }))

    if (!touched[key]) return

    if (key === "nombre")
      setFieldErrors((p) => ({ ...p, nombre: validateNombreLive(value) }))
    if (key === "email")
      setFieldErrors((p) => ({ ...p, email: validateEmailLive(value) }))
    if (key === "rolId")
      setFieldErrors((p) => ({ ...p, rolId: validateRolLive(value) }))
  }

  const handleNombreBlur = () => {
    markTouched("nombre")
    try {
      const norm = validarYNormalizarNombre(form.nombre)
      setForm((p) => ({ ...p, nombre: norm }))
      setFieldErrors((p) => ({ ...p, nombre: "" }))
    } catch {
      setFieldErrors((p) => ({ ...p, nombre: "Solo letras y espacios" }))
    }
  }

  const handleEmailBlur = () => {
    markTouched("email")
    setFieldErrors((p) => ({ ...p, email: validateEmailLive(form.email) }))
  }

  const handleRolBlur = () => {
    markTouched("rolId")
    setFieldErrors((p) => ({ ...p, rolId: validateRolLive(form.rolId) }))
  }

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    setTouched({ nombre: true, email: true, rolId: true })

    const nombreErr = validateNombreLive(form.nombre)
    const emailErr = validateEmailLive(form.email)
    const rolErr = validateRolLive(form.rolId)

    setFieldErrors({ nombre: nombreErr, email: emailErr, rolId: rolErr })
    if (nombreErr || emailErr || rolErr) return

    try {
      setSaving(true)
      const API = getApiBase()
      const token = localStorage.getItem("token")

      const payload = {
        nombre: validarYNormalizarNombre(form.nombre),
        email: form.email.trim(),
        rol_id: form.rolId,
        sucursal_id: form.sucursalId || null,
        activo: form.activo,
      }

      if (!isEdit) payload.password = form.password

      const url = isEdit
        ? `${API}/api/staff/${editingMember.id}`
        : `${API}/api/staff`

      const method = isEdit ? "PUT" : "POST"

      const { data } = await safeJsonFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (data.ok) onSaved?.()
      else alert(data.message || "No se pudo guardar")
    } catch (e) {
      console.error("Error guardando staff:", e)
      alert("No se pudo guardar (revisa consola)")
    } finally {
      setSaving(false)
    }
  }

  const handleSendReset = async () => {
    try {
      setSendingReset(true)
      const API = getApiBase()
      const token = localStorage.getItem("token")

      const { data } = await safeJsonFetch(
        `${API}/api/staff/${editingMember.id}/reset-password`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.ok) alert("Correo enviado para cambiar contraseña")
      else alert(data.message || "No se pudo enviar")
    } catch (e) {
      console.error(e)
      alert("Error enviando correo")
    } finally {
      setSendingReset(false)
    }
  }

  const inputClass = (key) => {
    const base =
      "w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    return touched[key] && fieldErrors[key]
      ? `${base} border-destructive focus:ring-destructive`
      : base
  }

  const helper = (key) =>
    touched[key] && fieldErrors[key] ? (
      <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>
    ) : null

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold mb-4">
          {isEdit ? "Editar Miembro del Staff" : "Agregar Miembro del Staff"}
        </h2>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre completo</label>
            <input
              type="text"
              value={form.nombre}
              onChange={handleChange("nombre")}
              onBlur={handleNombreBlur}
              onFocus={() => markTouched("nombre")}
              className={inputClass("nombre")}
              placeholder="Ej: Roberto García"
            />
            {helper("nombre")}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              onBlur={handleEmailBlur}
              onFocus={() => markTouched("email")}
              className={inputClass("email")}
              placeholder="usuario@empresa.com"
            />
            {helper("email")}
          </div>

          {/* Password SOLO crear */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rol
            </label>
            <select
              value={form.rolId}
              onChange={handleChange("rolId")}
              onBlur={handleRolBlur}
              onFocus={() => markTouched("rolId")}
              className={inputClass("rolId")}
              disabled={loadingMeta}
            >
              <option value="">
                {loadingMeta ? "Cargando roles..." : "Seleccionar rol..."}
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            {helper("rolId")}
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium mb-2">Sucursal</label>
            <select
              value={form.sucursalId}
              onChange={(e) =>
                setForm((p) => ({ ...p, sucursalId: e.target.value }))
              }
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
              disabled={loadingMeta}
            >
              <option value="">
                {loadingMeta ? "Cargando sucursales..." : "Seleccionar sucursal..."}
              </option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm((p) => ({ ...p, activo: e.target.checked }))
              }
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm">Usuario activo</span>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : isEdit
                ? "Guardar Cambios"
                : "Crear Usuario"}
            </button>
          </div>

          {/* Reset password SOLO editar */}
          {isEdit && (
            <button
              onClick={handleSendReset}
              disabled={sendingReset}
              className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
            >
              {sendingReset
                ? "Enviando correo..."
                : "Enviar correo para cambiar contraseña"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
