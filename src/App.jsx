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
import Configuracion from "./components/Configuracion"
import Login from "./components/Login"

// ✅ NUEVO: Importamos el componente de registro público
import RegistroPublico from "./components/RegistroPublico"

const PATH_TO_VIEW = {
  "/dashboard": "dashboard",
  "/clientes": "clientes",
  "/compras": "compras",
  "/descuentos": "descuentos",
  "/staff": "staff",
  "/configuracion": "configuracion",
  "/perfil": "perfil",
}

function safeParse(raw) {
  try {
    return JSON.parse(raw || "null")
  } catch {
    return null
  }
}

function readSession() {
  // token
  const token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""

  // user
  const user =
    safeParse(sessionStorage.getItem("user")) ||
    safeParse(localStorage.getItem("user")) ||
    null

  return { token, user }
}

function AppLayout({ children, currentView, setCurrentView, sidebarOpen, setSidebarOpen, user }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [currentView, setCurrentView] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { token: initialToken, user: initialUser } = readSession()
  const [token, setToken] = useState(initialToken)
  const [user, setUser] = useState(initialUser)

  const isAuthed = !!token

  // Sincronizar vista con URL
  useEffect(() => {
    const path = location.pathname
    if (PATH_TO_VIEW[path]) {
      setCurrentView(PATH_TO_VIEW[path])
    }
  }, [location])

  // Escuchar eventos de logout o storage
  useEffect(() => {
    const handleStorage = () => {
      const { token: t, user: u } = readSession()
      setToken(t)
      setUser(u)
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("auth:logout", handleLogout)
    window.addEventListener("auth-changed", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("auth:logout", handleLogout)
      window.removeEventListener("auth-changed", handleStorage)
    }
  }, [])

  const handleLogin = (data) => {
    if (data?.token) {
      sessionStorage.setItem("token", data.token)
      localStorage.setItem("token", data.token)
      setToken(data.token)
    }
    if (data?.user) {
      const s = JSON.stringify(data.user)
      sessionStorage.setItem("user", s)
      localStorage.setItem("user", s)
      setUser(data.user)
    }
    window.dispatchEvent(new Event("auth-changed"))
  }

  const handleLogout = () => {
    sessionStorage.clear()
    localStorage.clear()
    setToken("")
    setUser(null)
    window.dispatchEvent(new Event("auth-changed"))
  }

  const topbarUser = useMemo(() => {
    if (!user) return { nombre: "Usuario" }
    return {
      ...user,
      nombre: user?.nombre || user?.name || "Usuario",
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
        {/* ✅ Ruta Pública: Registro QR (Sin protección ni layout) */}
        <Route path="/unete" element={<RegistroPublico />} />

        <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />

        {/* Rutas Protegidas */}
        <Route path="/dashboard" element={requireAuth(wrapLayout(<Dashboard />))} />
        <Route path="/clientes" element={requireAuth(wrapLayout(<Clientes />))} />
        <Route path="/compras" element={requireAuth(wrapLayout(<Compras />))} />
        <Route path="/descuentos" element={requireAuth(wrapLayout(<Descuentos />))} />
        <Route path="/staff" element={requireAuth(wrapLayout(<Staff />))} />
        <Route path="/configuracion" element={requireAuth(wrapLayout(<Configuracion />))} />
        <Route path="/perfil" element={requireAuth(wrapLayout(<PerfilFull />))} />

        <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    ),
    [isAuthed, currentView, sidebarOpen, topbarUser]
  )

  return routes
}