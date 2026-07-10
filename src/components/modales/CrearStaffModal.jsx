import { useEffect, useMemo, useState } from "react"
import { Shield } from "lucide-react"
import { validarEmail, validarYNormalizarNombre } from "../../utils/validaciones"
import ConfirmDialog from "../../ui/confirm"

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

  const [confirmOpen, setConfirmOpen] = useState(false)

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
    setConfirmOpen(false)

    const fetchMeta = async () => {
      try {
        setLoadingMeta(true)
        const API = getApiBase()
        const token = getToken()

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
    return validarEmail(value.trim()) ? "" : "Email inválido (falta @ o dominio)"
  }

  const validateRolLive = (value) => {
    if (!value) return "Selecciona un rol"
    return ""
  }

  const canSubmit = useMemo(() => {
    const baseOk =
      !fieldErrors.nombre &&
      !fieldErrors.email &&
      !fieldErrors.rolId &&
      form.nombre?.trim() && // Optional chaining por seguridad
      form.email?.trim() &&
      form.rolId

    if (!isEdit) return baseOk && !!form.password
    return baseOk
  }, [fieldErrors, form, isEdit])

  if (!open) return null

  const markTouched = (key) => setTouched((p) => ({ ...p, [key]: true }))

  const handleChange = (key) => (e) => {
    const value = e.target.value
    setForm((p) => ({ ...p, [key]: value }))

    if (!touched[key]) return

    if (key === "nombre") setFieldErrors((p) => ({ ...p, nombre: validateNombreLive(value) }))
    if (key === "email") setFieldErrors((p) => ({ ...p, email: validateEmailLive(value) }))
    if (key === "rolId") setFieldErrors((p) => ({ ...p, rolId: validateRolLive(value) }))
  }

  // ✅ CORRECCIÓN 1: Manejo de objeto vs string en Blur
  const handleNombreBlur = () => {
    markTouched("nombre")
    try {
      const resultado = validarYNormalizarNombre(form.nombre)
      
      // Si la función devuelve un objeto {valor:..., valido:true}, extraemos el valor
      const nombreLimpio = (typeof resultado === 'object' && resultado.valor) 
        ? resultado.valor 
        : resultado

      setForm((p) => ({ ...p, nombre: nombreLimpio }))
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

  const doSubmit = async () => {
    try {
      setSaving(true)
      const API = getApiBase()
      const token = getToken()

      // ✅ CORRECCIÓN 2: Asegurar que enviamos un string al backend
      let nombreFinal = form.nombre.trim();
      let nombreFinal = String(form.nombre || '').trim();
      try {
         const resultado = validarYNormalizarNombre(form.nombre);
         const resultado = validarYNormalizarNombre(nombreFinal);
         nombreFinal = (typeof resultado === 'object' && resultado.valor) 
            ? resultado.valor 
            : resultado;
      } catch (e) {
         // Si falla pero forzamos envío, usamos lo que hay en el input
         // Si la validación falla, al menos nos aseguramos de que `nombreFinal` es un string.
      }

      const payload = {
        nombre: nombreFinal, // Ahora va limpio
        email: form.email.trim(),
        rol_id: form.rolId,
        sucursal_id: form.sucursalId || null,
        activo: form.activo,
      }

      if (!isEdit) payload.password = form.password
      else if (form.password?.trim()) payload.password = form.password

      const url = isEdit ? `${API}/api/staff/${editingMember.id}` : `${API}/api/staff`
      const method = isEdit ? "PUT" : "POST"

      const { data } = await safeJsonFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (data.ok) {
        onSaved?.({ action: isEdit ? "edit" : "create" })
      } else {
        alert(data.message || "No se pudo guardar")
      }
    } catch (e) {
      console.error("Error guardando staff:", e)
      alert("No se pudo guardar (revisa consola)")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setTouched({ nombre: true, email: true, rolId: true })

    const nombreErr = validateNombreLive(form.nombre)
    const emailErr = validateEmailLive(form.email)
    const rolErr = validateRolLive(form.rolId)

    setFieldErrors({ nombre: nombreErr, email: emailErr, rolId: rolErr })
    if (nombreErr || emailErr || rolErr) return

    setConfirmOpen(true)
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

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title={isEdit ? "Confirmar edición" : "Confirmar creación"}
        message={
          isEdit
            ? "¿Confirmas guardar los cambios de este miembro del staff?"
            : "¿Confirmas crear este usuario de staff?"
        }
        confirmLabel={isEdit ? "Sí, guardar" : "Sí, crear"}
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          doSubmit()
        }}
      />

      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
          <h2 className="text-2xl font-bold mb-4">
            {isEdit ? "Editar Miembro del Staff" : "Agregar Miembro del Staff"}
          </h2>

          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña {isEdit ? "(opcional)" : ""}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                placeholder={isEdit ? "Dejar vacío para no cambiar" : "••••••••"}
              />
            </div>

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
                <option value="">{loadingMeta ? "Cargando roles..." : "Seleccionar rol..."}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              {helper("rolId")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sucursal</label>
              <select
                value={form.sucursalId}
                onChange={(e) => setForm((p) => ({ ...p, sucursalId: e.target.value }))}
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Usuario activo</span>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-60"
              >
                {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Usuario"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}