import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, Mail, Shield, Building2, Pencil, Save, X } from "lucide-react"

import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getAuthToken() {
  // ✅ igual que Clientes.jsx
  return localStorage.getItem("token") || localStorage.getItem("authToken") || ""
}

function getLocalUser() {
  // ✅ soporta distintas llaves por si en otra parte guardaste diferente
  const raw =
    localStorage.getItem("user") ||
    localStorage.getItem("usuario") ||
    localStorage.getItem("authUser") ||
    "{}"

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function fetchMe(token) {
  // ✅ probamos ambas rutas (según cómo montaste express)
  const candidates = [`${API_URL}/api/auth/me`, `${API_URL}/auth/me`]

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await resp.json().catch(() => ({}))
      if (resp.ok && json?.ok && json?.user) return json.user
    } catch {
      // seguimos con el siguiente
    }
  }

  return null
}

async function putMe(token, payload) {
  const candidates = [`${API_URL}/api/auth/me`, `${API_URL}/auth/me`]

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await resp.json().catch(() => ({}))
      if (resp.ok && json?.ok) return json.user || null
    } catch {
      // seguimos
    }
  }

  throw new Error("No se pudo actualizar el perfil (ruta /me no encontrada o backend no responde)")
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

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Listo")
  const [validadoMessage, setValidadoMessage] = useState("Perfil actualizado.")

  // ✅ Cargar perfil real del backend
  useEffect(() => {
    const run = async () => {
      const token = getAuthToken()
      if (!token) return

      setLoading(true)
      try {
        const me = await fetchMe(token)
        if (me) {
          setUser(me)
          localStorage.setItem("user", JSON.stringify(me))
          setForm({
            nombre: me?.nombre || "",
            email: me?.email || "",
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

  const onChange = (k) => (ev) => {
    const v = ev.target.value
    const next = { ...form, [k]: v }
    setForm(next)
    setErrors((prev) => ({ ...prev, ...validate(next) }))
  }

  const startEdit = () => {
    setIsEditing(true)
    setErrors({})
    setForm({
      nombre: user?.nombre || "",
      email: user?.email || "",
    })
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setErrors({})
    setForm({
      nombre: user?.nombre || "",
      email: user?.email || "",
    })
  }

  const canSave = useMemo(() => {
    const e = validate(form)
    return Object.keys(e).length === 0 && !loading
  }, [form, loading])

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
                  disabled={loading}
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

      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setValidadoOpen(false)}
      />
    </div>
  )
}
