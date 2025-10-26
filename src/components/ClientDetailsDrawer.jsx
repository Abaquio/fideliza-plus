"use client"

import { X, User, Phone, Mail, Award, ShoppingBag, FileText } from "lucide-react"

export default function ClientDetailsDrawer({ open, onClose, client, onEdit }) {
  if (!client) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#480048] to-[#F07241] px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Detalles de cliente</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-180px)] px-6 py-6 space-y-6">
          {/* Avatar y nombre */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {client.nombre
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{client.nombre}</h3>
              <p className="text-sm text-gray-500">Cliente activo</p>
            </div>
          </div>

          {/* Datos principales */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-[#480048]" />
              Datos principales
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nombre completo</label>
                <p className="text-base font-medium text-gray-900 mt-1">{client.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">RUT</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{client.rut || "12.345.678"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">DV</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{client.dv || "9"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#480048]" />
              Contacto
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#601848]" />
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <p className="text-base font-medium text-gray-900 mt-0.5">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#601848]" />
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                  <p className="text-base font-medium text-gray-900 mt-0.5">{client.telefono}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-[#480048]" />
              Estado
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#F07241]/10 to-[#F07241]/5 rounded-lg p-4 border border-[#F07241]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-[#F07241]" />
                  <label className="text-xs font-semibold text-gray-600 uppercase">Puntos</label>
                </div>
                <p className="text-2xl font-bold text-[#F07241]">{client.puntos.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-[#480048]/10 to-[#480048]/5 rounded-lg p-4 border border-[#480048]/20">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-5 h-5 text-[#480048]" />
                  <label className="text-xs font-semibold text-gray-600 uppercase">Compras</label>
                </div>
                <p className="text-2xl font-bold text-[#480048]">{client.compras}</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#480048]" />
              Notas
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {client.notas || "No hay notas adicionales para este cliente."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#480048] to-[#F07241] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#480048]/30 transition-all"
          >
            Editar cliente
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  )
}
