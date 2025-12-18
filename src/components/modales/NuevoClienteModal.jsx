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

export default function NuevoClienteModal({ open, onClose, onSubmit, isSaving = false }) {
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

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setForm({ rut: "", nombres: "", apellidos: "", email: "", telefono: "" })
      setTouched({ rut: false, nombres: false, apellidos: false, email: false, telefono: false })
      setFieldErrors({ rut: "", nombres: "", apellidos: "", email: "", telefono: "" })
      setSubmitError("")
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
    // Si todavía está escribiendo (menos de 2 chars), no lo castigamos duro
    if (limpio.length < 2) return "Completa RUT + dígito verificador"

    // Validación real DV
    if (!validarRut(n)) return "RUT inválido (DV no coincide)"
    return ""
  }

  const validateNombre = (value) => {
    if (!value?.trim()) return "El nombre es obligatorio"
    // Si queda muy corto después de trim, también avisamos
    const norm = value.trim().replace(/\s+/g, " ")
    if (norm.length < 2) return "Nombre muy corto"
    return ""
  }

  const validateEmailLive = (value) => {
    if (!value?.trim()) return "" // opcional
    if (!validarEmail(value.trim())) return "Email inválido (falta @ o dominio)"
    return ""
  }

  const validateTelefonoLive = (value) => {
    if (!value?.trim()) return "" // opcional
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

    // Validación en vivo (solo si ya tocó el campo)
    if (!touched[key]) return

    if (key === "rut") setError("rut", validateRutLive(next))
    if (key === "nombres") setError("nombres", validateNombre(next))
    if (key === "email") setError("email", validateEmailLive(next))
    if (key === "telefono") setError("telefono", validateTelefonoLive(next))
  }

  const handleRutBlur = () => {
    markTouched("rut")
    if (!form.rut) {
      setError("rut", "El RUT es obligatorio")
      return
    }

    // Normaliza formato con guión automáticamente
    const formatted = normalizarRut(form.rut)
    setForm((prev) => ({ ...prev, rut: formatted }))

    // Valida DV
    setError("rut", validateRutLive(formatted))
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
    // UX: si está vacío, lo iniciamos con +56
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

    // Intentamos normalizar al formato final +56XXXXXXXXX
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
    // “ok” discreto (sin cambiar diseño)
    return <p className="mt-1 text-xs text-muted-foreground">{okText}</p>
  }

  const handleSubmit = async () => {
    // Marca como tocados para que aparezcan mensajes si falta algo
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
      setSubmitError(err?.message || "No se pudo crear el cliente")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      {/* ✅ SOLO RESPONSIVE: max-h + scroll interno */}
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

        <div className="space-y-4">
          {/* RUT */}
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

          {/* Nombres */}
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

          {/* Apellidos */}
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
              placeholder="email@ejemplo.com"
            />
            {helper("email")}
          </div>

          {/* Teléfono */}
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
