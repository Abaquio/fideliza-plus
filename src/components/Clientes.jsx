"use client"

import { useEffect, useState } from "react"
import { Search, UserPlus, Mail, Phone, Award } from "lucide-react"
import AddClientModal from "./AddClientModal"
import ClientDetailsDrawer from "./ClientDetailsDrawer"

export default function Clientes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("nombre")
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadClientes() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/clientes")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const items = Array.isArray(json) ? json : json.items ?? []
        if (!cancelled) setClientes(items)
      } catch (err) {
        console.error("Error cargando clientes:", err)
        if (!cancelled) setError("No se pudieron cargar los clientes. Intenta nuevamente.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadClientes()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredClientes = clientes.filter((cliente) => {
    if (!searchTerm) return true
    const nombre = cliente.nombreCompleto || cliente.nombre_completo || cliente.nombre || ""
    const rutFmt = cliente.rut_formateado || cliente.rut || ""
    const dv = cliente.dv || ""
    const searchLower = searchTerm.toLowerCase()
    if (searchBy === "nombre") {
      return nombre.toLowerCase().includes(searchLower)
    } else {
      const rutClean = `${rutFmt}${dv}`.replace(/[.\-]/g, "")
      const searchClean = searchTerm.replace(/[.\-]/g, "")
      return rutClean.includes(searchClean)
    }
  })

  const handleViewDetails = (cliente) => {
    setSelectedClient(cliente)
    setIsDrawerOpen(true)
  }

  const handleEditFromDrawer = () => {
    console.log("Editar cliente:", selectedClient)
    setIsDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Clientes</h2>
          <p className="text-muted-foreground">Gestiona tu base de clientes fidelizados</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#480048] hover:bg-[#601848] text-white rounded-lg transition-colors shadow-lg shadow-[#480048]/20"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex gap-3">
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048] text-sm font-medium"
          >
            <option value="nombre">Nombre</option>
            <option value="rut">RUT</option>
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchBy === "nombre" ? "Buscar por nombre..." : "Buscar por RUT..."}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#480048]"
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground">
          Cargando clientes…
        </div>
      )}
      {error && !loading && (
        <div className="bg-card rounded-xl border border-border p-6 text-center text-red-600">
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Puntos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Compras</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClientes.length > 0 ? (
                  filteredClientes.map((cliente, idx) => {
                    const rutFmt = cliente.rut_formateado || cliente.rut || "—"
                    const nombre = cliente.nombreCompleto || cliente.nombre_completo || cliente.nombre || "—"
                    const email = cliente.email || "—"
                    const telefono = cliente.telefono || "—"
                    const puntos = cliente.puntos ?? 0
                    const compras = cliente.compras ?? 0

                    // Avatar corregido
                    const iniciales =
                      nombre && nombre.trim() !== "—"
                        ? nombre
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase() ?? "")
                            .join("") || "—"
                        : "—"

                    return (
                      <tr key={cliente.id || idx} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center text-white font-semibold">
                              <span className="leading-none select-none">{iniciales}</span>
                            </div>

                            {/* Nombre y RUT */}
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{nombre}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {rutFmt}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {telefono}
                            </div>
                          </div>
                        </td>

                        {/* Puntos */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#F07241]" />
                            <span className="font-semibold text-[#F07241]">
                              {Number(puntos).toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* Compras */}
                        <td className="px-6 py-4">
                          <span className="font-medium">{Number(compras).toLocaleString()}</span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(cliente)}
                            className="px-3 py-1 text-sm font-medium text-[#480048] hover:bg-[#480048] hover:text-white border border-[#480048] rounded-lg transition-colors"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron clientes que coincidan con “{searchTerm}”
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal agregar cliente */}
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar nuevo cliente">
        {/* El contenido interno del modal permanece igual */}
      </AddClientModal>

      {/* Drawer de detalles */}
      <ClientDetailsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        client={selectedClient}
        onEdit={handleEditFromDrawer}
      />
    </div>
  )
}