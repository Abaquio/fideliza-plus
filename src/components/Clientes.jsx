"use client"

import { useState } from "react"
import { Search, UserPlus, Mail, Phone, Award } from "lucide-react"
import AddClientModal from "./AddClientModal"          // ✅ usamos AddClientModal
import ClientDetailsDrawer from "./ClientDetailsDrawer"

export default function Clientes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("nombre") // 'nombre' | 'rut'

  // (Queda por si luego quieres controlar el form desde aquí; no rompe nada si no se usa)
  const [formData, setFormData] = useState({
    rut: "",
    dv: "",
    nombreCompleto: "",
    telefono: "",
    email: "",
    notas: "",
  })

  const clientes = [
    {
      id: 1,
      nombre: "María González",
      email: "maria@email.com",
      telefono: "555-0101",
      puntos: 2450,
      compras: 18,
      rut: "12.345.678",
      dv: "9",
      notas: "Cliente frecuente, prefiere productos orgánicos.",
    },
    {
      id: 2,
      nombre: "Carlos Ruiz",
      email: "carlos@email.com",
      telefono: "555-0102",
      puntos: 1890,
      compras: 12,
      rut: "23.456.789",
      dv: "0",
      notas: "Interesado en promociones de temporada.",
    },
    {
      id: 3,
      nombre: "Ana Martínez",
      email: "ana@email.com",
      telefono: "555-0103",
      puntos: 3200,
      compras: 24,
      rut: "34.567.890",
      dv: "1",
      notas: "VIP - Cliente desde 2020.",
    },
    {
      id: 4,
      nombre: "Luis Pérez",
      email: "luis@email.com",
      telefono: "555-0104",
      puntos: 1560,
      compras: 9,
      rut: "45.678.901",
      dv: "2",
      notas: "",
    },
    {
      id: 5,
      nombre: "Roberto Silva",
      email: "roberto@email.com",
      telefono: "555-0105",
      puntos: 8450,
      compras: 42,
      rut: "56.789.012",
      dv: "3",
      notas: "Cliente premium con mayor volumen de compras.",
    },
  ]

  // Filtro visual por nombre o RUT
  const filteredClientes = clientes.filter((cliente) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    if (searchBy === "nombre") {
      return cliente.nombre.toLowerCase().includes(searchLower)
    } else {
      const rutCompleto = `${cliente.rut}${cliente.dv}`.replace(/[.-]/g, "")
      const searchClean = searchTerm.replace(/[.-]/g, "")
      return rutCompleto.includes(searchClean)
    }
  })

  // Opcional (deja el handler por si luego controlas el form aquí)
  const handleFormStateChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Callback que consume AddClientModal (no recibe evento)
  const handleSaveCliente = () => {
    console.log("Cliente guardado (desde AddClientModal):", formData)
    setIsModalOpen(false)
  }

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

      {/* Barra de búsqueda con selector Nombre/RUT */}
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

      {/* Tabla */}
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
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center text-white font-semibold">
                          {cliente.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{cliente.nombre}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {cliente.rut}-{cliente.dv}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {cliente.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#F07241]" />
                        <span className="font-semibold text-[#F07241]">{cliente.puntos.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{cliente.compras}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(cliente)}
                        className="px-3 py-1 text-sm font-medium text-[#480048] hover:bg-[#480048] hover:text-white border border-[#480048] rounded-lg transition-colors"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    No se encontraron clientes que coincidan con "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Cliente (AddClientModal) */}
      <AddClientModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCliente}
      />

      {/* Drawer: Detalles de Cliente */}
      <ClientDetailsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        client={selectedClient}
        onEdit={handleEditFromDrawer}
      />
    </div>
  )
}