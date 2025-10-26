"use client"

import { useState } from "react"
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"

import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import Dashboard from "../components/Dashboard"
import Clientes from "../components/Clientes"
import Compras from "../components/Compras"
import Cupones from "../components/Cupones"
import Configuracion from "../components/Configuracion"
import ProfileView from "../components/ProfileView"

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Derivamos la "sección activa" desde la URL para resaltar el Sidebar.
  // Ej: /clientes/nuevo -> "clientes"
  const path = location.pathname.split("/")[1] || "dashboard"
  const activeSection = ["dashboard","clientes","compras","cupones","configuracion","perfil"].includes(path)
    ? path
    : "dashboard"

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        // ahora Sidebar debería navegar en vez de setear estado:
        setActiveSection={(slug) => navigate(`/${slug}`)}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          // permite que "Ver perfil" del menú admin navegue
          onNavigate={(slug) => navigate(`/${slug}`)}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Clientes y variantes (por ahora renderiza el mismo componente) */}
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/nuevo" element={<Clientes />} />
            <Route path="/clientes/:id" element={<Clientes />} />

            <Route path="/compras" element={<Compras />} />
            <Route path="/cupones" element={<Cupones />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/perfil" element={<ProfileView />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}