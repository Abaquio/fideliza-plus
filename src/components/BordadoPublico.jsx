"use client"

import { useState } from "react"
import { Upload, User, Mail, Phone, FileText, CheckCircle, GraduationCap, AlignLeft, Image as ImageIcon } from "lucide-react"

export default function BordadoPublico() {
  const [formData, setFormData] = useState({
    contacto_nombre: "",
    contacto_apellido: "",
    contacto_rut: "",
    contacto_telefono: "+56 ",
    contacto_correo: "",
    modelo_bordado: "", // uss_obstetricia, uss_odontologia, u_austral, otro
    bordado_nombre: "",
    bordado_apellido: "",
    bordado_profesion: "",
    bordado_universidad: "",
    especificaciones: "",
    acepta_terminos: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  // Clase reutilizable para inputs
  const inputClass = "w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground"

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-10">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Medical Season</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wider">
            Bordado Clínico e Industrial
          </p>
        </div>

        <form className="p-6 sm:p-8 space-y-10" onSubmit={(e) => e.preventDefault()}>
          
          {/* 1. DATOS DE CONTACTO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <User className="w-5 h-5 text-primary" /> Datos de Contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Nombre</label>
                <input name="contacto_nombre" value={formData.contacto_nombre} onChange={handleChange} className={inputClass} placeholder="Ej: Juan" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Apellido</label>
                <input name="contacto_apellido" value={formData.contacto_apellido} onChange={handleChange} className={inputClass} placeholder="Ej: Pérez" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">RUT</label>
                <input name="contacto_rut" value={formData.contacto_rut} onChange={handleChange} className={inputClass} placeholder="12.345.678-9" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3"/> Teléfono
                </label>
                <input name="contacto_telefono" value={formData.contacto_telefono} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3"/> Correo Electrónico
                </label>
                <input type="email" name="contacto_correo" value={formData.contacto_correo} onChange={handleChange} className={inputClass} placeholder="hola@ejemplo.com" />
              </div>
            </div>
          </section>

          {/* 2. MODELO TIPO DE BORDADO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <ImageIcon className="w-5 h-5 text-primary" /> 1. Tipo de Bordado Universitario
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Selecciona el diseño base para tu uniforme:</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "uss_obstetricia", label: "USS Obstetricia", color: "bg-green-50 border-green-200" },
                { id: "uss_odontologia", label: "USS Odontología", color: "bg-emerald-50 border-emerald-200" },
                { id: "u_austral", label: "U. Austral (Matriz)", color: "bg-orange-50 border-orange-200" },
                { id: "otro", label: "N/A (Otro Logo)", color: "bg-muted border-border" }
              ].map((opcion) => (
                <label 
                  key={opcion.id} 
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.modelo_bordado === opcion.id 
                      ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]" 
                      : `${opcion.color} hover:shadow-sm grayscale-[0.5]`
                  }`}
                >
                  <input 
                    type="radio" 
                    name="modelo_bordado" 
                    value={opcion.id} 
                    onChange={handleChange} 
                    className="sr-only" 
                  />
                  {formData.modelo_bordado === opcion.id && (
                    <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-primary" />
                  )}
                  <span className="text-xs font-bold text-center mt-1">{opcion.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* 3. DATOS PARA TU BORDADO */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <GraduationCap className="w-5 h-5 text-primary" /> 2. Datos para tu Bordado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Nombre</label>
                <input name="bordado_nombre" value={formData.bordado_nombre} onChange={handleChange} className={inputClass} placeholder="Ej: Nombre 1 + Nombre 2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Apellido</label>
                <input name="bordado_apellido" value={formData.bordado_apellido} onChange={handleChange} className={inputClass} placeholder="Ej: Apellido 1 + Inicial 2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Profesión/Carrera</label>
                <input name="bordado_profesion" value={formData.bordado_profesion} onChange={handleChange} className={inputClass} placeholder="Ej: Enfermería" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 ml-1 text-foreground/80 uppercase">Universidad</label>
                <input name="bordado_universidad" value={formData.bordado_universidad} onChange={handleChange} className={inputClass} placeholder="Ej: U. San Sebastián" />
              </div>
            </div>
          </section>

          {/* 4. ADJUNTAR IMAGEN (Solo si es "Otro") */}
          {formData.modelo_bordado === "otro" && (
            <section className="animate-fade-in bg-muted/30 p-4 rounded-xl border border-border border-dashed">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <Upload className="w-5 h-5 text-primary" /> 3. Adjunta tu Logo
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Como seleccionaste "N/A", necesitamos tu logo en formato PNG (hasta 2MB).</p>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-primary/30 border-dashed rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-primary/60" />
                    <p className="mb-2 text-sm text-foreground/80"><span className="font-semibold text-primary">Haz clic para subir</span> o arrastra</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 2MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/png, image/jpeg" />
                </label>
              </div>
            </section>
          )}

          {/* 5. ESPECIFICACIONES */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
              <AlignLeft className="w-5 h-5 text-primary" /> 4. Especificaciones Adicionales
            </h2>
            <textarea 
              name="especificaciones" 
              value={formData.especificaciones} 
              onChange={handleChange} 
              className={`${inputClass} min-h-[120px] resize-y`} 
              placeholder="Cuéntanos de qué tamaño lo necesitas, color, si es en el lado izquierdo o derecho..."
            />
            <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
              Si tu idea es más personalizada, envíanos un correo a <a href="mailto:bordados@msvaldivia.com" className="text-primary font-semibold hover:underline">bordados@msvaldivia.com</a>
            </p>
          </section>

          {/* CHECKBOX Y BOTON */}
          <div className="pt-4 border-t border-border flex flex-col gap-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="acepta_terminos"
                checked={formData.acepta_terminos}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                Acepto que he revisado la información completada y declaro que los datos ingresados son los correctos para iniciar el trabajo.
              </span>
            </label>

            <button 
              type="button"
              disabled={!formData.acepta_terminos}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              <FileText className="w-5 h-5" /> Enviar Datos para Bordado
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}