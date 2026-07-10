"use client"

import { useState } from "react"
import { CheckCircle, Gift, Loader2, AlertTriangle, AlertCircle } from "lucide-react"

// ✅ Importamos el Modal de Términos (Asegúrate que la ruta sea correcta según tu estructura)
import TerminosCondicionesModal from "../components/modales/TerminosCondiciones-modal"

// ✅ Usamos las funciones actualizadas
import {
  normalizarRut, 
  validarRut,
  limpiarNombreLive,
  validarEmail,
  validarYNormalizarTelefono
} from "../utils/validaciones"

function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus-production.up.railway.app"
}

export default function RegistroPublico() {
  const API_URL = getApiBase()
  
  const [step, setStep] = useState("form")
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // ✅ NUEVO: Estados para Términos y Condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const [form, setForm] = useState({
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "+56"
  })

  const [errors, setErrors] = useState({
    rut: "",
    email: "",
    telefono: ""
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    let finalValue = value
    let errorMsg = ""

    // --- Lógica de Input Mask ---
    
    if (name === "rut") {
      finalValue = normalizarRut(value)
      
      if (finalValue.length > 7) {
        if (!validarRut(finalValue)) {
          errorMsg = "RUT inválido"
        }
      }
    } 
    else if (name === "nombres" || name === "apellidos") {
      finalValue = limpiarNombreLive(value)
    }
    else if (name === "email") {
      if (value.length > 0 && !validarEmail(value)) {
        errorMsg = "Email inválido"
      }
    }
    else if (name === "telefono") {
      // ✅ FIX: Solo permitir números, espacios y +
      finalValue = value.replace(/[^0-9+\s]/g, "")

      // Validación en tiempo real (si es muy corto)
      if (finalValue.length > 4) {
         const { valido } = validarYNormalizarTelefono(finalValue)
         if (!valido) errorMsg = "Mínimo 8 dígitos"
      }
    }

    setForm(prev => ({ ...prev, [name]: finalValue }))
    
    if (["rut", "email", "telefono"].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: errorMsg }))
    }
    
    setGeneralError("")
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (name === "nombres" || name === "apellidos") {
      // Trim seguro al salir
      setForm(prev => ({ ...prev, [name]: value.trim().replace(/\s+/g, " ") }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones Bloqueantes
    if (!validarRut(form.rut)) {
      setGeneralError("El RUT ingresado no es válido.")
      return
    }
    if (form.nombres.trim().length < 2 || form.apellidos.trim().length < 2) {
      setGeneralError("Por favor completa tu nombre y apellidos.")
      return
    }
    if (!validarEmail(form.email)) {
      setGeneralError("El correo electrónico no es válido.")
      return
    }
    // ✅ Validación Teléfono Obligatorio
    if (!form.telefono || form.telefono.trim().length < 8) {
      setGeneralError("El teléfono es obligatorio y debe ser válido.")
      setErrors(p => ({ ...p, telefono: "Campo obligatorio" }))
      return
    }
    const telCheck = validarYNormalizarTelefono(form.telefono)
    if (!telCheck.valido) {
      setGeneralError("El formato del teléfono es incorrecto.")
      setErrors(p => ({ ...p, telefono: "Formato inválido" }))
      return
    }

    // ✅ NUEVO: Validación de Checkbox
    if (!acceptedTerms) {
      setGeneralError("Debes aceptar los Términos y Condiciones para registrarte.")
      return
    }

    setLoading(true)
    setGeneralError("")

    try {
      const payload = {
        rut: form.rut,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        // Enviamos el teléfono limpio y normalizado
        telefono: telCheck.valor
      }

      const res = await fetch(`${API_URL}/api/public/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al registrarse")
      }

      setSuccessMsg(data.message)
      setStep("success")

    } catch (err) {
      setGeneralError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-8 text-center border border-border animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Bienvenido!</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">{successMsg}</p>
          
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
              <Gift className="w-4 h-4" /> Ya eres parte del club
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dicta tu RUT en caja la próxima vez para acumular puntos.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Puedes cerrar esta ventana.</p>
        </div>
      </div>
    )
  }

  // Clase para inputs con error rojo
  const getInputClass = (hasError) => 
    `w-full px-4 py-3 bg-muted/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
      hasError ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30" : "border-border focus:ring-primary/50"
    }`

  return (
    <>
      {/* ✅ Modal Renderizado aquí */}
      <TerminosCondicionesModal open={showTerms} onClose={() => setShowTerms(false)} />

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-10 animate-scale-in">
          <div className="bg-gradient-to-b from-primary/5 to-transparent p-6 text-center border-b border-border">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg shadow-primary/20">
              F+
            </div>
            <h1 className="text-2xl font-bold text-foreground">Fideliza+</h1>
            <p className="text-sm text-muted-foreground">Únete hoy y gana puntos en cada compra</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {generalError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">RUT</label>
              <input
                name="rut"
                value={form.rut}
                onChange={handleChange}
                placeholder="12345678-9"
                className={getInputClass(!!errors.rut)}
                maxLength={12}
              />
              {errors.rut && (
                <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> {errors.rut}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Nombre</label>
                <input
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Juan"
                  className={getInputClass(false)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Apellidos</label>
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Pérez"
                  className={getInputClass(false)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Correo Electrónico</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="hola@ejemplo.com"
                className={getInputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> {errors.email}
                </p>
              )}
            </div>

            {/* ✅ Teléfono OBLIGATORIO */}
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Teléfono</label>
              <input
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                onFocus={() => {
                   if (!form.telefono) setForm(prev => ({...prev, telefono: "+56"}))
                }}
                placeholder="+56 9 ..."
                className={getInputClass(!!errors.telefono)}
              />
              {errors.telefono && <p className="text-xs text-red-500 mt-1 ml-1">{errors.telefono}</p>}
            </div>

            {/* ✅ SECCIÓN TÉRMINOS Y CONDICIONES (REEMPLAZANDO EL TEXTO ESTÁTICO) */}
            <div className="flex items-start gap-3 mt-4 px-1 pt-2">
              <input
                type="checkbox"
                id="terms-check"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <label htmlFor="terms-check" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                He leído y acepto los{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                  className="text-primary hover:underline font-bold focus:outline-none"
                >
                  Términos y Condiciones
                </button>
                , incluyendo el uso de mis datos para recibir beneficios de Fideliza+.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "¡Registrarme y Ganar Puntos!"}
            </button>

          </form>
        </div>
      </div>
    </>
  )
}