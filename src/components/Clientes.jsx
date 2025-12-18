"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, Eye, Edit, Mail, Phone } from "lucide-react"
import NuevoClienteModal from "../components/modales/NuevoClienteModal"
import ImportarClientesModal from "../components/modales/ImportarClientesModal"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getAuthToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || ""
}

function formatDateCL(iso) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("es-CL")
}

function getDisplayName(c) {
  const full = `${c.nombres || ""} ${c.apellidos || ""}`.trim()
  return full || "Cliente"
}

function computeTier(points) {
  if (points >= 7000) return "Oro"
  if (points >= 4000) return "Plata"
  return "Bronce"
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)

  // ✅ Import modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const getTierColor = (tier) => {
    switch (tier) {
      case "Oro":
        return "bg-chart-4/20 text-chart-4 border-chart-4/30"
      case "Plata":
        return "bg-muted text-foreground border-border"
      case "Bronce":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return "bg-muted text-foreground border-border"
    }
  }

  async function fetchClientes(term = "") {
    setLoading(true)
    setErrorMsg("")
    try {
      const token = getAuthToken()
      const qs = new URLSearchParams()
      if (term?.trim()) qs.set("search", term.trim())

      const res = await fetch(`${API_URL}/api/clientes?${qs.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "No se pudo cargar clientes")

      const list = Array.isArray(data?.clientes) ? data.clientes : []

      const adapted = list.map((c) => {
        const points = Number(c.puntos_total || 0)
        const purchases = Number(c.compras_total || 0)
        const tier = computeTier(points)

        return {
          ...c,
          name: getDisplayName(c),
          phone: c.telefono || "-",
          email: c.email || "-",
          points,
          purchases,
          tier,
          joined: formatDateCL(c.creado_en),
        }
      })

      setClientes(adapted)
    } catch (e) {
      setErrorMsg(e.message || "Error cargando clientes")
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchClientes(searchTerm)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  async function handleCreateCliente(payload) {
    setSaving(true)
    setErrorMsg("")
    try {
      const token = getAuthToken()

      const res = await fetch(`${API_URL}/api/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "No se pudo crear el cliente")

      setShowModal(false)
      await fetchClientes(searchTerm)
    } catch (e) {
      setErrorMsg(e.message || "Error creando cliente")
    } finally {
      setSaving(false)
    }
  }

  // ✅ Por ahora: solo simula importación (después lo conectamos a /api/clientes/importar)
  async function handleImportClientes(driveUrl) {
    setImporting(true)
    setErrorMsg("")
    try {
      console.log("Importar clientes desde:", driveUrl)
      // Luego: await fetch(`${API_URL}/api/clientes/importar`, { method:'POST', ... })
      // Y al final: await fetchClientes(searchTerm)
      setShowImportModal(false)
    } catch (e) {
      setErrorMsg(e.message || "Error importando clientes")
    } finally {
      setImporting(false)
    }
  }

  // ✅ Recargar una fuente guardada (misma acción que importar por ahora)
  async function handleReloadSource(source) {
    return handleImportClientes(source.url)
  }

  // ✅ Quitar fuente (la UI ya la elimina sola, esto queda por si luego lo guardas en BD)
  function handleRemoveSource(source) {
    console.log("Fuente removida:", source)
  }

  const emptyState = useMemo(() => {
    return !loading && clientes.length === 0
  }, [loading, clientes.length])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes y sus puntos</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth border border-border"
          >
            Importar
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 transition-smooth shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4">
          {errorMsg}
        </div>
      ) : null}

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Todos los niveles</option>
            <option>Oro</option>
            <option>Plata</option>
            <option>Bronce</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
          Cargando clientes...
        </div>
      ) : null}

      {emptyState ? (
        <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
          No hay clientes para mostrar.
        </div>
      ) : null}

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((cliente, index) => (
          <div
            key={cliente.id}
            className="bg-card border border-border rounded-xl p-6 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {cliente.name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="font-bold">{cliente.name}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getTierColor(cliente.tier)}`}>
                    {cliente.tier}
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Ver">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span className="truncate">{cliente.phone}</span>
              </div>
              <div className="text-xs text-muted-foreground">RUT: {cliente.rut}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-2xl font-bold text-primary">{Number(cliente.points || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Puntos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Number(cliente.purchases || 0)}</p>
                <p className="text-xs text-muted-foreground">Compras</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              Cliente desde {cliente.joined}
            </div>
          </div>
        ))}
      </div>

      <NuevoClienteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateCliente}
        isSaving={saving}
      />

      <ImportarClientesModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportClientes}
        onReloadSource={handleReloadSource}
        onRemoveSource={handleRemoveSource}
        isImporting={importing}
      />
    </div>
  )
}
