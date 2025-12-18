"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, X, User, Mail, Phone, IdCard, Shield } from "lucide-react"

// Tus UI helpers
import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

// Tus validaciones
import {
  normalizarRut,
  validarRut,
  validarYNormalizarRut,
  validarYNormalizarNombre,
  validarEmail,
  validarYNormalizarTelefono,
} from "../../utils/validaciones"

export default function EditarClienteModal({
  open,
  cliente,
  onClose,
  onSubmit,
  isSaving = false,
}) {
  const [form, setForm] = useState({
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    estado: "activo",
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Confirm + Validado
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Listo")
  const [validadoMessage, setValidadoMessage] = useState("Cambios guardados.")

  useEffect(() => {
    if (!open) return

    setErrors({})
    setTouched({})
    setConfirmOpen(false)
    setPendingAction(null)

    setForm({
      rut: cliente?.rut || "",
      nombres: cliente?.nombres || "",
      apellidos: cliente?.apellidos || "",
      email: cliente?.email && cliente.email !== "-" ? cliente.email : "",
      telefono: cliente?.telefono && cliente.telefono !== "-" ? cliente.telefono : "",
      estado: cliente?.estado || "activo",
    })
  }, [open, cliente])

  const disabled = isSaving

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validateField(key, value) {
    try {
      if (key === "rut") {
        const v = (value || "").trim()
        if (!v) return "RUT es obligatorio"

        const n = normalizarRut(v)
        // Si todavía está incompleto (ej: 1 dígito), no lo castigamos duro
        if (n.replace(/[^0-9K]/g, "").length < 2) return "RUT es obligatorio"

        if (!validarRut(n)) return "RUT inválido"
        return null
      }

      if (key === "nombres") {
        const cleaned = validarYNormalizarNombre(value || "")
        if (!cleaned) return "Nombre es obligatorio"
        return null
      }

      if (key === "apellidos") {
        if (!value) return null
        validarYNormalizarNombre(value)
        return null
      }

      if (key === "email") {
        if (!value) return null
        if (!validarEmail(value.trim())) return "Email inválido"
        return null
      }

      if (key === "telefono") {
        // Validación “suave” en vivo: si hay algo escrito, revisamos largo básico.
        if (!value) return null
        const digits = String(value).replace(/[^\d]/g, "")
        if (digits.length < 8) return "Teléfono inválido"
        return null
      }

      if (key === "estado") {
        if (!["activo", "bloqueado"].includes(value)) return "Estado inválido"
        return null
      }

      return null
    } catch (e) {
      return e.message || "Campo inválido"
    }
  }

  function validateAll(nextForm) {
    const nextErrors = {}
    ;["rut", "nombres", "apellidos", "email", "telefono", "estado"].forEach((k) => {
      const msg = validateField(k, nextForm[k])
      if (msg) nextErrors[k] = msg
    })
    return nextErrors
  }

  // ✅ Ahora el botón refleja realmente si el formulario está válido
  const isValid = useMemo(() => {
    const nextErrors = validateAll(form)
    return Object.keys(nextErrors).length === 0
  }, [form])

  const touchAndValidate = (key, value) => {
    setTouched((t) => ({ ...t, [key]: true }))
    const msg = validateField(key, value)
    setErrors((e) => ({ ...e, _global: undefined, [key]: msg || undefined }))
  }

  // ✅ Cambios en vivo por campo
  const handleChange = (key) => (e) => {
    const raw = e.target.value

    if (key === "rut") {
      const formatted = normalizarRut(raw)
      setField("rut", formatted)
      touchAndValidate("rut", formatted)
      return
    }

    if (key === "nombres" || key === "apellidos") {
      // sin dobles espacios mientras escribe, sin cortar fuerte el tipeo
      const cleaned = raw.replace(/\s+/g, " ")
      setField(key, cleaned)
      touchAndValidate(key, cleaned)
      return
    }

    if (key === "email") {
      const v = raw.trimStart() // evita espacios al inicio
      setField("email", v)
      touchAndValidate("email", v)
      return
    }

    if (key === "telefono") {
      setField("telefono", raw)
      touchAndValidate("telefono", raw)
      return
    }

    setField(key, raw)
    touchAndValidate(key, raw)
  }

  // ✅ onBlur: normalizaciones “finales”
  const handleBlur = (key) => () => {
    if (key === "nombres" || key === "apellidos") {
      const cleaned = validarYNormalizarNombre(form[key] || "")
      setField(key, cleaned)
      touchAndValidate(key, cleaned)
      return
    }

    if (key === "email") {
      const cleaned = (form.email || "").trim()
      setField("email", cleaned)
      touchAndValidate("email", cleaned)
      return
    }

    if (key === "telefono") {
      // No normalizamos a +56 aquí para no “pelear” con el usuario mientras escribe,
      // solo validamos suave. La normalización definitiva va al guardar.
      touchAndValidate("telefono", form.telefono)
      return
    }

    if (key === "rut") {
      const formatted = normalizarRut(form.rut || "")
      setField("rut", formatted)
      touchAndValidate("rut", formatted)
    }
  }

  function normalizeBeforeSubmit(raw) {
    const payload = { ...raw }

    payload.rut = validarYNormalizarRut(payload.rut)

    payload.nombres = validarYNormalizarNombre(payload.nombres || "")
    payload.apellidos = payload.apellidos ? validarYNormalizarNombre(payload.apellidos) : null

    payload.email = payload.email?.trim() ? payload.email.trim() : null
    if (payload.email && !validarEmail(payload.email)) {
      throw new Error("Email inválido")
    }

    payload.telefono = payload.telefono?.trim()
      ? validarYNormalizarTelefono(payload.telefono)
      : null

    payload.estado = payload.estado || "activo"

    return payload
  }

  const handleSave = () => {
    // marcar todo como tocado
    setTouched({
      rut: true,
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      estado: true,
    })

    // validar todo
    const nextErrors = validateAll(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setPendingAction(() => async () => {
      try {
        const payload = normalizeBeforeSubmit(form)
        await onSubmit?.({
          id: cliente?.id,
          ...payload,
        })

        setValidadoTitle("Cliente actualizado")
        setValidadoMessage("Los cambios se guardaron correctamente.")
        setValidadoOpen(true)
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          _global: e.message || "No se pudo guardar",
        }))
        throw e
      }
    })

    setConfirmOpen(true)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      {/* ✅ tamaño L */}
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl animate-scale-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Editar cliente</h2>
            <p className="text-sm text-muted-foreground">
              Actualiza los datos del perfil del cliente.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={disabled}
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors?._global ? (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            {errors._global}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RUT */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <IdCard className="w-4 h-4 text-muted-foreground" />
              RUT
            </label>
            <input
              value={form.rut}
              onChange={handleChange("rut")}
              onBlur={handleBlur("rut")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="11222333-4"
            />
            {touched.rut && errors.rut ? (
              <p className="text-xs text-destructive">{errors.rut}</p>
            ) : null}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Estado
            </label>
            <select
              value={form.estado}
              onChange={handleChange("estado")}
              onBlur={handleBlur("estado")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="activo">Activo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
            {touched.estado && errors.estado ? (
              <p className="text-xs text-destructive">{errors.estado}</p>
            ) : null}
          </div>

          {/* Nombres */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Nombres
            </label>
            <input
              value={form.nombres}
              onChange={handleChange("nombres")}
              onBlur={handleBlur("nombres")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Juan Pablo"
            />
            {touched.nombres && errors.nombres ? (
              <p className="text-xs text-destructive">{errors.nombres}</p>
            ) : null}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Apellidos
            </label>
            <input
              value={form.apellidos}
              onChange={handleChange("apellidos")}
              onBlur={handleBlur("apellidos")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Pérez Soto"
            />
            {touched.apellidos && errors.apellidos ? (
              <p className="text-xs text-destructive">{errors.apellidos}</p>
            ) : null}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </label>
            <input
              value={form.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="correo@dominio.cl"
            />
            {touched.email && errors.email ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : null}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Teléfono
            </label>
            <input
              value={form.telefono}
              onChange={handleChange("telefono")}
              onBlur={handleBlur("telefono")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+56912345678"
            />
            {touched.telefono && errors.telefono ? (
              <p className="text-xs text-destructive">{errors.telefono}</p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={disabled}
            className="sm:flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={disabled || !isValid}
            className="sm:flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Confirm + Validado */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar cambios"
        message="¿Deseas guardar los cambios del cliente?"
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmOpen(false)
          setPendingAction(null)
        }}
        onConfirm={async () => {
          setConfirmOpen(false)
          const fn = pendingAction
          setPendingAction(null)
          if (typeof fn === "function") await fn()
        }}
      />

      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => {
          setValidadoOpen(false)
          onClose?.()
        }}
      />
    </div>
  )
}
