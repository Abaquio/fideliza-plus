"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X, Search, Calendar } from "lucide-react"

// ✅ Helpers para hacer fetch en tiempo real
function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus-production.up.railway.app"
}

function getToken() {
  const directKeys = ["token", "access_token", "auth_token", "jwt", "session_token"]
  for (const k of directKeys) {
    const v = sessionStorage.getItem(k) || localStorage.getItem(k)
    if (v) return v
  }
  return ""
}

function formatCLP(n) {
  const num = Number(n || 0)
  return num.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
}

function toDatetimeLocalValueNow() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function safeLower(s) {
  return String(s || "").toLowerCase()
}

function calcularPuntos(monto, config) {
  const base = Number(config?.monto_base_puntos ?? 1000) || 1000
  const porCada = Number(config?.puntos_por_cada_monto ?? 1) || 1
  const m = Number(monto || 0)
  if (!Number.isFinite(m) || m <= 0) return 0
  if (!Number.isFinite(base) || base <= 0) return 0
  return Math.floor(m / base) * porCada
}

export default function RegistrarCompraModal({
  open,
  onClose,
  onSubmit,
  clientes = [], // Lo mantenemos por compatibilidad del componente padre
  sucursales = [],
  config,
}) {
  if (!open) return null

  const [clienteQuery, setClienteQuery] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [clienteObj, setClienteObj] = useState(null) // ✅ Guardamos el cliente completo seleccionado
  const [isFocused, setIsFocused] = useState(false)

  // ✅ Nuevos estados para la búsqueda directa a la base de datos
  const [clientesBuscados, setClientesBuscados] = useState([])
  const [buscando, setBuscando] = useState(false)

  const [monto, setMonto] = useState("")
  const [estado, setEstado] = useState("vigente")
  const [fechaCompra, setFechaCompra] = useState(toDatetimeLocalValueNow())
  const [numeroFolio, setNumeroFolio] = useState("")
  const [sucursalId, setSucursalId] = useState("")

  const blurTimer = useRef(null)

  useEffect(() => {
    setClienteQuery("")
    setClienteId("")
    setClienteObj(null)
    setClientesBuscados([])
    setIsFocused(false)

    setMonto("")
    setEstado("vigente")
    setFechaCompra(toDatetimeLocalValueNow())
    setNumeroFolio("")
    setSucursalId("")
  }, [open])

  // ✅ EFECTO MAGICO: Busca en la base de datos a medida que escribes
  useEffect(() => {
    const q = safeLower(clienteQuery.trim())
    if (!q) {
      setClientesBuscados([])
      return
    }

    // Si ya seleccionaste a un cliente, no volvemos a buscar a la BD
    if (clienteId) return

    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const API = getApiBase()
        const token = getToken()
        const res = await fetch(`${API}/api/clientes?search=${encodeURIComponent(q)}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        if (data?.ok) {
           // Limitamos a 30 visualmente en el dropdown para no alargar la pantalla
           setClientesBuscados(data.clientes.slice(0, 30) || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setBuscando(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [clienteQuery, clienteId])

  // Solo mostrar el dropdown si está enfocado, hay texto y aún no ha seleccionado a nadie
  const showDropdown = isFocused && clienteQuery.trim().length > 0 && !clienteId

  const puntos = useMemo(() => calcularPuntos(monto, config), [monto, config])

  const formulaTxt = useMemo(() => {
    const base = Number(config?.monto_base_puntos ?? 1000) || 1000
    const porCada = Number(config?.puntos_por_cada_monto ?? 1) || 1
    return `floor(monto / ${base}) * ${porCada}`
  }, [config])

  const handlePickCliente = (c) => {
    setClienteId(c.id)
    setClienteObj(c)
    setClienteQuery(`${(c.nombres || "").trim()} ${(c.apellidos || "").trim()} (${c.rut})`.trim())
    setIsFocused(false)
  }

  const handleSubmit = async () => {
    if (!clienteId) return alert("Selecciona un cliente")
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum < 0) return alert("Monto inválido")

    const payload = {
      cliente_id: clienteId,
      sucursal_id: sucursalId || null,
      monto: montoNum,
      estado, // vigente/anulada
      fecha_compra: fechaCompra ? new Date(fechaCompra).toISOString() : null,
      numero_folio: numeroFolio || null,
    }

    await onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl animate-scale-in overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Registrar Compra</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa el monto y selecciona el cliente. El vendedor se asigna automáticamente.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Cliente búsqueda */}
          <div className="relative">
            <label className="text-sm font-medium block mb-2">Cliente</label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value)
                  setClienteId("") // si editas texto, de-selecciona
                  setClienteObj(null)
                }}
                onFocus={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current)
                  setIsFocused(true)
                }}
                onBlur={() => {
                  // delay para permitir click en dropdown
                  blurTimer.current = setTimeout(() => setIsFocused(false), 150)
                }}
                placeholder="Escribe RUT o nombre…"
                className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* dropdown SOLO cuando escribes */}
            {showDropdown && (
              <div className="mt-2 border border-border rounded-lg overflow-hidden bg-card absolute w-full z-10 shadow-lg">
                {buscando ? (
                  <div className="p-3 text-sm text-muted-foreground animate-pulse">Buscando en la base de datos...</div>
                ) : clientesBuscados.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">Sin coincidencias…</div>
                ) : (
                  <div className="max-h-56 overflow-y-auto">
                    {clientesBuscados.map((c) => {
                      const full = `${c.nombres || ""} ${c.apellidos || ""}`.trim()
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()} // evita blur antes del click
                          onClick={() => handlePickCliente(c)}
                          className="w-full text-left px-3 py-2 flex items-center justify-between gap-3 hover:bg-muted/60 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">{full || "—"}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.rut}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {clienteObj && (
              <p className="text-xs text-muted-foreground mt-2">
                Seleccionado: <span className="font-medium">{clienteObj.rut}</span>
              </p>
            )}
          </div>

          {/* Folio */}
          <div>
            <label className="text-sm font-medium block mb-2">N° Folio (opcional)</label>
            <input
              value={numeroFolio}
              onChange={(e) => setNumeroFolio(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: 000123"
            />
          </div>

          {/* Monto + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-2">Monto de Compra</label>
              <input
                type="number"
                value={monto}
                min="1"
                step="1"
                onChange={(e) => setMonto(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="$ 0"
              />
              <p className="text-xs text-muted-foreground mt-1">Preview: {formatCLP(monto)}</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="vigente">Vigente</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>
          </div>

          {/* Fecha + Sucursal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-2">Fecha de compra</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Sucursal</label>
              <select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Puntos */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Puntos a otorgar</p>
            <p className="text-2xl font-bold text-primary">
              {estado === "vigente" ? `${puntos} pts` : "0 pts"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula: <span className="font-mono">{formulaTxt}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  )
}