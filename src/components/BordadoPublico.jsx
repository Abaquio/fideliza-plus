"use client"

import { useState } from "react"
import { 
  CheckCircle, Loader2, AlertTriangle, AlertCircle, 
  Upload, User, Mail, Phone, FileText, GraduationCap, AlignLeft, Image as ImageIcon,
  Type
} from "lucide-react"

// ✅ Logos Universitarios
import inacapLogo from "../assets/inacap-logo.jpeg"
import australLogo from "../assets/austral-logo.jpeg"
import ussLogo from "../assets/uss-logo.jpeg"
import ustLogo from "../assets/ust-logo.jpeg"
import ustCftLogo from "../assets/ust-cft-logo.jpg"
import sinLogoImg from "../assets/nombre-apellido-profesion.jpeg"

// ✅ Nuevas imágenes para posición del bordado
import ladoDerechoImg from "../assets/lado-derecho-top.jpeg"
import ladoIzquierdoImg from "../assets/lado-izquierdo-top.jpeg"
import sobreBolsilloImg from "../assets/sobre-bolsillo-top.jpeg"
import arribaBolsilloImg from "../assets/arriba-bolsillo-top.jpeg"

import {
  normalizarRut, 
  validarRut,
  validarEmail,
  validarYNormalizarTelefono
} from "../utils/validaciones"

function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
}

// MOTOR DE COMPRESIÓN MEJORADO
const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        try {
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
        } catch (error) {
          resolve(event.target.result);
        }
      };
      
      img.onerror = () => {
        resolve(event.target.result); 
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function BordadoPublico() {
  const API_URL = getApiBase()

  const [step, setStep] = useState("form")
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const [nombresModificados, setNombresModificados] = useState(false)
  const [univOtra, setUnivOtra] = useState(false)

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
    lado_bordado: "",      
    tiene_bolsillo: "",    
    posicion_bolsillo: "", 
    tipo_letra_nombre: "",    
    tipo_letra_profesion: "", 
    color_hilo: "",           
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
    lado_bordado: "",
    tiene_bolsillo: "",
    posicion_bolsillo: "",
    tipo_letra_nombre: "",    
    tipo_letra_profesion: "", 
    color_hilo: "",           
    especificaciones: "",
    logoFile: ""
  })

  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const logoOptions = [
    { id: "inacap", src: inacapLogo, alt: "INACAP" },
    { id: "u_austral", src: australLogo, alt: "U. Austral" },
    { id: "uss", src: ussLogo, alt: "USS" },
    { id: "ust", src: ustLogo, alt: "UST (Prof.)" },
    { id: "ust_cft", src: ustCftLogo, alt: "Santo Tomás (CFT)" },
    { id: "otro", src: null, alt: "Logo Propio", icon: ImageIcon },
    { id: "sin_logo", src: sinLogoImg, alt: "Sin Logo / Solo Texto", icon: Type }, 
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
      finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]/g, "")
      if (finalValue.length > 0 && finalValue.trim().length < 2) {
        errorMsg = "Mínimo 2 caracteres"
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

    if (name === "bordado_nombre" || name === "bordado_apellido") {
      setNombresModificados(true);
    }

    setForm(prev => {
      const updated = { ...prev, [name]: finalValue };

      if (name === "contacto_nombre" && !nombresModificados) {
        updated.bordado_nombre = finalValue;
      }
      if (name === "contacto_apellido" && !nombresModificados) {
        updated.bordado_apellido = finalValue;
      }

      if (name === "modelo_bordado") {
        if (value === "inacap") { updated.bordado_universidad = "INACAP"; setUnivOtra(false); }
        else if (value === "u_austral") { updated.bordado_universidad = "Universidad Austral"; setUnivOtra(false); }
        else if (value === "uss") { updated.bordado_universidad = "Universidad San Sebastián"; setUnivOtra(false); }
        else if (value === "ust") { updated.bordado_universidad = "Universidad Santo Tomás"; setUnivOtra(false); }
        else if (value === "ust_cft") { updated.bordado_universidad = "Santo Tomás CFT"; setUnivOtra(false); }
        else if (value === "sin_logo") { updated.bordado_universidad = "Ninguna"; setUnivOtra(false); }
      }

      if (name === "tiene_bolsillo" && value === "no") {
        updated.posicion_bolsillo = "";
      }

      return updated;
    });

    setErrors(prev => {
      const updated = { ...prev, [name]: errorMsg };
      
      if (name === "modelo_bordado") {
        updated.logoFile = "";
        updated.bordado_universidad = ""; 
      }
      if (name === "contacto_nombre" && !nombresModificados) updated.bordado_nombre = "";
      if (name === "contacto_apellido" && !nombresModificados) updated.bordado_apellido = "";
      
      if (name === "tiene_bolsillo" && value === "no") {
        updated.posicion_bolsillo = "";
      }

      return updated;
    });

    setGeneralError("")

    if (name === "modelo_bordado" && value !== "otro") {
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
    
    if (!form.lado_bordado) { newErrors.lado_bordado = "Debes seleccionar el lado del bordado"; hasError = true; }
    if (!form.tiene_bolsillo) { newErrors.tiene_bolsillo = "Debes indicar si tu top tiene bolsillo"; hasError = true; }
    if (form.tiene_bolsillo === "si" && !form.posicion_bolsillo) { 
      newErrors.posicion_bolsillo = "Debes elegir la posición del bordado respecto al bolsillo"; hasError = true; 
    }

    if (!form.tipo_letra_nombre) { newErrors.tipo_letra_nombre = "Requerido"; hasError = true; }
    if (!form.tipo_letra_profesion) { newErrors.tipo_letra_profesion = "Requerido"; hasError = true; }
    if (!form.color_hilo) { newErrors.color_hilo = "Requerido"; hasError = true; }

    if (form.especificaciones.trim().length > 0 && form.especificaciones.trim().length < 5) { 
      newErrors.especificaciones = "Por favor, detalla un poco más tu solicitud"
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

      const opcionSeleccionada = logoOptions.find(opt => opt.id === form.modelo_bordado);
      const nombreModeloBordado = opcionSeleccionada ? opcionSeleccionada.alt : form.modelo_bordado;

      const payload = {
        contacto_folio: form.contacto_folio.trim(), 
        contacto_nombre: form.contacto_nombre.trim(),
        contacto_apellido: form.contacto_apellido.trim(),
        contacto_rut: form.contacto_rut,
        contacto_telefono: telCheck.valor,
        contacto_correo: form.contacto_correo.trim(),
        modelo_bordado: nombreModeloBordado, 
        bordado_nombre: form.bordado_nombre.trim(),
        bordado_apellido: form.bordado_apellido.trim(),
        bordado_profesion: form.bordado_profesion.trim(),
        bordado_universidad: form.bordado_universidad.trim(),
        lado_bordado: form.lado_bordado === 'izquierdo' ? 'Lado Izquierdo' : 'Lado Derecho',
        tiene_bolsillo: form.tiene_bolsillo === 'si' ? 'Sí' : 'No',
        posicion_bolsillo: form.tiene_bolsillo === 'si' ? (form.posicion_bolsillo === 'sobre' ? 'Sobre el bolsillo' : 'Arriba del bolsillo') : 'N/A',
        tipo_letra_nombre: form.tipo_letra_nombre,
        tipo_letra_profesion: form.tipo_letra_profesion,
        color_hilo: form.color_hilo,
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
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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
                <p className="text-sm text-muted-foreground mb-4">Se comprimirá automáticamente. (Máx 10MB)</p>
                
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
                          <p className="mb-1 text-sm text-foreground/80"><span className="font-semibold text-primary">Haz clic para subir foto</span></p>
                          <p className="text-xs text-muted-foreground">O usa tu cámara</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
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

            {/* SECCIÓN VISUAL: LADO Y BOLSILLO */}
            <div className="bg-muted/20 border border-border p-4 sm:p-6 rounded-2xl mb-6 space-y-6">
              
              {/* Lado del Bordado */}
              <div>
                <label className="block text-base font-bold mb-3 text-foreground/90">
                  1. ¿En qué lado del top quieres el bordado?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'izquierdo', src: ladoIzquierdoImg, title: 'Lado Izquierdo', desc: 'Clásico universitario y profesional' },
                    { id: 'derecho', src: ladoDerechoImg, title: 'Lado Derecho', desc: 'Clásico institucional privado' }
                  ].map((opt) => (
                    <label key={opt.id} className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all bg-white ${form.lado_bordado === opt.id ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50 hover:shadow-sm'}`}>
                      <input type="radio" name="lado_bordado" value={opt.id} onChange={handleChange} className="sr-only" />
                      {form.lado_bordado === opt.id && <CheckCircle className="absolute top-3 right-3 w-6 h-6 text-primary bg-white rounded-full shadow-sm" />}
                      <img src={opt.src} alt={`Lado ${opt.id}`} className="w-full max-h-48 object-contain rounded-xl mix-blend-multiply" />
                      <div className="mt-3 text-center px-2">
                        <p className="font-bold text-sm text-foreground">{opt.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.lado_bordado && <p className="text-sm text-red-500 mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4"/> {errors.lado_bordado}</p>}
              </div>

              {/* Pregunta del Bolsillo */}
              <div className="pt-4 border-t border-border">
                <label className="block text-base font-bold mb-3 text-foreground/90">
                  2. ¿Tu top tiene bolsillo en ese lado?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['si', 'no'].map((opcion) => (
                    <label key={opcion} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${form.tiene_bolsillo === opcion ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted/50'}`}>
                      <input type="radio" name="tiene_bolsillo" value={opcion} onChange={handleChange} className="sr-only" />
                      <span className="font-bold uppercase tracking-wider">{opcion === 'si' ? 'Sí, tiene bolsillo' : 'No, sin bolsillo'}</span>
                      {form.tiene_bolsillo === opcion && <CheckCircle className="ml-2 w-5 h-5" />}
                    </label>
                  ))}
                </div>
                {errors.tiene_bolsillo && <p className="text-sm text-red-500 mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4"/> {errors.tiene_bolsillo}</p>}
              </div>

              {/* Opciones si TIENE bolsillo */}
              {form.tiene_bolsillo === "si" && (
                <div className="pt-4 border-t border-border animate-fade-in">
                  <label className="block text-base font-bold mb-3 text-foreground/90">
                    3. ¿Cómo quieres ubicar el bordado respecto al bolsillo?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'sobre', src: sobreBolsilloImg, title: 'Sobre el bolsillo', desc: 'Si eliges esta opción el bolsillo se sella (se pierde).' },
                      { id: 'arriba', src: arribaBolsilloImg, title: 'Arriba del bolsillo', desc: 'Sujeto a condiciones técnicas y medidas del logo.' }
                    ].map((opt) => (
                      <label key={opt.id} className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all bg-white ${form.posicion_bolsillo === opt.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-[1.02]' : 'border-border hover:border-blue-400 hover:shadow-sm'}`}>
                        <input type="radio" name="posicion_bolsillo" value={opt.id} onChange={handleChange} className="sr-only" />
                        {form.posicion_bolsillo === opt.id && <CheckCircle className="absolute top-3 right-3 w-6 h-6 text-blue-500 bg-white rounded-full shadow-sm" />}
                        <img src={opt.src} alt={`Posición ${opt.id}`} className="w-full max-h-48 object-contain rounded-xl mix-blend-multiply" />
                        <div className="mt-3 text-center px-2">
                          <p className="font-bold text-sm text-blue-700">{opt.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.posicion_bolsillo && <p className="text-sm text-red-500 mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4"/> {errors.posicion_bolsillo}</p>}
                </div>
              )}
            </div>

            {/* ✅ DATOS DE TEXTO CON SELECTORES VISUALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* ✅ BLOQUE UNIFICADO: Nombre, Apellido y su Tipografía */}
              <div className="sm:col-span-2 space-y-4 bg-muted/10 p-4 rounded-xl border border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-foreground">Nombre a bordar</label>
                    <input name="bordado_nombre" value={form.bordado_nombre} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_nombre)} placeholder="Ej: Juan" />
                    {errors.bordado_nombre && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_nombre}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-foreground">Apellido a bordar</label>
                    <input name="bordado_apellido" value={form.bordado_apellido} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_apellido)} placeholder="Ej: Pérez" />
                    {errors.bordado_apellido && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_apellido}</p>}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                    Tipo de Letra (Aplica para Nombre y Apellido)
                  </label>
                  <div className="flex gap-3 sm:max-w-md">
                    <label className={`flex-1 border-2 rounded-lg p-2 text-center cursor-pointer transition-all ${form.tipo_letra_nombre === 'Arial' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted bg-card'} ${errors.tipo_letra_nombre ? 'border-red-300' : ''}`}>
                      <input type="radio" name="tipo_letra_nombre" value="Arial" checked={form.tipo_letra_nombre === 'Arial'} onChange={handleChange} className="sr-only" />
                      <span className="block font-sans text-base font-semibold text-foreground">Arial</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">Imprenta</span>
                    </label>
                    <label className={`flex-1 border-2 rounded-lg p-2 text-center cursor-pointer transition-all ${form.tipo_letra_nombre === 'Cursiva' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted bg-card'} ${errors.tipo_letra_nombre ? 'border-red-300' : ''}`}>
                      <input type="radio" name="tipo_letra_nombre" value="Cursiva" checked={form.tipo_letra_nombre === 'Cursiva'} onChange={handleChange} className="sr-only" />
                      {/* Usamos fuentes genéricas seguras para que se vea como cursiva en cualquier PC/Celular */}
                      <span className="block text-[1.15rem] leading-tight text-foreground" style={{ fontFamily: "cursive, 'Brush Script MT', 'Lucida Handwriting'" }}>Cursiva</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">Ligada</span>
                    </label>
                  </div>
                  {errors.tipo_letra_nombre && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.tipo_letra_nombre}</p>}
                </div>
              </div>

              {/* Profesión + Tipo de Letra Visual */}
              <div className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-foreground">Profesión / Carrera</label>
                  <input name="bordado_profesion" value={form.bordado_profesion} onChange={handleChange} onBlur={handleBlur} className={getInputClass(!!errors.bordado_profesion)} placeholder="Ej: Enfermería" />
                  {errors.bordado_profesion && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_profesion}</p>}
                </div>
                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Tipo de Letra (Profesión)</label>
                  <div className="flex gap-2">
                    <label className={`flex-1 border-2 rounded-lg p-2 text-center cursor-pointer transition-all ${form.tipo_letra_profesion === 'Arial' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted bg-card'} ${errors.tipo_letra_profesion ? 'border-red-300' : ''}`}>
                      <input type="radio" name="tipo_letra_profesion" value="Arial" checked={form.tipo_letra_profesion === 'Arial'} onChange={handleChange} className="sr-only" />
                      <span className="block font-sans text-base font-semibold text-foreground">Arial</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">Imprenta</span>
                    </label>
                    <label className={`flex-1 border-2 rounded-lg p-2 text-center cursor-pointer transition-all ${form.tipo_letra_profesion === 'Cursiva' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted bg-card'} ${errors.tipo_letra_profesion ? 'border-red-300' : ''}`}>
                      <input type="radio" name="tipo_letra_profesion" value="Cursiva" checked={form.tipo_letra_profesion === 'Cursiva'} onChange={handleChange} className="sr-only" />
                      <span className="block text-[1.15rem] leading-tight text-foreground" style={{ fontFamily: "cursive, 'Brush Script MT', 'Lucida Handwriting'" }}>Cursiva</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">Ligada</span>
                    </label>
                  </div>
                  {errors.tipo_letra_profesion && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.tipo_letra_profesion}</p>}
                </div>
              </div>
              
              {/* Universidad + Color de Hilo Visual */}
              <div className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-foreground">Universidad / Institución</label>
                  <select 
                    value={univOtra ? "Otra" : form.bordado_universidad} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Otra") {
                        setUnivOtra(true);
                        setForm(prev => ({ ...prev, bordado_universidad: "" }));
                      } else {
                        setUnivOtra(false);
                        setForm(prev => ({ ...prev, bordado_universidad: val }));
                      }
                      setErrors(prev => ({ ...prev, bordado_universidad: "" }));
                    }} 
                    className={getInputClass(!!errors.bordado_universidad && !univOtra)}
                  >
                    <option value="">Selecciona una opción...</option>
                    <option value="INACAP">INACAP</option>
                    <option value="Universidad Austral">Universidad Austral</option>
                    <option value="Universidad San Sebastián">Universidad San Sebastián</option>
                    <option value="Universidad Santo Tomás">Universidad Santo Tomás</option>
                    <option value="Santo Tomás CFT">Santo Tomás CFT</option>
                    <option value="Ninguna">Ninguna / No aplica</option>
                    <option value="Otra">Otra institución...</option>
                  </select>
                  {univOtra && (
                    <input 
                      name="bordado_universidad" 
                      value={form.bordado_universidad} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`mt-2 ${getInputClass(!!errors.bordado_universidad)}`} 
                      placeholder="Escribe tu institución..." 
                    />
                  )}
                  {errors.bordado_universidad && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bordado_universidad}</p>}
                </div>

                <div className="pt-2 border-t border-border/50">
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Color del Hilo (Textos)</label>
                  <div className={`flex gap-4 p-2 rounded-xl bg-card border-2 ${errors.color_hilo ? 'border-red-300 bg-red-50/30' : 'border-transparent'}`}>
                    {[
                      { val: 'Verde', hex: '#059669', label: 'Verde' },
                      { val: 'Blanco', hex: '#FFFFFF', label: 'Blanco', border: true },
                      { val: 'Negro', hex: '#111827', label: 'Negro' }
                    ].map(color => (
                      <label key={color.val} className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group">
                         <input type="radio" name="color_hilo" value={color.val} checked={form.color_hilo === color.val} onChange={handleChange} className="sr-only" />
                         <div 
                           className={`w-8 h-8 rounded-full transition-all duration-200 shadow-sm ${form.color_hilo === color.val ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'group-hover:scale-110'} ${color.border ? 'border border-gray-300' : ''}`} 
                           style={{ backgroundColor: color.hex }}
                         />
                         <span className={`text-[11px] font-bold ${form.color_hilo === color.val ? 'text-primary' : 'text-muted-foreground'}`}>
                           {color.label}
                         </span>
                      </label>
                    ))}
                  </div>
                  {errors.color_hilo && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.color_hilo}</p>}
                </div>
              </div>

            </div>
          </section>

          {/* 4. ESPECIFICACIONES */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-1 border-b border-border pb-2">
              <AlignLeft className="w-5 h-5 text-primary" /> 4. Especificaciones del Bordado
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              * Escribe aquí solo si tienes alguna petición especial (Ej: Tamaño específico, omitir un detalle del logo, etc.).
            </p>
            <textarea 
              name="especificaciones" 
              value={form.especificaciones} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className={`${getInputClass(!!errors.especificaciones)} min-h-[100px] resize-y`} 
              placeholder="Escribe aquí tus observaciones adicionales..."
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