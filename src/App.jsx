"use client"

import { useEffect, useMemo, useState } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"

import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"

import Dashboard from "./components/Dashboard"
import Clientes from "./components/Clientes"
import Compras from "./components/Compras"
import Descuentos from "./components/Descuentos"
import Staff from "./components/Staff"
import PerfilFull from "./components/PerfilFull"
import Login from "./components/Login"

const PATH_TO_VIEW = {
  "/dashboard": "dashboard",
  "/clientes": "clientes",
  "/compras": "compras",
  "/descuentos": "descuentos",
  "/staff": "staff",
  "/perfil": "dashboard",
}

function readSession() {
  const token = localStorage.getItem("token")
  let user = null
  try {
    user = JSON.parse(localStorage.getItem("user") || "null")
  } catch {
    user = null
  }
  return { token, user }
}

function AppLayout({ currentView, setCurrentView, sidebarOpen, setSidebarOpen, user, children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  const [currentView, setCurrentView] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [{ token, user }, setSession] = useState(() => readSession())
  const isAuthed = !!token

  // Sidebar active al recargar
  useEffect(() => {
    const viewFromPath = PATH_TO_VIEW[location.pathname]
    if (viewFromPath && viewFromPath !== currentView) setCurrentView(viewFromPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // ✅ actualiza sesión si cambia localStorage en otra pestaña
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") setSession(readSession())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // ✅ actualiza sesión en esta misma pestaña (login/logout)
  useEffect(() => {
    const onAuthChanged = () => setSession(readSession())
    window.addEventListener("auth-changed", onAuthChanged)
    return () => window.removeEventListener("auth-changed", onAuthChanged)
  }, [])

  const topbarUser = useMemo(() => {
    if (!user) return { name: "Usuario", email: "", avatar: "👤" }
    return {
      name: user?.nombre || user?.name || "Usuario",
      email: user?.email || "",
      avatar: user?.avatar || "👤",
    }
  }, [user])

  const wrapLayout = (children) => (
    <AppLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      user={topbarUser}
    >
      {children}
    </AppLayout>
  )

  const requireAuth = (element) => (isAuthed ? element : <Navigate to="/login" replace />)

  const routes = useMemo(
    () => (
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />

        <Route path="/dashboard" element={requireAuth(wrapLayout(<Dashboard />))} />
        <Route path="/clientes" element={requireAuth(wrapLayout(<Clientes />))} />
        <Route path="/compras" element={requireAuth(wrapLayout(<Compras />))} />
        <Route path="/descuentos" element={requireAuth(wrapLayout(<Descuentos />))} />
        <Route path="/staff" element={requireAuth(wrapLayout(<Staff />))} />
        <Route path="/perfil" element={requireAuth(wrapLayout(<PerfilFull />))} />

        <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    ),
    [currentView, sidebarOpen, topbarUser, isAuthed]
  )

  return routes
}
