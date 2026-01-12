"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Filter, Eye, Calendar, Trash2 } from "lucide-react"
import RegistrarCompraModal from "./modales/RegistrarCompraModal"
import DetallesCompraModal from "./modales/DetallesCompraModal"
import NuevoMovimientoModal from "./modales/NuevoMovimientoModal"
// ✅ NUEVO MODAL
import DetallesMovimientoModal from "./modales/DetallesMovimientoModal"

import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")

  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
}

function safeLower(s) {
  return String(s || "").toLowerCase()
}

function formatCLP(n) {
  const num = Number(n || 0)
  return num.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
}

function formatFecha(fechaISO) {
  if (!fechaISO) return "—"
  const d = new Date(fechaISO)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-CL")
}

function getToken() {
  const directKeys = ["token", "access_token", "auth_token", "jwt", "session_token"]
  for (const k of directKeys) {
    const v = sessionStorage.getItem(k) || localStorage.getItem(k)
    if (v) return v
  }
  return ""
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options)
  const ct = res.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")
  const data = isJson ? await res.json() : { ok: false, message: await res.text() }
  return { res, data }
}

function estadoLabel(estado) {
  const e = safeLower(estado)
  if (e === "vigente") return "Vigente"
  if (e === "anulada") return "Anulada"
  return estado || "—"
}

export default function Compras() {
  const API = getApiBase()

  const [vista, setVista] = useState("compras")

  // Modales Compras
  const [showRegistrar, setShowRegistrar] = useState(false)
  const [showDetalles, setShowDetalles] = useState(false)
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)

  // Modales Movimientos
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false)
  // ✅ Nuevo estado para ver/editar movimiento
  const [showDetalleMovimiento, setShowDetalleMovimiento] = useState(false)
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null)

  const [loading, setLoading] = useState(false)

  const [clientes, setClientes] = useState([])
  const [clientesConPuntos, setClientesConPuntos] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [compras, setCompras] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cupones, setCupones] = useState([])

  const [config, setConfig] = useState({ monto_base_puntos: 1000, puntos_por_cada_monto: 1 })

  // filtros
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState("todos")
  const [sucursal, setSucursal] = useState("todas")
  const [desde, setDesde] = useState("") 
  const [hasta, setHasta] = useState("")

  // ✅ Confirm + Validado
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState({ id: null, type: "", title: "", message: "" }) // type: 'compra' | 'movimiento'

  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoData, setValidadoData] = useState({ title: "Acción realizada", message: "OK" })

  const authHeaders = () => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const handle401 = () => alert("Sesión expirada o no has iniciado sesión. Vuelve a loguearte.")

  const showOk = (title, message) => {
    setValidadoData({ title, message })
    setValidadoOpen(true)
    window.clearTimeout(showOk._t)
    showOk._t = window.setTimeout(() => setValidadoOpen(false), 2500)
  }

  // --- FETCHERS ---
  const fetchConfigPuntos = async () => {
    const { res, data } = await jsonFetch(`${API}/api/configuracion/puntos`, { headers: { ...authHeaders() } })
    if (res.status === 401) return handle401()
    if (data?.ok) setConfig(data.data)
  }

  const fetchMeta = async () => {
    const { res, data } = await jsonFetch(`${API}/api/compras/meta`, { headers: { ...authHeaders() } })
    if (res.status === 401) return handle401()
    if (data?.ok) {
      setClientes(data.clientes || [])
      setSucursales(data.sucursales || [])
    }
  }

  const fetchClientesConPuntos = async () => {
    const { res, data } = await jsonFetch(`${API}/api/clientes`, { headers: { ...authHeaders() } })
    if (res.status === 401) return handle401()
    if (data?.ok) {
      const list = data.data || data.clientes || []
      setClientesConPuntos(Array.isArray(list) ? list : [])
    }
  }

  const fetchCupones = async () => {
    const candidates = [`${API}/api/descuentos`]
    for (const url of candidates) {
      try {
        const { res, data } = await jsonFetch(url, { headers: { ...authHeaders() } })
        if (res.ok && data?.ok) {
          const list = data.data || data.cupones || []
          if (Array.isArray(list)) {
            setCupones(list)
            return
          }
        }
      } catch {}
    }
    setCupones([])
  }

  const fetchCompras = async () => {
    const params = new URLSearchParams()
    if (estado !== "todos") params.set("estado", estado)
    if (sucursal !== "todas") params.set("sucursal_id", sucursal)
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)

    const { res, data } = await jsonFetch(`${API}/api/compras?${params.toString()}`, { headers: { ...authHeaders() } })
    if (res.status === 401) return handle401()
    if (data?.ok) setCompras(data.data || [])
  }

  const fetchMovimientos = async () => {
    const params = new URLSearchParams()
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)

    const { res, data } = await jsonFetch(`${API}/api/compras/ajustes?${params.toString()}`, { headers: { ...authHeaders() } })
    if (res.status === 401) return handle401()
    if (data?.ok) setMovimientos(data.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        await Promise.all([fetchMeta(), fetchConfigPuntos(), fetchCupones(), fetchClientesConPuntos()])
        await fetchCompras()
      } catch (e) { console.error(e) } 
      finally { setLoading(false) }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        if (vista === "compras") await fetchCompras()
        else await fetchMovimientos()
      } catch (e) { console.error(e) } 
      finally { setLoading(false) }
    })()
  }, [vista, estado, sucursal, desde, hasta])

  // --- MEMOS ---
  const comprasEnTabla = useMemo(() => {
    return (compras || []).map((c) => {
      const cli = c?.clientes || null
      const suc = c?.sucursales || null
      const clienteNombre = cli ? `${cli.nombres || ""} ${cli.apellidos || ""}`.trim() : "—"
      const inicial = cli?.nombres?.charAt(0) || "?"
      return {
        ...c,
        cliente_nombre: clienteNombre || "—",
        cliente_inicial: inicial,
        cliente_rut: cli?.rut || "—",
        sucursal_nombre: suc?.nombre || "—",
        puntos: Number(c?.puntos_ganados ?? 0) || 0,
      }
    })
  }, [compras])

  const comprasFiltradas = useMemo(() => {
    const query = safeLower(q.trim())
    if (!query) return comprasEnTabla
    return comprasEnTabla.filter((c) => {
      return (
        safeLower(c.cliente_nombre).includes(query) ||
        safeLower(c.cliente_rut).includes(query) ||
        safeLower(c.numero_folio).includes(query)
      )
    })
  }, [comprasEnTabla, q])

  const statsCompras = useMemo(() => {
    const vigentes = comprasFiltradas.filter((c) => safeLower(c.estado) === "vigente").length
    const anuladas = comprasFiltradas.filter((c) => safeLower(c.estado) === "anulada").length
    const totalMontoVigente = comprasFiltradas
      .filter((c) => safeLower(c.estado) === "vigente")
      .reduce((acc, c) => acc + Number(c.monto || 0), 0)
    return { vigentes, anuladas, totalMontoVigente }
  }, [comprasFiltradas])

  const movimientosEnTabla = useMemo(() => {
    return (movimientos || []).map((m) => {
      const cli = m?.clientes || null
      const usu = m?.usuarios || null
      const clienteNombre = cli ? `${cli.nombres || ""} ${cli.apellidos || ""}`.trim() : "—"
      const inicial = cli?.nombres?.charAt(0) || "?"
      return {
        ...m,
        cliente_nombre: clienteNombre || "—",
        cliente_inicial: inicial,
        cliente_rut: cli?.rut || "—",
        usuario_nombre: usu?.nombre || usu?.email || "—",
      }
    })
  }, [movimientos])

  const movimientosFiltrados = useMemo(() => {
    const query = safeLower(q.trim())
    if (!query) return movimientosEnTabla
    return movimientosEnTabla.filter((m) => {
      return safeLower(m.cliente_nombre).includes(query) || safeLower(m.cliente_rut).includes(query)
    })
  }, [movimientosEnTabla, q])

  const statsMov = useMemo(() => {
    const total = movimientosFiltrados.length
    const neto = movimientosFiltrados.reduce((acc, m) => acc + Number(m.puntos || 0), 0)
    return { total, neto }
  }, [movimientosFiltrados])

  // --- ACTIONS COMPRA ---
  const handleVerDetalles = (compra) => {
    setCompraSeleccionada({ ...compra, sucursal: compra.sucursal_nombre })
    setShowDetalles(true)
  }

  const handleRegistrarCompra = async (payload) => {
    try {
      setLoading(true)
      const { res, data } = await jsonFetch(`${API}/api/compras`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) return handle401()
      if (!data?.ok) throw new Error(data?.message || "Error")
      setShowRegistrar(false)
      await fetchCompras()
      showOk("Acción realizada", "Compra registrada correctamente.")
    } catch (e) { alert(e?.message) } 
    finally { setLoading(false) }
  }

  const handleUpdateCompra = async (compraId, payload) => {
    const { res, data } = await jsonFetch(`${API}/api/compras/${compraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (res.status === 401) return handle401()
    if (!data?.ok) throw new Error(data?.message || "Error")
    await fetchCompras()
    showOk("Acción realizada", "Compra actualizada correctamente.")
  }

  const pedirEliminarCompra = (compra) => {
    setConfirmPayload({
      id: compra.id,
      type: 'compra',
      title: "Eliminar compra",
      message: "¿Seguro que deseas eliminar esta compra? También se eliminarán sus puntos asociados.",
    })
    setConfirmOpen(true)
  }

  // --- ACTIONS MOVIMIENTO (NUEVO) ---
  const handleCrearMovimiento = async (payload) => {
    try {
      setLoading(true)
      const { res, data } = await jsonFetch(`${API}/api/compras/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.status === 401) return handle401()
      if (!data?.ok) throw new Error(data?.message || "Error")
      setShowNuevoMovimiento(false)
      await fetchMovimientos()
      await fetchClientesConPuntos()
      showOk("Acción realizada", "Movimiento registrado correctamente.")
    } catch (e) { alert(e?.message) } 
    finally { setLoading(false) }
  }

  const handleVerDetalleMovimiento = (mov) => {
    setMovimientoSeleccionado(mov)
    setShowDetalleMovimiento(true)
  }

  const handleUpdateMovimiento = async (id, payload) => {
    const { res, data } = await jsonFetch(`${API}/api/compras/movimientos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (res.status === 401) return handle401()
    if (!data?.ok) throw new Error(data?.message || "Error al actualizar")
    
    await fetchMovimientos()
    // Refrescar clientes para tener saldos actualizados
    await fetchClientesConPuntos()
  }

  const pedirEliminarMovimiento = (mov) => {
    setConfirmPayload({
      id: mov.id,
      type: 'movimiento',
      title: "Eliminar movimiento",
      message: `¿Estás seguro de eliminar este movimiento de ${mov.puntos} puntos? El saldo del cliente cambiará.`,
    })
    setConfirmOpen(true)
  }

  // --- CONFIRM GENÉRICO ---
  const handleConfirmarEliminacion = async () => {
    const { id, type } = confirmPayload
    if (!id) return setConfirmOpen(false)

    try {
      setLoading(true)
      let url = ""
      if (type === 'compra') url = `${API}/api/compras/${id}`
      if (type === 'movimiento') url = `${API}/api/compras/movimientos/${id}`

      const { res, data } = await jsonFetch(url, {
        method: "DELETE",
        headers: { ...authHeaders() },
      })

      if (res.status === 401) return handle401()
      if (!data?.ok) throw new Error(data?.message || "Error eliminando")

      setConfirmOpen(false)
      
      if (type === 'compra') {
        await fetchCompras()
        showOk("Eliminado", "La compra ha sido eliminada.")
      } else {
        await fetchMovimientos()
        await fetchClientesConPuntos()
        showOk("Eliminado", "El movimiento ha sido eliminado.")
      }

    } catch (e) {
      console.error(e)
      alert(e?.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Compras / Movimientos</h1>
            <div className="inline-flex items-center rounded-xl border border-border bg-muted p-1">
              <button onClick={() => setVista("compras")} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${vista === "compras" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>Compras</button>
              <button onClick={() => setVista("movimientos")} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${vista === "movimientos" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>Movimientos</button>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">{vista === "compras" ? "Registra y revisa las compras de clientes." : "Revisa ajustes manuales de puntos."}</p>
        </div>
        {vista === "compras" ? (
          <button onClick={() => setShowRegistrar(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors w-full sm:w-auto shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Registrar Compra
          </button>
        ) : (
          <button onClick={() => setShowNuevoMovimiento(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors w-full sm:w-auto shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Nuevo Movimiento
          </button>
        )}
      </div>

      {/* Stats */}
      {vista === "compras" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Vigentes</p>
            <p className="text-2xl font-bold mt-1">{statsCompras.vigentes}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Anuladas</p>
            <p className="text-2xl font-bold mt-1">{statsCompras.anuladas}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total monto vigente</p>
            <p className="text-2xl font-bold mt-1">{formatCLP(statsCompras.totalMontoVigente)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Movimientos</p>
            <p className="text-2xl font-bold mt-1">{statsMov.total}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Puntos netos</p>
            <p className="text-2xl font-bold mt-1">{statsMov.neto}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex items-start gap-2 mb-4">
          <div className="p-2 rounded-lg bg-muted"><Filter className="w-4 h-4" /></div>
          <div>
            <h3 className="font-semibold">Filtros</h3>
            <p className="text-sm text-muted-foreground">{loading ? "Cargando..." : "Ajusta la vista según lo que necesites."}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label className="text-sm font-medium block mb-2">Buscar</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente, RUT o folio…" className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={vista !== "compras"} className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
              <option value="todos">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Sucursal</label>
            <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} disabled={vista !== "compras"} className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
              <option value="todas">Todas</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Desde</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Hasta</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* TABLAS */}
      {vista === "compras" ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h3 className="font-semibold">Listado de compras</h3>
            <p className="text-sm text-muted-foreground">Mostrando {comprasFiltradas.length} de {comprasEnTabla.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Puntos</th>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay compras para los filtros seleccionados.</td></tr>
                ) : (
                  comprasFiltradas.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">{c.cliente_inicial || "?"}</div>
                          <div className="min-w-0"><p className="font-medium truncate">{c.cliente_nombre}</p><p className="text-xs text-muted-foreground truncate">{c.cliente_rut}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCLP(c.monto)}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">+{Number(c.puntos || 0)} pts</span></td>
                      <td className="px-4 py-3">{c.sucursal_nombre || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatFecha(c.fecha_compra)}</td>
                      <td className="px-4 py-3">
                        <span className={["inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", safeLower(c.estado) === "vigente" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"].join(" ")}>
                          {estadoLabel(c.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleVerDetalles(c)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Ver detalles"><Eye className="w-4 h-4" /><span className="hidden sm:inline">Ver</span></button>
                          <button onClick={() => pedirEliminarCompra(c)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Eliminar</span></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h3 className="font-semibold">Listado de movimientos</h3>
            <p className="text-sm text-muted-foreground">Mostrando {movimientosFiltrados.length} de {movimientosEnTabla.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Puntos</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  {/* ✅ Nueva Columna Acciones */}
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay movimientos para los filtros seleccionados.</td></tr>
                ) : (
                  movimientosFiltrados.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">{m.cliente_inicial || "?"}</div>
                          <div className="min-w-0"><p className="font-medium truncate">{m.cliente_nombre}</p><p className="text-xs text-muted-foreground truncate">{m.cliente_rut}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{Number(m.puntos || 0)} pts</span></td>
                      <td className="px-4 py-3">{m.usuario_nombre || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatFecha(m.creado_en)}</td>
                      {/* ✅ Acciones para Movimientos */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleVerDetalleMovimiento(m)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Ver detalles"><Eye className="w-4 h-4" /><span className="hidden sm:inline">Ver</span></button>
                          <button onClick={() => pedirEliminarMovimiento(m)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Eliminar</span></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <RegistrarCompraModal open={showRegistrar} onClose={() => setShowRegistrar(false)} onSubmit={handleRegistrarCompra} clientes={clientes} sucursales={sucursales} config={config} />
      <DetallesCompraModal open={showDetalles} onClose={() => setShowDetalles(false)} compra={compraSeleccionada} sucursales={sucursales} onUpdate={handleUpdateCompra} cupones={cupones} />
      <NuevoMovimientoModal open={showNuevoMovimiento} onClose={() => setShowNuevoMovimiento(false)} clientes={clientesConPuntos.length ? clientesConPuntos : clientes} cupones={cupones} puntosActuales={0} onSubmit={handleCrearMovimiento} />
      
      {/* ✅ NUEVO MODAL MOVIMIENTO */}
      <DetallesMovimientoModal open={showDetalleMovimiento} onClose={() => setShowDetalleMovimiento(false)} movimiento={movimientoSeleccionado} onUpdate={handleUpdateMovimiento} />

      <ConfirmDialog open={confirmOpen} title={confirmPayload.title} message={confirmPayload.message} confirmLabel="Eliminar" cancelLabel="Cancelar" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmarEliminacion} />
      <ValidadoCard open={validadoOpen} title={validadoData.title} message={validadoData.message} onClose={() => setValidadoOpen(false)} />
    </div>
  )
}