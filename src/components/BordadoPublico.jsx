"use client"

import { useState } from "react"
import { 
  CheckCircle, Loader2, AlertTriangle, AlertCircle, 
  Upload, User, Mail, Phone, FileText, GraduationCap, AlignLeft, Image as ImageIcon 
} from "lucide-react"

// ✅ Importación de Logos desde src/assets
import inacapLogo from "../assets/inacap-logo.jpg"
import australLogo from "../assets/austral-logo.jpg"
import ussLogo from "../assets/uss-logo.jpg"
import ustLogo from "../assets/ust-logo.jpg"
import ustCftLogo from "../assets/ust-cft-logo.jpg" // ✅ NUEVO LOGO CFT

// ✅ Importamos tus validaciones
import {
  normalizarRut, 
  validarRut,
  limpiarNombreLive,
  validarEmail,
  validarYNormalizarTelefono
} from "../utils/validaciones"

// ✅ Configuración de la URL de tu API
function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
}

// ✅ MOTOR DE COMPRESIÓN DE IMÁGENES
const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64String = canvas.toDataURL("image/jpeg", 0.7);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function BordadoPublico() {
  const API_URL = getApiBase()

  const [step, setStep] = useState("form")
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const [form, setForm] = useState({
    contacto_folio: "", 
    contacto_nombre: "",
    contacto_apellido: "",
    contacto_rut: "",
    contacto_telefono: "+56 ",
    contacto_correo: "",
    modelo_bordado: "", 
    bordado_nombre: "",
    bordado_apellido: "",
    bordado_profesion: "",
    bordado_universidad: "",
    especificaciones: "" 
  })

  const [logoFile, setLogoFile] = useState(null)

  const [errors, setErrors] = useState({
    contacto_folio: "",
    contacto_nombre: "",
    contacto_apellido: "",
    contacto_rut: "",
    contacto_telefono: "",
    contacto_correo: "",
    modelo_bordado: "",
    bordado_nombre: "",
    bordado_apellido: "",
    bordado_profesion: "",
    bordado_universidad: "",
    especificaciones: "",
    logoFile: ""
  })

  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // ✅ Definición de opciones de logo visuales con CFT incluido
  const logoOptions = [
    { id: "inacap", src: inacapLogo, alt: "INACAP" },
    { id: "u_austral", src: australLogo, alt: "U. Austral" },
    { id: "uss", src: ussLogo, alt: "USS" },
    { id: "ust", src: ustLogo, alt: "UST (Prof.)" },
    { id: "ust_cft", src: ustCftLogo, alt: "Santo Tomás (CFT)" }, // ✅ NUEVO
    { id: "otro", src: null, alt: "N/A (Otro Logo)", icon: ImageIcon },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target
    let finalValue = value
    let errorMsg = ""

    if (name === "contacto_folio") {
      finalValue = value.replace(/\D/g, "")
    }
    else if (name === "contacto_rut") {
      finalValue = normalizarRut(value)
      if (finalValue.length > 7 && !validarRut(finalValue)) {
        errorMsg = "RUT inválido"
      }
    } 
    else if (name.includes("nombre") || name.includes("apellido") || name === "bordado_profesion" || name === "bordado_universidad") {
      finalValue = limpiarNombreLive(value)
      if (finalValue.length > 0 && finalValue.trim().length < 2) {
        errorMsg = "Mínimo 2 letras"
      }
    }
    else if (name === "contacto_correo") {
      if (value.length > 0 && !validarEmail(value)) {
        errorMsg = "Email inválido"
      }
    }
    else if (name === "contacto_telefono") {
      finalValue = value.replace(/[^0-9+\s]/g, "")
      if (finalValue.length > 4) {
         const { valido } = validarYNormalizarTelefono(finalValue)
         if (!valido) errorMsg = "Mínimo 8 dígitos"
      }
    }
    else if (name === "especificaciones") {
      if (value.trim().length > 0 && value.trim().length < 5) {
        errorMsg = "Por favor, detalla un poco más tu solicitud"
      }
    }

    setForm(prev => ({ ...prev, [name]: finalValue }))
    setErrors(prev => ({ ...prev, [name]: errorMsg }))
    setGeneralError("")

    if (name === "modelo_bordado" && value !== "otro") {
      setErrors(prev => ({ ...prev, logoFile: "" }))
      setLogoFile(null)
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (name.includes("nombre") || name.includes("apellido") || name === "bordado_profesion" || name === "bordado_universidad" || name === "especificaciones") {
      setForm(prev => ({ ...prev, [name]: value.trim().replace(/\s+/g, " ") }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setGeneralError("")
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        setErrors(prev => ({ ...prev, logoFile: "El archivo es demasiado grande (Máx 10MB)" }))
        setLogoFile(null)
      } else {
        setErrors(prev => ({ ...prev, logoFile: "" }))
        setLogoFile(file)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError("")

    const newErrors = { ...errors }
    let hasError = false

    if (!form.contacto_folio.trim()) { newErrors.contacto_folio = "Requerido"; hasError = true; }
    if (!validarRut(form.contacto_rut)) { newErrors.contacto_rut = "RUT inválido"; hasError = true; }
    if (form.contacto_nombre.trim().length < 2) { newErrors.contacto_nombre = "Requerido"; hasError = true; }
    if (form.contacto_apellido.trim().length < 2) { newErrors.contacto_apellido = "Requerido"; hasError = true; }
    if (!validarEmail(form.contacto_correo)) { newErrors.contacto_correo = "Email inválido"; hasError = true; }
    
    const telCheck = validarYNormalizarTelefono(form.contacto_telefono)
    if (!telCheck.valido) { newErrors.contacto_telefono = "Teléfono inválido"; hasError = true; }

    if (!form.modelo_bordado) {
      newErrors.modelo_bordado = "Debes seleccionar un modelo"
      hasError = true
    }

    if (form.bordado_nombre.trim().length < 2) { newErrors.bordado_nombre = "Requerido"; hasError = true; }
    if (form.bordado_apellido.trim().length < 2) { newErrors.bordado_apellido = "Requerido"; hasError = true; }
    if (form.bordado_profesion.trim().length < 2) { newErrors.bordado_profesion = "Requerido"; hasError = true; }
    if (form.bordado_universidad.trim().length < 2) { newErrors.bordado_universidad = "Requerido"; hasError = true; }

    if (form.especificaciones.trim().length < 5) { 
      newErrors.especificaciones = "Las especificaciones son obligatorias para poder realizar el bordado"
      hasError = true
    }

    if (form.modelo_bordado === "otro" && !logoFile) {
      newErrors.logoFile = "Debes adjuntar tu logo"
      hasError = true
    }

    setErrors(newErrors)

    if (hasError) {
      setGeneralError("Por favor corrige los errores marcados en rojo.")
      return
    }

    if (!acceptedTerms) {
      setGeneralError("Debes aceptar la declaración antes de enviar.")
      return
    }

    setLoading(true)

    try {
      let logoBase64 = null;
      if (form.modelo_bordado === "otro" && logoFile) {
        try {
          logoBase64 = await compressImageToBase64(logoFile);
        } catch (error) {
          throw new Error("Hubo un problema procesando tu imagen. Intenta con otra foto.");
        }
      }

      const payload = {
        contacto_folio: form.contacto_folio.trim(), 
        contacto_nombre: form.contacto_nombre.trim(),
        contacto_apellido: form.contacto_apellido.trim(),
        contacto_rut: form.contacto_rut,
        contacto_telefono: telCheck.valor,
        contacto_correo: form.contacto_correo.trim(),
        modelo_bordado: form.modelo_bordado,
        bordado_nombre: form.bordado_nombre.trim(),
        bordado_apellido: form.bordado_apellido.trim(),
        bordado_profesion: form.bordado_profesion.trim(),
        bordado_universidad: form.bordado_universidad.trim(),
        especificaciones: form.especificaciones.trim(),
        logo_base64: logoBase64 
      }

      const res = await fetch(`${API_URL}/api/public/bordado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al enviar la solicitud")
      }

      setStep("success")

    } catch (err) {
      setGeneralError(err.message || "Error al comunicarse con el servidor")
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
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Solicitud Enviada!</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Hemos recibido tus datos para el bordado. Te enviamos una copia a tu correo.
          </p>
          
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Medical Season
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Nos pondremos en contacto contigo a la brevedad.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Puedes cerrar esta ventana.</p>
        </div>
      </div>
    )
  }

  const getInputClass = (hasError) => 
    `w-full px-4 py-3 bg-muted/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
      hasError ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30" : "border-border focus:ring-primary/50"
    }`

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-3xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-10 animate-scale-in">
        
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent p-6 text-center border-b border-border">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg shadow-primary/20">
            MS
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bordado Clínico</h1>
          <p className="text-sm text-muted-foreground">Completa los datos para iniciar tu pedido</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {generalError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          {/* 1. DATOS DE CONTACTO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <User className="w-5 h-5 text-primary" /> 1. Tus Datos de Contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* ✅ NUEVO CAMPO FOLIO Y RUT EN LA PRIMERA FILA */}
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">N° Folio</label>
                <input name="contacto_folio" type="text" inputMode="numeric" value={form.contacto_folio} onChange={handleChange} className={getInputClass(!!errors.contacto_folio)} placeholder="Ej: 12345" />
                {errors.contacto_folio && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_folio}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">RUT</label>
                <input name="contacto_rut" value={form.contacto_rut} onChange={handleChange} maxLength={12} className={getInputClass(!!errors.contacto_rut)} placeholder="12345678-9" />
                {errors.contacto_rut && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_rut}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Nombre</label>
                <input name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.contacto_nombre)} placeholder="Juan" />
                {errors.contacto_nombre && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Apellido</label>
                <input name="contacto_apellido" value={form.contacto_apellido} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.contacto_apellido)} placeholder="Pérez" />
                {errors.contacto_apellido && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_apellido}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80 flex items-center gap-1">Teléfono</label>
                <input name="contacto_telefono" type="tel" value={form.contacto_telefono} onChange={handleChange} onFocus={() => { if (!form.contacto_telefono) setForm(prev => ({...prev, contacto_telefono: "+56"})) }} className={getInputClass(!!errors.contacto_telefono)} placeholder="+56 9 ..." />
                {errors.contacto_telefono && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_telefono}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80 flex items-center gap-1">Correo Electrónico</label>
                <input name="contacto_correo" type="email" value={form.contacto_correo} onChange={handleChange} className={getInputClass(!!errors.contacto_correo)} placeholder="hola@ejemplo.com" />
                {errors.contacto_correo && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contacto_correo}</p>}
              </div>

            </div>
          </section>

          {/* 2. MODELO TIPO DE BORDADO UNIVERSITARIO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <ImageIcon className="w-5 h-5 text-primary" /> 2. Tipo de Bordado Universitario
            </h2>
            {errors.modelo_bordado && <p className="text-sm text-red-500 mb-4 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {errors.modelo_bordado}</p>}
            
            {/* ✅ Cuadrícula de 3 columnas para alinear perfectamente 6 opciones */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {logoOptions.map((opcion) => {
                const isSelected = form.modelo_bordado === opcion.id;
                return (
                  <label 
                    key={opcion.id} 
                    className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all ${getInputClass(isSelected)} ${getInputClass(!!errors.modelo_bordado)} ${
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 scale-105 shadow-lg" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
                    }`}
                  >
                    <input type="radio" name="modelo_bordado" value={opcion.id} onChange={handleChange} className="sr-only" />
                    {isSelected && <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-primary animate-scale-in" />}
                    
                    <div className="w-full h-16 flex items-center justify-center p-1 mb-2">
                      {opcion.src ? (
                        <img src={opcion.src} alt={opcion.alt} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                      ) : (
                        <opcion.icon className="w-10 h-10 text-muted-foreground/70" />
                      )}
                    </div>
                    
                    <span className="text-xs font-bold text-center text-foreground/90 leading-tight px-1">{opcion.alt}</span>
                  </label>
                )
              })}
            </div>

            {/* ADJUNTAR IMAGEN */}
            {form.modelo_bordado === "otro" && (
              <div className="animate-fade-in bg-muted/30 p-5 rounded-xl border border-border mt-5">
                <h3 className="flex items-center gap-2 text-md font-bold text-foreground mb-2">
                  <Upload className="w-4 h-4 text-primary" /> Adjunta tu Logo Propio
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Requerido en formato PNG o JPG (hasta 10MB. Se comprimirá automáticamente).</p>
                
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${errors.logoFile ? 'border-red-400 bg-red-50/50' : logoFile ? 'border-green-400 bg-green-50/50' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {logoFile ? (
                        <>
                          <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                          <p className="text-sm font-semibold text-green-700">{logoFile.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-3 text-primary/60" />
                          <p className="mb-1 text-sm text-foreground/80"><span className="font-semibold text-primary">Haz clic para subir</span> o arrastra</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  </label>
                </div>
                {errors.logoFile && <p className="text-sm text-red-500 mt-2 font-medium flex items-center gap-1 justify-center"><AlertCircle className="w-4 h-4"/> {errors.logoFile}</p>}
              </div>
            )}
          </section>

          {/* 3. DATOS PARA TU BORDADO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <GraduationCap className="w-5 h-5 text-primary" /> 3. Datos para el Bordado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Nombre a bordar</label>
                <input name="bordado_nombre" value={form.bordado_nombre} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_nombre)} placeholder="Ej: Juan Pablo" />
                {errors.bordado_nombre && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Apellido a bordar</label>
                <input name="bordado_apellido" value={form.bordado_apellido} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_apellido)} placeholder="Ej: Pérez M." />
                {errors.bordado_apellido && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_apellido}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Profesión / Carrera</label>
                <input name="bordado_profesion" value={form.bordado_profesion} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_profesion)} placeholder="Ej: Enfermería" />
                {errors.bordado_profesion && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_profesion}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1 text-foreground/80">Universidad</label>
                <input name="bordado_universidad" value={form.bordado_universidad} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_universidad)} placeholder="Ej: U. San Sebastián" />
                {errors.bordado_universidad && <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_universidad}</p>}
              </div>
            </div>
          </section>

          {/* 4. ESPECIFICACIONES */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-1 border-b border-border pb-2">
              <AlignLeft className="w-5 h-5 text-primary" /> 4. Especificaciones del Bordado
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              * Estas indicaciones son <strong className="text-primary font-semibold">obligatorias</strong> para realizar tu bordado correctamente.
            </p>
            <textarea 
              name="especificaciones" 
              value={form.especificaciones} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={`${getInputClass(!!errors.especificaciones)} min-h-[100px] resize-y`} 
              placeholder="Ej: Lo necesito bordado en el lado izquierdo del pecho, usar hilo azul marino, etc..."
            />
            {errors.especificaciones && (
              <p className="text-sm text-red-500 mt-2 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4"/> {errors.especificaciones}
              </p>
            )}
          </section>

          {/* CHECKBOX Y BOTÓN */}
          <div className="pt-2 border-t border-border flex flex-col gap-6">
            <div className="flex items-start gap-3 px-1">
              <input 
                type="checkbox" 
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                Acepto que he revisado la información completada y declaro que los datos ingresados son los correctos para iniciar el bordado.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar Solicitud de Bordado"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}