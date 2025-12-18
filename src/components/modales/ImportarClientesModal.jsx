"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Trash2, Link2, Plus } from "lucide-react"

// ✅ UI nueva
import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getAuthToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || ""
}

function formatWhen(ts) {
  if (!ts) return "-"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("es-CL")
}

function isValidGoogleUrl(value) {
  if (!value) return false
  return value.includes("drive.google.com") || value.includes("docs.google.com")
}

export default function ImportarClientesModal({
  open,
  onClose,
  onAfterChange,
  isImporting = false,
}) {
  const [nombre, setNombre] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [sources, setSources] = useState([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [working, setWorking] = useState(false)

  // ✅ Confirm UI
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState("Confirmar acción")
  const [confirmMessage, setConfirmMessage] = useState("¿Estás seguro de continuar?")
  const [confirmLabel, setConfirmLabel] = useState("Confirmar")
  const [pendingAction, setPendingAction] = useState(null)

  // ✅ Validado UI
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Acción realizada")
  const [validadoMessage, setValidadoMessage] = useState("Operación completada correctamente.")

  const token = useMemo(() => getAuthToken(), [])

  function showValidado(title, message) {
    setValidadoTitle(title || "Acción realizada")
    setValidadoMessage(message || "Operación completada correctamente.")
    setValidadoOpen(true)
  }

  function openConfirm({ title, message, label, action }) {
    setConfirmTitle(title || "Confirmar acción")
    setConfirmMessage(message || "¿Estás seguro de continuar?")
    setConfirmLabel(label || "Confirmar")
    setPendingAction(() => action)
    setConfirmOpen(true)
  }

  async function fetchFuentes() {
    setLoadingSources(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/clientes/fuentes`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las fuentes")
      setSources(Array.isArray(data?.fuentes) ? data.fuentes : [])
    } catch (e) {
      setError(e.message || "Error cargando fuentes")
      setSources([])
    } finally {
      setLoadingSources(false)
    }
  }

  useEffect(() => {
    if (open) {
      setNombre("")
      setUrl("")
      setError("")
      setConfirmOpen(false)
      setPendingAction(null)
      fetchFuentes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const canAdd = useMemo(() => nombre.trim().length > 0 && url.trim().length > 0, [nombre, url])

  async function doCrearFuente() {
    const n = nombre.trim()
    const u = url.trim()

    setWorking(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/clientes/fuentes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // ✅ IMPORTAR INMEDIATO al crear la fuente
        body: JSON.stringify({ nombre: n, url: u, importar_ahora: true }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "No se pudo crear la fuente")

      setNombre("")
      setUrl("")
      await fetchFuentes()
      onAfterChange?.()

      // ✅ validado
      if (data?.resumen) {
        showValidado(
          "Fuente ingresada",
          `Importación OK — Procesados: ${data.resumen.procesados}, Válidos: ${data.resumen.validos}, Inválidos: ${data.resumen.invalidos}`
        )
      } else {
        showValidado("Fuente ingresada", "La fuente se guardó correctamente.")
      }
    } catch (e) {
      setError(e.message || "Error creando fuente")
    } finally {
      setWorking(false)
    }
  }

  const handleCrearFuente = () => {
    const n = nombre.trim()
    const u = url.trim()

    if (!n) return setError("Debes ingresar un nombre para la fuente")
    if (!u) return setError("Debes ingresar un enlace")
    if (!isValidGoogleUrl(u)) return setError("El enlace debe ser de Google Drive/Sheets")

    openConfirm({
      title: "Confirmar ingreso de fuente",
      message: `Se guardará la fuente "${n}" y se importarán los clientes desde el link entregado. ¿Continuar?`,
      label: "Ingresar",
      action: doCrearFuente,
    })
  }

  const handleRecargar = async (source) => {
    setWorking(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/clientes/fuentes/${source.id}/recargar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "No se pudo recargar la fuente")

      await fetchFuentes()
      onAfterChange?.()

      if (data?.resumen) {
        showValidado(
          "Fuente recargada",
          `Importación OK — Procesados: ${data.resumen.procesados}, Válidos: ${data.resumen.validos}, Inválidos: ${data.resumen.invalidos}`
        )
      } else {
        showValidado("Fuente recargada", "La fuente se recargó correctamente.")
      }
    } catch (e) {
      setError(e.message || "Error recargando fuente")
    } finally {
      setWorking(false)
    }
  }

  async function doEliminarFuente(source) {
    setWorking(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/clientes/fuentes/${source.id}?cascade=true`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "No se pudo eliminar la fuente")

      await fetchFuentes()
      onAfterChange?.()

      showValidado("Fuente eliminada", `Se eliminó "${source.nombre}" correctamente.`)
    } catch (e) {
      setError(e.message || "Error eliminando fuente")
    } finally {
      setWorking(false)
    }
  }

  const handleEliminar = (source) => {
    openConfirm({
      title: "Eliminar fuente",
      message: `¿Eliminar la fuente "${source.nombre}"?\n\nEsto intentará borrar también los clientes asociados a esta fuente.`,
      label: "Eliminar",
      action: () => doEliminarFuente(source),
    })
  }

  if (!open) return null

  const disabled = isImporting || working

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      {/* ✅ Modal tamaño L */}
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl animate-scale-in">
        <h2 className="text-2xl font-bold mb-2">Importar Clientes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Agrega fuentes (Google Sheets/Drive), recárgalas cuando cambien y mantén tu base actualizada.
        </p>

        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Crear fuente */}
          <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de la fuente</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Universidad X / Local Centro"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Enlace de Google Drive / Sheets</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Debe estar como “Cualquiera con el enlace puede ver”.
              </p>
            </div>

            <button
              onClick={handleCrearFuente}
              disabled={disabled || !canAdd}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {working ? "Guardando..." : "Guardar e importar"}
            </button>
          </div>

          {/* Formato esperado */}
          <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Formato esperado del Excel/Sheet:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>rut</li>
              <li>nombres</li>
              <li>apellidos</li>
              <li>email</li>
              <li>telefono</li>
            </ul>
          </div>

          {/* Lista fuentes */}
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Fuentes guardadas</p>
              <p className="text-xs text-muted-foreground">
                {loadingSources ? "Cargando..." : `${sources.length} fuente(s)`}
              </p>
            </div>

            {loadingSources ? (
              <p className="text-sm text-muted-foreground">Cargando fuentes...</p>
            ) : sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no has agregado fuentes. Completa nombre + enlace y presiona “Guardar e importar”.
              </p>
            ) : (
              <div className="space-y-2">
                {sources.map((s) => (
                  <div
                    key={s.id}
                    className="bg-card border border-border rounded-lg p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">{s.nombre}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{s.url}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Última recarga: {formatWhen(s.ultima_recarga_en)}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {/* ✅ Recargar con color distinto */}
                      <button
                        onClick={() => handleRecargar(s)}
                        disabled={disabled}
                        className="px-3 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary"
                        title="Recargar fuente"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* ✅ Eliminar en rojo */}
                      <button
                        onClick={() => handleEliminar(s)}
                        disabled={disabled}
                        className="px-3 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive"
                        title="Eliminar fuente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              disabled={disabled}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Confirm + Validado */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel="Cancelar"
        onCancel={() => {
          setConfirmOpen(false)
          setPendingAction(null)
        }}
        onConfirm={async () => {
          setConfirmOpen(false)
          const fn = pendingAction
          setPendingAction(null)
          if (typeof fn === "function") await fn()
        }}
      />

      <ValidadoCard
        open={validadoOpen}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setValidadoOpen(false)}
      />
    </div>
  )
}
