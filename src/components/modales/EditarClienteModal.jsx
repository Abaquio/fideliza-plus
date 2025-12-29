"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, X, User, Mail, Phone, IdCard, Shield, Link2 } from "lucide-react"

import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

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
  fuentes = [],
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
    fuente_id: null,

    puntos_ajuste_valor: "",
    puntos_ajuste_op: "sumar", // sumar | descontar
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Listo")
  const [validadoMessage, setValidadoMessage] = useState("Cambios guardados.")

  const puntosActuales = useMemo(() => Number(cliente?.puntos_total ?? 0), [cliente])

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
      fuente_id: cliente?.fuente_id ?? null,

      puntos_ajuste_valor: "",
      puntos_ajuste_op: "sumar",
    })
  }, [open, cliente])

  const disabled = isSaving

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  function validateField(key, value, fullForm = form) {
    try {
      if (key === "rut") {
        const v = (value || "").trim()
        if (!v) return "RUT es obligatorio"
        const n = normalizarRut(v)
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
        if (!value) return null
        const digits = String(value).replace(/[^\d]/g, "")
        if (digits.length < 8) return "Teléfono inválido"
        return null
      }

      if (key === "estado") {
        if (!["activo", "bloqueado", "eliminado"].includes(value)) return "Estado inválido"
        return null
      }

      if (key === "puntos_ajuste_op") {
        if (!["sumar", "descontar"].includes(value)) return "Opción inválida"
        // si cambia a descontar, validamos también el valor
        const v = String(fullForm.puntos_ajuste_valor ?? "").trim()
        if (value === "descontar" && v) {
          const n = parseInt(v, 10)
          if (Number.isFinite(n) && n > puntosActuales) {
            return null // el error se asigna al valor, no al select
          }
        }
        return null
      }

      if (key === "puntos_ajuste_valor") {
        const v = String(value ?? "").trim()
        if (!v) return null
        if (!/^\d+$/.test(v)) return "Debe ser un número entero (ej: 50)"
        const n = parseInt(v, 10)
        if (!Number.isFinite(n)) return "Ajuste inválido"
        if (n <= 0) return "Debe ser mayor a 0"

        // ✅ regla: no permitir negativo al descontar
        if (fullForm.puntos_ajuste_op === "descontar" && n > puntosActuales) {
          return `No puedes descontar más de ${puntosActuales} puntos`
        }

        return null
      }

      return null
    } catch (e) {
      return e.message || "Campo inválido"
    }
  }

  function validateAll(nextForm) {
    const nextErrors = {}
    ;[
      "rut",
      "nombres",
      "apellidos",
      "email",
      "telefono",
      "estado",
      "puntos_ajuste_op",
      "puntos_ajuste_valor",
    ].forEach((k) => {
      const msg = validateField(k, nextForm[k], nextForm)
      if (msg) nextErrors[k] = msg
    })
    return nextErrors
  }

  const isValid = useMemo(() => Object.keys(validateAll(form)).length === 0, [form])

  const touchAndValidate = (key, value) => {
    const nextForm = { ...form, [key]: value }
    setTouched((t) => ({ ...t, [key]: true }))

    // validamos campo actual
    const msg = validateField(key, value, nextForm)

    // si cambié op, también recalculo el error del valor (por la regla de no-negativo)
    let extra = {}
    if (key === "puntos_ajuste_op") {
      const msgValor = validateField("puntos_ajuste_valor", nextForm.puntos_ajuste_valor, nextForm)
      extra.puntos_ajuste_valor = msgValor || undefined
    }

    setErrors((e) => ({
      ...e,
      _global: undefined,
      [key]: msg || undefined,
      ...extra,
    }))
  }

  const handleChange = (key) => (e) => {
    const raw = e.target.value

    if (key === "rut") {
      const formatted = normalizarRut(raw)
      setField("rut", formatted)
      touchAndValidate("rut", formatted)
      return
    }

    if (key === "nombres" || key === "apellidos") {
      const cleaned = raw.replace(/\s+/g, " ")
      setField(key, cleaned)
      touchAndValidate(key, cleaned)
      return
    }

    if (key === "email") {
      const v = raw.trimStart()
      setField("email", v)
      touchAndValidate("email", v)
      return
    }

    if (key === "telefono") {
      setField("telefono", raw)
      touchAndValidate("telefono", raw)
      return
    }

    if (key === "fuente_id") {
      const v = raw === "" ? null : raw
      setField("fuente_id", v)
      touchAndValidate("fuente_id", v)
      return
    }

    if (key === "puntos_ajuste_op") {
      setField("puntos_ajuste_op", raw)
      touchAndValidate("puntos_ajuste_op", raw)
      return
    }

    if (key === "puntos_ajuste_valor") {
      const onlyDigits = String(raw).replace(/[^\d]/g, "")
      setField("puntos_ajuste_valor", onlyDigits)
      touchAndValidate("puntos_ajuste_valor", onlyDigits)
      return
    }

    setField(key, raw)
    touchAndValidate(key, raw)
  }

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

    if (key === "rut") {
      const formatted = normalizarRut(form.rut || "")
      setField("rut", formatted)
      touchAndValidate("rut", formatted)
      return
    }

    if (key === "puntos_ajuste_valor") {
      const cleaned = String(form.puntos_ajuste_valor ?? "").trim()
      setField("puntos_ajuste_valor", cleaned)
      touchAndValidate("puntos_ajuste_valor", cleaned)
    }
  }

  function normalizeBeforeSubmit(raw) {
    const payload = { ...raw }

    payload.rut = validarYNormalizarRut(payload.rut)
    payload.nombres = validarYNormalizarNombre(payload.nombres || "")
    payload.apellidos = payload.apellidos ? validarYNormalizarNombre(payload.apellidos) : null

    payload.email = payload.email?.trim() ? payload.email.trim() : null
    if (payload.email && !validarEmail(payload.email)) throw new Error("Email inválido")

    payload.telefono = payload.telefono?.trim()
      ? validarYNormalizarTelefono(payload.telefono)
      : null

    payload.estado = payload.estado || "activo"
    payload.fuente_id = payload.fuente_id || null

    const v = String(payload.puntos_ajuste_valor ?? "").trim()
    if (v) {
      if (!/^\d+$/.test(v)) throw new Error("El ajuste de puntos debe ser entero (ej: 50)")
      const n = parseInt(v, 10)
      if (!Number.isFinite(n) || n <= 0) throw new Error("El ajuste de puntos debe ser mayor a 0")

      // ✅ regla dura aquí también
      if (payload.puntos_ajuste_op === "descontar" && n > puntosActuales) {
        throw new Error(`No puedes descontar más de ${puntosActuales} puntos`)
      }

      const op = payload.puntos_ajuste_op === "descontar" ? -1 : 1
      payload.puntos_ajuste = n * op
    }

    delete payload.puntos_ajuste_valor
    delete payload.puntos_ajuste_op

    return payload
  }

  const handleSave = () => {
    setTouched({
      rut: true,
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      estado: true,
      fuente_id: true,
      puntos_ajuste_op: true,
      puntos_ajuste_valor: true,
    })

    const nextErrors = validateAll(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPendingAction(() => async () => {
      const payload = normalizeBeforeSubmit(form)
      await onSubmit?.({ id: cliente?.id, ...payload })

      setValidadoTitle("Cliente actualizado")
      setValidadoMessage("Los cambios se guardaron correctamente.")
      setValidadoOpen(true)
    })

    setConfirmOpen(true)
  }

  if (!open) return null

  const ajusteValor = form.puntos_ajuste_valor ? parseInt(form.puntos_ajuste_valor, 10) : 0
  const ajusteSigned =
    ajusteValor > 0 ? (form.puntos_ajuste_op === "descontar" ? -ajusteValor : ajusteValor) : 0
  const puntosPreview = puntosActuales + (Number.isFinite(ajusteSigned) ? ajusteSigned : 0)

  // ✅ para ayudar al input (no es seguridad, la validación lo es)
  const inputMax = form.puntos_ajuste_op === "descontar" ? Math.max(0, puntosActuales) : undefined

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      {/* ✅ modal siempre visible: alto máximo + scroll interno */}
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl animate-scale-in max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Editar cliente</h2>
            <p className="text-sm text-muted-foreground">Actualiza los datos del perfil del cliente.</p>
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
            {touched.rut && errors.rut ? <p className="text-xs text-destructive">{errors.rut}</p> : null}
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
              <option value="eliminado">Eliminado</option>
            </select>
            {touched.estado && errors.estado ? <p className="text-xs text-destructive">{errors.estado}</p> : null}
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
            {touched.nombres && errors.nombres ? <p className="text-xs text-destructive">{errors.nombres}</p> : null}
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
            {touched.apellidos && errors.apellidos ? <p className="text-xs text-destructive">{errors.apellidos}</p> : null}
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
            {touched.email && errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
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
            {touched.telefono && errors.telefono ? <p className="text-xs text-destructive">{errors.telefono}</p> : null}
          </div>

          {/* Fuente */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              Fuente del cliente
            </label>
            <select
              value={form.fuente_id ?? ""}
              onChange={handleChange("fuente_id")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin fuente (manual)</option>
              {(fuentes || [])
                .filter((f) => f?.activo !== false)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Puedes cambiar de dónde proviene este cliente (por ejemplo, Medical Season).
            </p>
          </div>

          {/* ✅ BLOQUE PUNTOS: responsive + sin negativos */}
          <div className="space-y-3 md:col-span-2">
            <div className="bg-muted/40 border border-border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Puntos actuales</p>
                  <p className="text-3xl font-bold text-foreground leading-none">{puntosActuales}</p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground">Con este ajuste quedará en</p>
                  <p className="text-3xl font-bold text-foreground leading-none">{puntosPreview}</p>

                  {ajusteSigned !== 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajuste:{" "}
                      <span className="font-medium text-foreground">
                        {ajusteSigned > 0 ? `+${ajusteSigned}` : `${ajusteSigned}`}
                      </span>{" "}
                      (se guarda como <b>ajuste</b>)
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Si no ingresas un ajuste, no se crea movimiento.
                    </p>
                  )}

                  {/* ✅ aviso extra cuando es descuento y se pasa */}
                  {errors.puntos_ajuste_valor ? (
                    <p className="text-xs text-destructive mt-1">{errors.puntos_ajuste_valor}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={form.puntos_ajuste_op}
                    onChange={handleChange("puntos_ajuste_op")}
                    className="w-full mt-2 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="sumar">Sumar</option>
                    <option value="descontar">Descontar</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Cantidad</label>
                  <input
                    value={form.puntos_ajuste_valor}
                    onChange={handleChange("puntos_ajuste_valor")}
                    onBlur={handleBlur("puntos_ajuste_valor")}
                    className="w-full mt-2 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 50"
                    inputMode="numeric"
                    {...(inputMax !== undefined ? { max: inputMax } : {})}
                  />
                  {!errors.puntos_ajuste_valor ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingresa un número entero (ej: 50). Si es <b>Descontar</b>, no puede superar los puntos actuales.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

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
