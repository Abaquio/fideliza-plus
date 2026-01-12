import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building2,
  Pencil,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react"

import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function safeParse(raw) {
  try {
    return JSON.parse(raw || "{}")
  } catch {
    return {}
  }
}

function getAuthToken() {
  const keys = ["token", "authToken", "access_token", "accessToken", "sb-access-token"]
  for (const k of keys) {
    const a = localStorage.getItem(k)
    if (a) return a
    const b = sessionStorage.getItem(k)
    if (b) return b
  }
  const u = safeParse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}")
  if (u?.token) return u.token
  if (u?.access_token) return u.access_token
  return ""
}

function getLocalUser() {
  const rawLocal =
    localStorage.getItem("user") ||
    localStorage.getItem("usuario") ||
    localStorage.getItem("authUser")
  const rawSession =
    sessionStorage.getItem("user") ||
    sessionStorage.getItem("usuario") ||
    sessionStorage.getItem("authUser")

  const u = safeParse(rawLocal || rawSession)
  return u && typeof u === "object" ? u : {}
}

function pickUserFromJson(json) {
  return json?.user || json?.data || null
}

function clearSession() {
  const keys = [
    "token",
    "authToken",
    "access_token",
    "accessToken",
    "refresh_token",
    "refreshToken",
    "sb-access-token",
    "sb-refresh-token",
    "user",
    "usuario",
    "authUser",
  ]

  keys.forEach((k) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })

  window.dispatchEvent(new Event("logout"))
  window.dispatchEvent(new Event("profile-updated"))
}

async function fetchMe(token) {
  const candidates = [`${API_URL}/api/auth/me`, `${API_URL}/auth/me`, `${API_URL}/api/me`]
  let lastError = null

  for (const url of candidates) {
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await resp.json().catch(() => ({}))
      const picked = pickUserFromJson(json)

      if (resp.ok && (json?.ok === true || typeof json?.ok === "undefined") && picked) {
        return { user: picked, from: url }
      }

      lastError = { url, status: resp.status, message: json?.message || "No se pudo cargar /me" }
    } catch (e) {
      lastError = { url, status: 0, message: e?.message || "Error de red" }
    }
  }

  return { user: null, error: lastError }
}

async function putMe(token, payload) {
  const candidates = [`${API_URL}/api/auth/me`, `${API_URL}/auth/me`, `${API_URL}/api/me`]
  let lastError = null

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await resp.json().catch(() => ({}))
      const picked = pickUserFromJson(json)

      if (resp.ok && json?.ok) return picked || null

      lastError = { url, status: resp.status, message: json?.message || "No se pudo actualizar /me" }
    } catch (e) {
      lastError = { url, status: 0, message: e?.message || "Error de red" }
    }
  }

  throw new Error(
    lastError
      ? `${lastError.message} (status ${lastError.status || "?"} en ${lastError.url})`
      : "No se pudo actualizar el perfil"
  )
}

async function changePassword(token, payload) {
  const url = `${API_URL}/api/auth/me/password`

  const resp = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })

  const json = await resp.json().catch(() => ({}))
  if (!resp.ok || !json?.ok) {
    throw new Error(json?.message || "No se pudo cambiar la contraseña")
  }
  return true
}

export default function PerfilFull() {
  const navigate = useNavigate()

  const initialUser = useMemo(() => getLocalUser(), [])
  const [user, setUser] = useState(initialUser)

  const [loading, setLoading] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    nombre: initialUser?.nombre || initialUser?.name || "",
    email: initialUser?.email || "",
  })
  const [errors, setErrors] = useState({})

  // Password state
  const [pwMode, setPwMode] = useState(false)
  const [pw, setPw] = useState({ actual: "", nueva: "", confirmar: "" })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)

  const [showPwActual, setShowPwActual] = useState(false)
  const [showPwNueva, setShowPwNueva] = useState(false)
  const [showPwConfirmar, setShowPwConfirmar] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Listo")
  const [validadoMessage, setValidadoMessage] = useState("Perfil actualizado.")

  const [confirmPwOpen, setConfirmPwOpen] = useState(false)

  useEffect(() => {
    const run = async () => {
      const token = getAuthToken()
      if (!token) {
        setErrors({ _global: "No hay sesión activa. Vuelve a iniciar sesión." })
        return
      }

      setLoading(true)
      try {
        const result = await fetchMe(token)

        if (result?.user) {
          setUser(result.user)
          localStorage.setItem("user", JSON.stringify(result.user))
          window.dispatchEvent(new Event("profile-updated"))

          setForm({
            nombre: result.user?.nombre || "",
            email: result.user?.email || "",
          })
          setErrors({})
          return
        }

        if (result?.error) {
          const e = result.error
          setErrors({
            _global: `No se pudo cargar el perfil (status ${e.status || "?"}). ${e.message}`,
          })
        }
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const nombre = user?.nombre || user?.name || "Usuario"
  const email = user?.email || "-"
  const rol = user?.rol || "-"
  const sucursal = user?.sucursal_nombre || user?.sucursal_id || "-"

  const validate = (next = form) => {
    const e = {}
    if (!next.nombre?.trim()) e.nombre = "El nombre es obligatorio"

    if (next.email?.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim())
      if (!ok) e.email = "Email inválido"
    }
    return e
  }

  const validatePw = (next = pw) => {
    const e = {}
    const min = 8
    const max = 12

    if (!next.actual) e.actual = "Ingresa tu contraseña actual"
    if (!next.nueva) e.nueva = "Ingresa una nueva contraseña"
    if (!next.confirmar) e.confirmar = "Confirma la nueva contraseña"

    if (next.nueva) {
      if (next.nueva.length < min || next.nueva.length > max) {
        e.nueva = `Debe tener entre ${min} y ${max} caracteres`
      }
    }

    if (next.confirmar) {
      if (next.confirmar.length < min || next.confirmar.length > max) {
        e.confirmar = `Debe tener entre ${min} y ${max} caracteres`
      }
    }

    if (next.nueva && next.confirmar && next.nueva !== next.confirmar) {
      e.confirmar = "No coincide con la nueva contraseña"
    }

    if (next.actual && next.nueva && next.actual === next.nueva) {
      e.nueva = "La nueva contraseña debe ser distinta"
    }

    return e
  }

  const onChange = (k) => (ev) => {
    const v = ev.target.value
    const next = { ...form, [k]: v }
    setForm(next)
    setErrors((prev) => ({ ...prev, ...validate(next) }))
  }

  const onChangePw = (k) => (ev) => {
    const v = ev.target.value
    const next = { ...pw, [k]: v }
    setPw(next)
    setPwErrors(validatePw(next))
  }

  const startEdit = () => {
    setIsEditing(true)
    setErrors({})
    setForm({
      nombre: user?.nombre || "",
      email: user?.email || "",
    })

    setPwMode(false)
    setPw({ actual: "", nueva: "", confirmar: "" })
    setPwErrors({})
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setErrors({})
    setForm({
      nombre: user?.nombre || "",
      email: user?.email || "",
    })

    setPwMode(false)
    setPw({ actual: "", nueva: "", confirmar: "" })
    setPwErrors({})
  }

  const canSave = useMemo(() => {
    const e = validate(form)
    return Object.keys(e).length === 0 && !loading
  }, [form, loading])

  const canSavePw = useMemo(() => {
    if (!pwMode) return false
    const e = validatePw(pw)
    return Object.keys(e).length === 0 && !pwLoading
  }, [pw, pwMode, pwLoading])

  const doSave = async () => {
    const token = getAuthToken()
    if (!token) {
      setErrors({ _global: "Sesión no válida. Vuelve a iniciar sesión." })
      return
    }

    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    try {
      const updated =
        (await putMe(token, {
          nombre: form.nombre?.trim(),
          email: form.email?.trim() || null,
        })) || {
          ...user,
          nombre: form.nombre?.trim(),
          email: form.email?.trim() || user?.email,
        }

      setUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
      window.dispatchEvent(new Event("profile-updated"))

      setIsEditing(false)
      setValidadoTitle("Perfil actualizado")
      setValidadoMessage("Los cambios se guardaron correctamente.")
      setValidadoOpen(true)
    } catch (err) {
      setErrors({ _global: err?.message || "No se pudo actualizar el perfil" })
    } finally {
      setLoading(false)
    }
  }

  const doSavePassword = async () => {
    const token = getAuthToken()
    if (!token) {
      setPwErrors({ _global: "Sesión no válida. Vuelve a iniciar sesión." })
      return
    }

    const e = validatePw(pw)
    setPwErrors(e)
    if (Object.keys(e).length > 0) return

    setPwLoading(true)
    try {
      await changePassword(token, {
        actual: pw.actual,
        nueva: pw.nueva,
      })

      // ✅ Al cambiar contraseña: cerrar sesión y volver a login
      clearSession()
      navigate("/login", { replace: true })
    } catch (err) {
      setPwErrors({ _global: err?.message || "No se pudo cambiar la contraseña" })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="p-6 animate-slide-in-left">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Volver"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">Perfil</h1>
          <p className="text-sm text-muted-foreground">Revisa y actualiza tu información.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm w-full max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-7 h-7" />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-semibold truncate">{nombre}</p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              {loading ? <p className="text-xs text-muted-foreground mt-1">Cargando perfil...</p> : null}
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
                  disabled={loading || pwLoading}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                  disabled={!canSave}
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </>
            )}
          </div>
        </div>

        {errors?._global ? (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            {errors._global}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Nombre
            </p>

            {!isEditing ? (
              <p className="text-sm font-medium">{nombre}</p>
            ) : (
              <>
                <input
                  value={form.nombre}
                  onChange={onChange("nombre")}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tu nombre"
                />
                {errors.nombre ? <p className="text-xs text-destructive mt-1">{errors.nombre}</p> : null}
              </>
            )}
          </div>

          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </p>

            {!isEditing ? (
              <p className="text-sm font-medium">{email}</p>
            ) : (
              <>
                <input
                  value={form.email}
                  onChange={onChange("email")}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="correo@dominio.cl"
                />
                {errors.email ? <p className="text-xs text-destructive mt-1">{errors.email}</p> : null}
              </>
            )}
          </div>

          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" /> Rol
            </p>
            <p className="text-sm font-medium mt-1">{rol}</p>
          </div>

          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Sucursal
            </p>
            <p className="text-sm font-medium mt-1">{String(sucursal)}</p>
          </div>
        </div>

        {/* Contraseña */}
        <div className="mt-4 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Contraseña
            </p>

            {isEditing ? (
              <button
                onClick={() => {
                  setPwMode((v) => !v)
                  setPwErrors({})
                  setPw({ actual: "", nueva: "", confirmar: "" })
                }}
                className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {pwMode ? "Ocultar" : "Cambiar contraseña"}
              </button>
            ) : null}
          </div>

          {!pwMode ? (
            <p className="text-sm font-medium mt-2">************</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <input
                  type={showPwActual ? "text" : "password"}
                  value={pw.actual}
                  onChange={onChangePw("actual")}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="Actual"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPwActual((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {pwErrors.actual ? <p className="text-xs text-destructive mt-1">{pwErrors.actual}</p> : null}
              </div>

              <div className="relative">
                <input
                  type={showPwNueva ? "text" : "password"}
                  value={pw.nueva}
                  onChange={onChangePw("nueva")}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="Nueva (8-12)"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPwNueva((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {pwErrors.nueva ? <p className="text-xs text-destructive mt-1">{pwErrors.nueva}</p> : null}
              </div>

              <div className="relative">
                <input
                  type={showPwConfirmar ? "text" : "password"}
                  value={pw.confirmar}
                  onChange={onChangePw("confirmar")}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="Confirmar"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPwConfirmar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {pwErrors.confirmar ? <p className="text-xs text-destructive mt-1">{pwErrors.confirmar}</p> : null}
              </div>

              {pwErrors?._global ? (
                <div className="sm:col-span-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                  {pwErrors._global}
                </div>
              ) : null}

              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => setConfirmPwOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                  disabled={!canSavePw}
                >
                  <Save className="w-4 h-4" />
                  {pwLoading ? "Guardando..." : "Guardar contraseña"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Detalles</p>
          <div className="text-sm text-muted-foreground space-y-1 break-words">
            <p>
              <span className="text-foreground font-medium">Perfil ID:</span> {user?.perfil_id || "-"}
            </p>
            <p>
              <span className="text-foreground font-medium">Auth UID:</span> {user?.auth_uid || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Confirm guardar perfil */}
      <ConfirmDialog
        open={confirmOpen}
        title="Guardar cambios"
        message="¿Estás seguro de actualizar tu perfil?"
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false)
          await doSave()
        }}
      />

      {/* Confirm cambiar contraseña (avisa cierre de sesión) */}
      <ConfirmDialog
        open={confirmPwOpen}
        title="Cambiar contraseña"
        message={
          "¿Deseas cambiar tu contraseña?\n\n" +
          "⚠️ Importante: al cambiarla se cerrará tu sesión automáticamente y tendrás que iniciar sesión con tus nuevas credenciales."
        }
        confirmLabel="Cambiar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmPwOpen(false)}
        onConfirm={async () => {
          setConfirmPwOpen(false)
          await doSavePassword()
        }}
      />

      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setValidadoOpen(false)}
      />
    </div>
  )
}
