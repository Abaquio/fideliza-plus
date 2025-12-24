"use client"

import { useEffect, useMemo, useState } from "react"
import {
  normalizarRut,
  validarRut,
  validarYNormalizarRut,
  validarYNormalizarNombre,
  validarEmail,
  validarYNormalizarTelefono,
} from "../../utils/validaciones"

export default function NuevoClienteModal({
  open,
  onClose,
  onSubmit,
  onCheckRut,     // ✅ NUEVO
  onReactivar,    // ✅ NUEVO
  isSaving = false,
}) {
  const [form, setForm] = useState({
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
  })

  const [touched, setTouched] = useState({
    rut: false,
    nombres: false,
    apellidos: false,
    email: false,
    telefono: false,
  })

  const [fieldErrors, setFieldErrors] = useState({
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
  })

  const [submitError, setSubmitError] = useState("")

  // ✅ NUEVO: info de RUT existente
  const [existingCliente, setExistingCliente] = useState(null)
  const [checkingRut, setCheckingRut] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ rut: "", nombres: "", apellidos: "", email: "", telefono: "" })
      setTouched({ rut: false, nombres: false, apellidos: false, email: false, telefono: false })
      setFieldErrors({ rut: "", nombres: "", apellidos: "", email: "", telefono: "" })
      setSubmitError("")
      setExistingCliente(null)
      setCheckingRut(false)
    }
  }, [open])

  const canSubmit = useMemo(() => {
    return (
      form.rut.trim() &&
      form.nombres.trim() &&
      !fieldErrors.rut &&
      !fieldErrors.nombres &&
      !fieldErrors.email &&
      !fieldErrors.telefono
    )
  }, [form, fieldErrors])

  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const markTouched = (key) => {
    setTouched((p) => ({ ...p, [key]: true }))
  }

  const setError = (key, msg) => {
    setFieldErrors((p) => ({ ...p, [key]: msg }))
  }

  const validateRutLive = (value) => {
    if (!value?.trim()) return "El RUT es obligatorio"

    const n = normalizarRut(value)
    const limpio = (value || "").toUpperCase().replace(/[^0-9K]/g, "")
    if (limpio.length < 2) return "Completa RUT + dígito verificador"
    if (!validarRut(n)) return "RUT inválido (DV no coincide)"
    return ""
  }

  const validateNombre = (value) => {
    if (!value?.trim()) return "El nombre es obligatorio"
    const norm = value.trim().replace(/\s+/g, " ")
    if (norm.length < 2) return "Nombre muy corto"
    return ""
  }

  const validateEmailLive = (value) => {
    if (!value?.trim()) return ""
    if (!validarEmail(value.trim())) return "Email inválido (falta @ o dominio)"
    return ""
  }

  const validateTelefonoLive = (value) => {
    if (!value?.trim()) return ""
    try {
      validarYNormalizarTelefono(value)
      return ""
    } catch {
      return "Teléfono inválido (ej: +56912345678)"
    }
  }

  const handleChange = (key) => (e) => {
    const next = e.target.value
    setForm((prev) => ({ ...prev, [key]: next }))

    if (!touched[key]) return

    if (key === "rut") setError("rut", validateRutLive(next))
    if (key === "nombres") setError("nombres", validateNombre(next))
    if (key === "email") setError("email", validateEmailLive(next))
    if (key === "telefono") setError("telefono", validateTelefonoLive(next))
  }

  // ✅ NUEVO: check rut en backend (solo si es válido)
  const checkRutExists = async (rutFormatted) => {
    if (!onCheckRut) return
    setCheckingRut(true)
    try {
      const rutNorm = validarYNormalizarRut(rutFormatted)
      const found = await onCheckRut(rutNorm)
      setExistingCliente(found || null)
    } catch {
      // si falla el check, no rompemos UX
      setExistingCliente(null)
    } finally {
      setCheckingRut(false)
    }
  }

  const handleRutBlur = async () => {
    markTouched("rut")
    if (!form.rut) {
      setError("rut", "El RUT es obligatorio")
      return
    }

    const formatted = normalizarRut(form.rut)
    setForm((prev) => ({ ...prev, rut: formatted }))

    const rutErr = validateRutLive(formatted)
    setError("rut", rutErr)
    if (rutErr) {
      setExistingCliente(null)
      return
    }

    // ✅ check existencia
    await checkRutExists(formatted)
  }

  const handleNombreBlur = () => {
    markTouched("nombres")
    const norm = validarYNormalizarNombre(form.nombres || "")
    setForm((p) => ({ ...p, nombres: norm }))
    setError("nombres", validateNombre(norm))
  }

  const handleApellidosBlur = () => {
    markTouched("apellidos")
    if (!form.apellidos) {
      setError("apellidos", "")
      return
    }
    const norm = validarYNormalizarNombre(form.apellidos)
    setForm((p) => ({ ...p, apellidos: norm }))
    setError("apellidos", "")
  }

  const handleEmailBlur = () => {
    markTouched("email")
    setError("email", validateEmailLive(form.email))
  }

  const handleTelefonoFocus = () => {
    if (!form.telefono) {
      setForm((p) => ({ ...p, telefono: "+56" }))
    }
  }

  const handleTelefonoBlur = () => {
    markTouched("telefono")
    if (!form.telefono?.trim()) {
      setError("telefono", "")
      return
    }

    try {
      const tel = validarYNormalizarTelefono(form.telefono)
      setForm((p) => ({ ...p, telefono: tel }))
      setError("telefono", "")
    } catch {
      setError("telefono", "Teléfono inválido (ej: +56912345678)")
    }
  }

  const inputClass = (key) => {
    const base =
      "w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    const showError = touched[key] && !!fieldErrors[key]
    return showError ? `${base} border-destructive focus:ring-destructive` : base
  }

  const helper = (key, okText = "Se ve bien") => {
    if (!touched[key]) return null
    if (fieldErrors[key]) {
      return <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>
    }
    return <p className="mt-1 text-xs text-muted-foreground">{okText}</p>
  }

  const handleSubmit = async () => {
    setTouched({ rut: true, nombres: true, apellidos: true, email: true, telefono: true })

    const rutErr = validateRutLive(form.rut)
    const nomErr = validateNombre(form.nombres)
    const emailErr = validateEmailLive(form.email)
    const telErr = validateTelefonoLive(form.telefono)

    setFieldErrors({
      rut: rutErr,
      nombres: nomErr,
      apellidos: "",
      email: emailErr,
      telefono: telErr,
    })

    if (rutErr || nomErr || emailErr || telErr || isSaving) return

    try {
      setSubmitError("")

      const payload = {
        rut: validarYNormalizarRut(form.rut),
        nombres: validarYNormalizarNombre(form.nombres),
        apellidos: form.apellidos ? validarYNormalizarNombre(form.apellidos) : null,
        email: form.email ? form.email.trim() : null,
        telefono: form.telefono ? validarYNormalizarTelefono(form.telefono) : null,
      }

      await onSubmit?.(payload)
    } catch (err) {
      // ✅ si el RUT existe, intentamos refrescar "existingCliente"
      if (err?.code === "RUT_EXISTS" && err?.existingCliente) {
        setExistingCliente(err.existingCliente)
      }
      setSubmitError(err?.message || "No se pudo crear el cliente")
    }
  }

  const canReactivar = useMemo(() => {
    return String(existingCliente?.estado || "").toLowerCase() === "eliminado"
  }, [existingCliente])

  const handleReactivar = async () => {
    if (!canReactivar || isSaving) return
    try {
      setSubmitError("")
      await onReactivar?.(existingCliente, {
        nombres: form.nombres ? validarYNormalizarNombre(form.nombres) : undefined,
        apellidos: form.apellidos ? validarYNormalizarNombre(form.apellidos) : undefined,
        email: form.email ? form.email.trim() : undefined,
        telefono: form.telefono ? validarYNormalizarTelefono(form.telefono) : undefined,
      })
      onClose?.()
    } catch (e) {
      setSubmitError(e?.message || "No se pudo reactivar el cliente")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="
          bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in
          max-h-[90vh] overflow-y-auto overscroll-contain
        "
      >
        <h2 className="text-2xl font-bold mb-4">Nuevo Cliente</h2>

        {submitError ? (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            {submitError}
          </div>
        ) : null}

        {/* ✅ NUEVO: aviso de existencia */}
        {checkingRut ? (
          <div className="mb-4 bg-muted border border-border text-muted-foreground rounded-lg p-3 text-sm">
            Revisando RUT...
          </div>
        ) : null}

        {existingCliente ? (
          <div className="mb-4 bg-muted border border-border rounded-lg p-3 text-sm">
            <p className="font-medium">
              Este RUT ya existe ({String(existingCliente.estado || "activo")}).
            </p>

            {canReactivar ? (
              <p className="text-muted-foreground mt-1">
                Está <b>eliminado</b>. Puedes reactivarlo y seguir usando el mismo registro (sin duplicar RUT).
              </p>
            ) : (
              <p className="text-muted-foreground mt-1">
                Si está activo/bloqueado, no se puede crear uno nuevo con el mismo RUT.
              </p>
            )}

            {canReactivar ? (
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleReactivar}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? "Reactivando..." : "Reactivar"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">RUT</label>
            <input
              type="text"
              value={form.rut}
              onChange={handleChange("rut")}
              onBlur={handleRutBlur}
              onFocus={() => markTouched("rut")}
              className={inputClass("rut")}
              placeholder="Ej: 11222333-4"
            />
            <p className="mt-1 text-xs text-muted-foreground">Sin puntos. Con guión y dígito verificador.</p>
            {helper("rut")}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombres</label>
            <input
              type="text"
              value={form.nombres}
              onChange={handleChange("nombres")}
              onBlur={handleNombreBlur}
              onFocus={() => markTouched("nombres")}
              className={inputClass("nombres")}
              placeholder="Ej: María"
            />
            {helper("nombres")}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apellidos</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={handleChange("apellidos")}
              onBlur={handleApellidosBlur}
              onFocus={() => markTouched("apellidos")}
              className={inputClass("apellidos")}
              placeholder="Ej: González"
            />
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
              placeholder="email@ejemplo.com"
            />
            {helper("email")}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={handleChange("telefono")}
              onFocus={handleTelefonoFocus}
              onBlur={handleTelefonoBlur}
              className={inputClass("telefono")}
              placeholder="+56 9 1234 5678"
            />
            {helper("telefono")}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSubmit || isSaving}
            >
              {isSaving ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
