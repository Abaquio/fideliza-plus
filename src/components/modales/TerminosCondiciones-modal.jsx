import { X, ShieldCheck, Scale, Lock, FileText, Server } from "lucide-react"

export default function TerminosCondicionesModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Contenedor Principal */}
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl border border-border shadow-2xl flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Términos y Condiciones de Uso</h2>
              <p className="text-sm text-muted-foreground">Medical Season - Fideliza+ (Beta)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm sm:text-base leading-relaxed text-foreground/90">
          
          {/* Intro */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-1" />
            <p className="text-sm">
              <strong>Última actualización:</strong> 28 de Enero, 2026. <br/>
              Este documento regula el uso de la plataforma <strong>Fideliza+</strong>, desarrollada exclusivamente para <strong>Medical Season</strong>. Al utilizar el sistema, usted acepta las condiciones descritas a continuación.
            </p>
          </div>

          {/* 1. Marco Legal */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
              <Scale className="w-5 h-5 text-primary" />
              1. Marco Legal y Cumplimiento (Compliance)
            </h3>
            <p className="mb-2">
              El funcionamiento de esta plataforma se rige estrictamente bajo la legislación chilena vigente:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Ley N° 19.628:</strong> Sobre Protección de la Vida Privada y Protección de Datos de Carácter Personal.</li>
              <li><strong>Ley N° 19.496:</strong> Sobre Protección de los Derechos de los Consumidores.</li>
              <li><strong>Ley N° 21.459:</strong> Sobre Delitos Informáticos, penalizando el acceso ilícito o manipulación de saldos.</li>
            </ul>
          </section>

          {/* 2. ISO / Seguridad */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
              <Lock className="w-5 h-5 text-primary" />
              2. Estándares de Seguridad Informática
            </h3>
            <p className="mb-2">
              La arquitectura de la plataforma (Versión Beta) sigue principios de la norma <strong>ISO/IEC 27001</strong> para la gestión de seguridad:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <strong className="block text-foreground mb-1">Encriptación (TLS/SSL)</strong>
                <span className="text-muted-foreground text-sm">Todo el tráfico viaja cifrado (HTTPS). Nadie puede interceptar sus datos en tránsito.</span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <strong className="block text-foreground mb-1">Cifrado de Contraseñas</strong>
                <span className="text-muted-foreground text-sm">Uso de algoritmos de hashing irreversibles (Bcrypt/Argon2). Nadie puede leer su contraseña.</span>
              </div>
            </div>
          </section>

          {/* 3. Datos Sensibles */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              3. Tratamiento de Datos (Derechos ARCO)
            </h3>
            <p className="mb-2">
              <strong>Medical Season</strong> actúa como "Responsable del Tratamiento". El usuario tiene derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Acceso:</strong> Solicitar reporte de sus datos almacenados.</li>
              <li><strong>Rectificación:</strong> Corregir errores en su identificación (RUT, Nombre).</li>
              <li><strong>Cancelación:</strong> Solicitar la eliminación total de su cuenta.</li>
              <li><strong>Oposición:</strong> Negarse al uso de datos para fines publicitarios.</li>
            </ul>
          </section>

          {/* 4. Disponibilidad */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
              <Server className="w-5 h-5 text-primary" />
              4. Disponibilidad y Fase Beta
            </h3>
            <p className="text-muted-foreground">
              El usuario reconoce que la aplicación se encuentra en <strong>Fase Beta (Pruebas)</strong>. 
              Medical Season se reserva el derecho de corregir saldos ante fallas técnicas evidentes. 
              La infraestructura está alojada en servicios de nube de alta disponibilidad, pero no se garantiza un "uptime" del 100% durante esta etapa.
            </p>
          </section>

          {/* 5. Propiedad Intelectual */}
          <section className="border-t border-border pt-4">
            <h3 className="font-bold text-foreground mb-2">5. Propiedad Intelectual</h3>
            <p className="text-muted-foreground text-sm">
              Esta implementación de <strong>Fideliza+</strong> es exclusiva para <strong>Medical Season</strong>. 
              La marca, base de datos y registros son propiedad del cliente. El núcleo tecnológico (Core Software) es propiedad intelectual del desarrollador, licenciado para uso perpetuo de Medical Season.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-smooth shadow-lg shadow-primary/20"
          >
            Entendido, cerrar
          </button>
        </div>

      </div>
    </div>
  )
}