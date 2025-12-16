"use client"

import { useState } from "react"
import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import Dashboard from "./components/Dashboard"
import Clientes from "./components/Clientes"
import Compras from "./components/Compras"
import Descuentos from "./components/Descuentos"
import Staff from "./components/Staff"
import Configuracion from "./components/Configuracion"

function App() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user] = useState({
    name: "Admin Usuario",
    email: "admin@fidelizaplus.com",
    avatar: "👤",
  })

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />
      case "clientes":
        return <Clientes />
      case "compras":
        return <Compras />
      case "descuentos":
        return <Descuentos />
      case "staff":
        return <Staff />
      case "configuracion":
        return <Configuracion />
      default:
        return <Dashboard />
    }
  }

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
          <div className="max-w-7xl mx-auto">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}

export default App
