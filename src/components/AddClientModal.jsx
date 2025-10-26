"use client"
import { X } from "lucide-react"
import { useEffect } from "react"

export default function AddClientModal({ open, onClose, onSubmit }) {
  // opcional: bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = original }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay: SOLO aquí va el blur/oscurecido */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: fondo sólido, sin blur ni opacity */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative">
          <div className="h-14 bg-gradient-to-r from-[#480048] to-[#F07241]" />
          <h2 className="absolute left-6 top-1/2 -translate-y-1/2 text-white text-lg font-semibold">
            Agregar nuevo cliente
          </h2>
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md text-white/90 hover:bg-white/15"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form
          className="p-6 lg:p-8 space-y-5"
          onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
        >
          {/* RUT + DV */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="12345678"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DV <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="9"
                maxLength={1}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
              />
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Juan Pérez González"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
            />
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                placeholder="+56 9 1234 5678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              rows={3}
              placeholder="Información adicional sobre el cliente…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-4 focus:ring-[#F07241]/25 focus:border-[#F07241]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white shadow hover:opacity-95"
              style={{ background: "linear-gradient(135deg,#480048,#F07241)" }}
            >
              Guardar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}