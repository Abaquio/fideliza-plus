"use client"

import { useState } from "react"
import { User, Mail, Phone, Calendar, Clock, Hash, ChevronRight } from "lucide-react"

export default function ProfileView() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Inicio</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Perfil</span>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Tarjeta de perfil principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative h-28 bg-gradient-to-r from-[#480048] via-[#601848] to-[#F07241]">
          {/* Contenido del perfil dentro del gradiente */}
          <div className="absolute inset-x-6 bottom-3 flex items-end gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center border-4 border-white shadow-lg">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Datos básicos */}
            <div className="flex flex-col justify-end">
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow">
                Admin
              </h2>
              <p className="text-white/90 drop-shadow">admin@fidelizaplus.com</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/25 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                Administrador
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de datos básicos */}
        <div className="px-6 pb-6 ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mt-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#480048]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cuenta creada</p>
                <p className="text-sm font-medium text-gray-900">15 Ene 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F07241]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Último acceso</p>
                <p className="text-sm font-medium text-gray-900">Hoy, 10:30 AM</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#601848]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ID de usuario</p>
                <p className="text-sm font-medium text-gray-900">USR-001</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Información */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información</h3>
            <p className="text-sm text-gray-500">Datos personales de tu cuenta</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-[#480048] to-[#F07241] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre completo
            </label>
            <input
              type="text"
              value="Admin"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value="admin@fidelizaplus.com"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Teléfono
            </label>
            <input
              type="tel"
              value="+56 9 1234 5678"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Sección de Preferencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Preferencias</h3>
          <p className="text-sm text-gray-500">Personaliza tu experiencia en Fideliza+</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xl">{darkMode ? "🌙" : "☀️"}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tema oscuro</p>
              <p className="text-xs text-gray-500">Cambia la apariencia de la interfaz</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              darkMode ? "bg-gradient-to-r from-[#480048] to-[#F07241]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                darkMode ? "translate-x-7" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>
      </div>
    </div>
  )
}
