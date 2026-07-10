"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X, User, Ticket, Plus, Minus, AlertTriangle } from "lucide-react"

// ✅ Helpers para hacer fetch en tiempo real
function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, "")
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  // En producción, la variable VITE_API_URL DEBE estar configurada en Vercel.
  // Devolver un string vacío hará que las peticiones fallen de forma obvia si no lo está.
  return ""
}

function getToken() {
  const directKeys = ["token", "access_token", "auth_token", "jwt", "session_token"]
  for (const k of directKeys) {
    const v = sessionStorage.getItem(k) || localStorage.getItem(k)
    if (v) return v
  }
  return ""
}

const TIPOS = [
  { value: "ajuste", label: "Ajuste manual" },
  { value: "canje", label: "Canje de cupón" },
]

export default function NuevoMovimientoModal({
  open,
  onClose,
  clientes = [], // Lo mantenemos por compatibilidad
  cupones = [],
  puntosActuales = 0,
  onSubmit,
}) {
  const [tipo, setTipo] = useState("ajuste")

  // ✅ búsqueda directa a la base de datos
  const [clienteId, setClienteId] = useState("")
  const [clienteObj, setClienteObj] = useState(null)
  const [clienteQuery, setClienteQuery] = useState("")
  const [clientesBuscados, setClientesBuscados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const inputRef = useRef(null)

  // Ajuste
  const [ajusteOperacion, setAjusteOperacion] = useState("sumar") // sumar | descontar
  const [ajusteCantidad, setAjusteCantidad] = useState("")

  // Canje
  const [cuponId, setCuponId] = useState("")
  const [cuponCodigoManual, setCuponCodigoManual] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [touched, setTouched] = useState(false)

  const normalize = (s) => String(s || "").trim().toLowerCase()

  // Reset al abrir
  useEffect(() => {
    if (!open) return

    setTipo("ajuste")
    setClienteId("")
    setClienteObj(null)
    setClienteQuery("")
    setClientesBuscados([])
    setShowSuggest(false)
    setAjusteOperacion("sumar")
    setAjusteCantidad("")
    setCuponId("")
    setCuponCodigoManual("")
    setSubmitError("")
    setTouched(false)
  }, [open])

  // ✅ EFECTO MAGICO: Busca en la base de datos a medida que escribes
  useEffect(() => {
    const q = normalize(clienteQuery)
    if (!q) {
      setClientesBuscados([])
      return
    }

    // Si ya seleccionaste a un cliente, no volvemos a buscar
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
          // Filtramos solo los ACTIVOS y limitamos visualmente a 8
          const activos = (data.clientes || []).filter(c => normalize(c.estado) === "activo")
          setClientesBuscados(activos.slice(0, 8))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setBuscando(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [clienteQuery, clienteId])

  // Puntos Actuales (usando el objeto buscado o el fallback)
  const puntosActualesNum = useMemo(() => {
    const fromCliente = Number(clienteObj?.puntos_total)
    if (Number.isFinite(fromCliente)) return fromCliente

    const fallback = Number(puntosActuales || 0)
    return Number.isFinite(fallback) ? fallback : 0
  }, [clienteObj, puntosActuales])

  // 🔥 Filtro de Cupones
  const cuponesDisponibles = useMemo(() => {
    const now = new Date()
    return cupones.filter((c) => {
      const estado = String(c.estado || "").toLowerCase()
      if (estado !== "activo") return false
      if (c.vence_en) {
        const vence = new Date(c.vence_en)
        if (!Number.isNaN(vence.getTime()) && vence < now) return false
      }
      return true
    })
  }, [cupones])

  const cuponSeleccionado = useMemo(() => {
    return cuponesDisponibles.find((c) => c.id === cuponId) || null
  }, [cuponesDisponibles, cuponId])

  const ajusteCantidadNum = useMemo(() => {
    const n = Number(ajusteCantidad)
    if (!ajusteCantidad) return 0
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.trunc(n))
  }, [ajusteCantidad])

  const puntosDelta = useMemo(() => {
    if (tipo === "ajuste") {
      if (!ajusteCantidadNum) return 0
      return ajusteOperacion === "descontar" ? -ajusteCantidadNum : ajusteCantidadNum
    }

    if (tipo === "canje") {
      const costo = Number(cuponSeleccionado?.costo_puntos || 0)
      const costoSafe = Number.isFinite(costo) ? Math.max(0, Math.trunc(costo)) : 0
      return costoSafe ? -costoSafe : 0
    }

    return 0
  }, [tipo, ajusteOperacion, ajusteCantidadNum, cuponSeleccionado])

  const puntosResultado = useMemo(() => puntosActualesNum + puntosDelta, [puntosActualesNum, puntosDelta])
  const puedeQuedarNegativo = useMemo(() => puntosResultado < 0, [puntosResultado])

  const isValid = useMemo(() => {
    if (!clienteId) return false

    if (tipo === "ajuste") {
      if (!ajusteCantidadNum || ajusteCantidadNum <= 0) return false
      if (ajusteOperacion === "descontar" && puntosResultado < 0) return false
      return true
    }

    if (tipo === "canje") {
      if (!cuponId) return false
      if (puntosResultado < 0) return false
      return true
    }

    return false
  }, [clienteId, tipo, ajusteCantidadNum, ajusteOperacion, cuponId, puntosResultado])

  const errorVivo = useMemo(() => {
    if (!touched) return ""
    if (!clienteId) return "Debes seleccionar un cliente."

    if (tipo === "ajuste") {
      if (!ajusteCantidadNum) return "Ingresa una cantidad válida (entero mayor a 0)."
      if (ajusteOperacion === "descontar" && puedeQuedarNegativo) {
        return "No puedes descontar más puntos de los que el cliente tiene."
      }
    }

    if (tipo === "canje") {
      if (!cuponId) return "Debes seleccionar un cupón."
      if (puedeQuedarNegativo) return "El canje dejaría al cliente con puntos negativos."
    }

    return ""
  }, [touched, clienteId, tipo, ajusteCantidadNum, ajusteOperacion, cuponId, puedeQuedarNegativo])

  const handleClose = () => {
    if (onClose) onClose()
  }

  const selectCliente = (c) => {
    if (!c?.id) return
    setClienteId(c.id)
    setClienteObj(c)
    const nombre = `${c.nombres || ""} ${c.apellidos || ""}`.trim() || "Sin nombre"
    setClienteQuery(`${nombre} — ${c.rut || ""}`.trim())
    setShowSuggest(false)
    setTouched(true)
    setSubmitError("")
  }

  const handleSubmit = async () => {
    setTouched(true)
    setSubmitError("")
    if (!isValid) return

    const payload = {
      cliente_id: clienteId,
      tipo, 
      puntos: puntosDelta, 
      cupon_id: tipo === "canje" ? cuponId : null,
      cupon_codigo:
        tipo === "canje"
          ? String(cuponSeleccionado?.codigo || cuponCodigoManual || "").trim() || null
          : null,
    }

    try {
      if (onSubmit) {
        await onSubmit(payload)
      }
      handleClose()
    } catch (e) {
      setSubmitError(e?.message || "No se pudo guardar el movimiento.")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Nuevo movimiento</h2>
            <p className="text-sm text-muted-foreground">Registra un ajuste manual o un canje de cupón.</p>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Puntos actuales */}
          <div className="bg-muted/40 border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Puntos actuales</p>
                <div className="text-4xl font-bold leading-none">{puntosActualesNum}</div>

                {clienteObj && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Cliente:{" "}
                    <span className="font-medium text-foreground">
                      {`${clienteObj.nombres || ""} ${clienteObj.apellidos || ""}`.trim() || "Sin nombre"}
                    </span>{" "}
                    · {clienteObj.rut}
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <p className="text-sm text-muted-foreground">Con este movimiento quedará en</p>
                <div className={`text-4xl font-bold leading-none ${puntosResultado < 0 ? "text-red-500" : ""}`}>
                  {puntosResultado}
                </div>
              </div>
            </div>
          </div>

          {/* Tipo + Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <FilterIcon />
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                  setTouched(true)
                  setSubmitError("")
                  setAjusteOperacion("sumar")
                  setAjusteCantidad("")
                  setCuponId("")
                  setCuponCodigoManual("")
                }}
                className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Cliente
              </label>

              <input
                ref={inputRef}
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value)
                  setTouched(true)
                  setSubmitError("")
                  setShowSuggest(true)
                  if (clienteId) {
                    setClienteId("")
                    setClienteObj(null)
                  }
                }}
                onFocus={() => {
                  if (normalize(clienteQuery)) setShowSuggest(true)
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggest(false), 200)
                }}
                placeholder="Escribe RUT o nombre..."
                className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* ✅ Dropdown con resultados de la BD */}
              {showSuggest && !clienteId && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {buscando ? (
                    <div className="p-3 text-sm text-muted-foreground animate-pulse">Buscando...</div>
                  ) : clientesBuscados.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Sin coincidencias...</div>
                  ) : (
                    clientesBuscados.map((c) => {
                      const nombre = `${c.nombres || ""} ${c.apellidos || ""}`.trim() || "Sin nombre"
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCliente(c)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                        >
                          <div className="text-sm font-medium">{nombre}</div>
                          <div className="text-xs text-muted-foreground">{c.rut}</div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ajuste */}
          {tipo === "ajuste" && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Operación</label>
                  <select
                    value={ajusteOperacion}
                    onChange={(e) => {
                      setAjusteOperacion(e.target.value)
                      setTouched(true)
                    }}
                    className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="sumar">Sumar</option>
                    <option value="descontar">Descontar</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Cantidad</label>
                  <input
                    value={ajusteCantidad}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "")
                      setAjusteCantidad(v)
                      setTouched(true)
                    }}
                    placeholder="Ej: 50"
                    inputMode="numeric"
                    className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Canje */}
          {tipo === "canje" && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                  Cupón
                </label>

                <select
                  value={cuponId}
                  onChange={(e) => {
                    setCuponId(e.target.value)
                    setTouched(true)
                    setSubmitError("")
                  }}
                  className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona un cupón</option>
                  {cuponesDisponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.tipo_descuento} ({c.valor}) — costo {c.costo_puntos} pts
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-muted-foreground">
                  Solo se muestran cupones activos y vigentes.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Código (snapshot)</label>
                <input
                  value={cuponSeleccionado?.codigo || cuponCodigoManual}
                  onChange={(e) => {
                    setCuponCodigoManual(e.target.value)
                    setTouched(true)
                  }}
                  placeholder="Ej: ABC123"
                  className="mt-2 w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!!cuponSeleccionado?.codigo}
                />
              </div>

              {cuponSeleccionado && (
                <div className="text-sm text-muted-foreground">
                  Se descontarán{" "}
                  <span className="font-medium text-foreground">
                    {Number(cuponSeleccionado.costo_puntos || 0)}
                  </span>{" "}
                  puntos.
                </div>
              )}
            </div>
          )}

          {/* errores */}
          {(errorVivo || submitError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Revisa el formulario</div>
                <div className="mt-1">{submitError || errorVivo}</div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isValid
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Guardar movimiento
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}