"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Filter, Eye, Calendar, Trash2 } from "lucide-react"
import RegistrarCompraModal from "./modales/RegistrarCompraModal"
import DetallesCompraModal from "./modales/DetallesCompraModal"
import NuevoMovimientoModal from "./modales/NuevoMovimientoModal"

// ✅ Componentes de tu UI
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

function toDateOnlyISO(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function getToken() {
  const directKeys = ["token", "access_token", "auth_token", "jwt", "session_token"]
  for (const k of directKeys) {
    const v = sessionStorage.getItem(k) || localStorage.getItem(k)
    if (v) return v
  }

  const jsonKeys = ["auth", "session", "user_session"]
  for (const k of jsonKeys) {
    const raw = sessionStorage.getItem(k) || localStorage.getItem(k)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.token) return parsed.token
      if (parsed?.access_token) return parsed.access_token
    } catch {}
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if (parsed?.access_token) return parsed.access_token
        if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token
      }
    }
  } catch {}

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

  const [showRegistrar, setShowRegistrar] = useState(false)
  const [showDetalles, setShowDetalles] = useState(false)
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)

  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false)

  const [loading, setLoading] = useState(false)

  const [clientes, setClientes] = useState([])
  // ✅ NUEVO: clientes con puntos_total (para que el modal muestre puntos actuales reales)
  const [clientesConPuntos, setClientesConPuntos] = useState([])

  const [sucursales, setSucursales] = useState([])
  const [compras, setCompras] = useState([])
  const [movimientos, setMovimientos] = useState([])

  const [cupones, setCupones] = useState([])

  // config real de puntos (para el modal)
  const [config, setConfig] = useState({ monto_base_puntos: 1000, puntos_por_cada_monto: 1 })

  // filtros
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState("todos")
  const [sucursal, setSucursal] = useState("todas")
  
  // 🔥 CORRECCIÓN 1: Iniciamos vacíos para traer TODO el historial
  const [desde, setDesde] = useState("") 
  const [hasta, setHasta] = useState("")

  // ✅ Confirm + Validado
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState({ id: null, title: "", message: "" })

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

  const fetchConfigPuntos = async () => {
    const { res, data } = await jsonFetch(`${API}/api/configuracion/puntos`, {
      headers: { ...authHeaders() },
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (!data?.ok) throw new Error(data?.message || "No se pudo cargar configuración de puntos")

    setConfig({
      monto_base_puntos: Number(data?.data?.monto_base_puntos ?? 1000) || 1000,
      puntos_por_cada_monto: Number(data?.data?.puntos_por_cada_monto ?? 1) || 1,
    })
  }

  const fetchMeta = async () => {
    const { res, data } = await jsonFetch(`${API}/api/compras/meta`, {
      headers: { ...authHeaders() },
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (res.status === 403) throw new Error("Sin permisos (403)")
    if (!data?.ok) throw new Error(data?.message || "No se pudo cargar meta")

    setClientes(data.clientes || [])
    setSucursales(data.sucursales || [])
  }

  // ✅ NUEVO: traer clientes con puntos_total (listarClientes)
  const fetchClientesConPuntos = async () => {
    const { res, data } = await jsonFetch(`${API}/api/clientes`, {
      headers: { ...authHeaders() },
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (res.status === 403) throw new Error("Sin permisos (403)")
    if (!data?.ok) throw new Error(data?.message || "No se pudieron cargar clientes con puntos")

    // tu API suele devolver en data.data (pero dejamos fallback por si cambia)
    const list = data.data || data.clientes || []
    setClientesConPuntos(Array.isArray(list) ? list : [])
  }

  // ✅ Intento “suave” para traer cupones (si existe endpoint)
  const fetchCupones = async () => {
    // 🔥 CORRECCIÓN 2: Apuntamos solo a la ruta real de tu backend (/api/descuentos)
    const candidates = [`${API}/api/descuentos`]

    for (const url of candidates) {
      try {
        const { res, data } = await jsonFetch(url, { headers: { ...authHeaders() } })
        if (res.ok && data?.ok) {
          // puede venir como data o cupones
          const list = data.data || data.cupones || []
          if (Array.isArray(list)) {
            setCupones(list)
            return
          }
        }
      } catch {
        // ignore
      }
    }

    setCupones([])
  }

  const fetchCompras = async () => {
    const params = new URLSearchParams()
    if (estado !== "todos") params.set("estado", estado)
    if (sucursal !== "todas") params.set("sucursal_id", sucursal)
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)

    const { res, data } = await jsonFetch(`${API}/api/compras?${params.toString()}`, {
      headers: { ...authHeaders() },
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (res.status === 403) throw new Error("Sin permisos (403)")
    if (!data?.ok) throw new Error(data?.message || "No se pudieron cargar compras")

    setCompras(data.data || [])
  }

  const fetchMovimientos = async () => {
    const params = new URLSearchParams()
    if (desde) params.set("desde", desde)
    if (hasta) params.set("hasta", hasta)

    // ✅ ahora backend devuelve ajuste + canje
    const { res, data } = await jsonFetch(`${API}/api/compras/ajustes?${params.toString()}`, {
      headers: { ...authHeaders() },
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (res.status === 403) throw new Error("Sin permisos (403)")
    if (!data?.ok) throw new Error(data?.message || "No se pudieron cargar movimientos")

    setMovimientos(data.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        // ✅ NUEVO: añadimos fetchClientesConPuntos sin tocar el resto
        await Promise.all([fetchMeta(), fetchConfigPuntos(), fetchCupones(), fetchClientesConPuntos()])
        await fetchCompras()
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        if (vista === "compras") await fetchCompras()
        else await fetchMovimientos()
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, estado, sucursal, desde, hasta])

  const comprasEnTabla = useMemo(() => {
    return (compras || []).map((c) => {
      const cli = c?.clientes || null
      const suc = c?.sucursales || null

      const clienteNombre = cli ? `${cli.nombres || ""} ${cli.apellidos || ""}`.trim() : "—"
      const inicial = cli?.nombres?.charAt(0) || "?"

      const puntos = Number(c?.puntos_ganados ?? 0) || 0

      return {
        ...c,
        cliente_nombre: clienteNombre || "—",
        cliente_inicial: inicial,
        cliente_rut: cli?.rut || "—",
        sucursal_nombre: suc?.nombre || "—",
        puntos,
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

  // puntos actuales por cliente (desde la lista de movimientos filtrada total histórica cargada)
  // ✅ si no alcanza, backend igual valida para no dejar negativo
  const puntosActualesByCliente = useMemo(() => {
    const map = new Map()
    for (const m of movimientos || []) {
      const cid = m.cliente_id
      if (!cid) continue
      map.set(cid, (map.get(cid) || 0) + Number(m.puntos || 0))
    }
    return map
  }, [movimientos])

  const handleVerDetalles = (compra) => {
    setCompraSeleccionada({
      ...compra,
      sucursal: compra.sucursal_nombre,
    })
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

      if (res.status === 401) {
        handle401()
        throw new Error("Sesión expirada (401)")
      }
      if (res.status === 403) throw new Error("Sin permisos (403)")
      if (!data?.ok) throw new Error(data?.message || "No se pudo crear la compra")

      setShowRegistrar(false)
      await fetchCompras()
      showOk("Acción realizada", "Compra registrada correctamente.")
    } catch (e) {
      console.error(e)
      alert(e?.message || "Error creando compra")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompra = async (compraId, payload) => {
    const { res, data } = await jsonFetch(`${API}/api/compras/${compraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })

    if (res.status === 401) {
      handle401()
      throw new Error("Sesión expirada (401)")
    }
    if (res.status === 403) throw new Error("Sin permisos (403)")
    if (!data?.ok) throw new Error(data?.message || "No se pudo actualizar la compra")

    await fetchCompras()
    showOk("Acción realizada", "Compra actualizada correctamente.")
  }

  const pedirEliminarCompra = (compra) => {
    setConfirmPayload({
      id: compra.id,
      title: "Eliminar compra",
      message: "¿Seguro que deseas eliminar esta compra? También se eliminarán sus puntos asociados.",
    })
    setConfirmOpen(true)
  }

  const confirmarEliminarCompra = async () => {
    const id = confirmPayload?.id
    if (!id) return setConfirmOpen(false)

    try {
      setLoading(true)
      const { res, data } = await jsonFetch(`${API}/api/compras/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      })

      if (res.status === 401) {
        handle401()
        throw new Error("Sesión expirada (401)")
      }
      if (res.status === 403) throw new Error("Sin permisos (403)")
      if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar la compra")

      setConfirmOpen(false)
      await fetchCompras()
      showOk("Acción realizada", "Compra eliminada correctamente.")
    } catch (e) {
      console.error(e)
      alert(e?.message || "Error eliminando compra")
    } finally {
      setLoading(false)
    }
  }

  // ✅ NUEVO: crear movimiento (ajuste/canje)
  const handleCrearMovimiento = async (payload) => {
    try {
      setLoading(true)

      const { res, data } = await jsonFetch(`${API}/api/compras/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        handle401()
        throw new Error("Sesión expirada (401)")
      }
      if (res.status === 403) throw new Error("Sin permisos (403)")
      if (!data?.ok) throw new Error(data?.message || "No se pudo guardar el movimiento")

      setShowNuevoMovimiento(false)
      await fetchMovimientos()

      // ✅ NUEVO: refresca puntos de clientes para que el modal muestre saldo real la próxima vez
      await fetchClientesConPuntos()

      showOk("Acción realizada", "Movimiento registrado correctamente.")
    } catch (e) {
      console.error(e)
      throw e
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
              <button
                type="button"
                onClick={() => setVista("compras")}
                className={[
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  vista === "compras"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Compras
              </button>
              <button
                type="button"
                onClick={() => setVista("movimientos")}
                className={[
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  vista === "movimientos"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Movimientos
              </button>
            </div>
          </div>

          <p className="text-muted-foreground mt-1">
            {vista === "compras"
              ? "Registra y revisa las compras de clientes."
              : "Revisa ajustes manuales de puntos."}
          </p>
        </div>

        {vista === "compras" ? (
          <button
            onClick={() => setShowRegistrar(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors w-full sm:w-auto shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Registrar Compra
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowNuevoMovimiento(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors w-full sm:w-auto shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Movimiento
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
          <div className="p-2 rounded-lg bg-muted">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold">Filtros</h3>
            <p className="text-sm text-muted-foreground">
              {loading ? "Cargando..." : "Ajusta la vista según lo que necesites."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label className="text-sm font-medium block mb-2">Buscar</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cliente, RUT o folio…"
                className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={vista !== "compras"}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            >
              <option value="todos">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Sucursal</label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              disabled={vista !== "compras"}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            >
              <option value="todas">Todas</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Desde</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-medium block mb-2">Hasta</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLAS */}
      {vista === "compras" ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h3 className="font-semibold">Listado de compras</h3>
            <p className="text-sm text-muted-foreground">
              Mostrando {comprasFiltradas.length} de {comprasEnTabla.length}
            </p>
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
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No hay compras para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  comprasFiltradas.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                            {c.cliente_inicial || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.cliente_nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.cliente_rut}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold">{formatCLP(c.monto)}</td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          +{Number(c.puntos || 0)} pts
                        </span>
                      </td>

                      <td className="px-4 py-3">{c.sucursal_nombre || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatFecha(c.fecha_compra)}</td>

                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            safeLower(c.estado) === "vigente"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-red-500/10 text-red-700",
                          ].join(" ")}
                        >
                          {estadoLabel(c.estado)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalles(c)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Ver</span>
                          </button>

                          <button
                            onClick={() => pedirEliminarCompra(c)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
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
            <p className="text-sm text-muted-foreground">
              Mostrando {movimientosFiltrados.length} de {movimientosEnTabla.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Puntos</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>

              <tbody>
                {movimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hay movimientos para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  movimientosFiltrados.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                            {m.cliente_inicial || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{m.cliente_nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.cliente_rut}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {Number(m.puntos || 0)} pts
                        </span>
                      </td>

                      <td className="px-4 py-3">{m.usuario_nombre || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatFecha(m.creado_en)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <RegistrarCompraModal
        open={showRegistrar}
        onClose={() => setShowRegistrar(false)}
        onSubmit={handleRegistrarCompra}
        clientes={clientes}
        sucursales={sucursales}
        config={config}
      />

      <DetallesCompraModal
        open={showDetalles}
        onClose={() => setShowDetalles(false)}
        compra={compraSeleccionada}
        sucursales={sucursales}
        onUpdate={handleUpdateCompra}
      />

      <NuevoMovimientoModal
        open={showNuevoMovimiento}
        onClose={() => setShowNuevoMovimiento(false)}
        // ✅ NUEVO: pasamos la lista que sí trae puntos_total
        clientes={clientesConPuntos.length ? clientesConPuntos : clientes}
        cupones={cupones}
        puntosActuales={0}
        onSubmit={handleCrearMovimiento}
      />

      {/* Confirm + Validado */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmPayload.title}
        message={confirmPayload.message}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmarEliminarCompra}
      />

      <ValidadoCard
        open={validadoOpen}
        title={validadoData.title}
        message={validadoData.message}
        onClose={() => setValidadoOpen(false)}
      />
    </div>
  )
}