"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Trash2, Link2, Plus, Eye, Pencil, Save, X } from "lucide-react"

import ConfirmDialog from "../../ui/confirm"
import ValidadoCard from "../../ui/validado"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

// ✅ FIX: token desde sessionStorage (y fallback a localStorage)
function getAuthToken() {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  )
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

// ✅ reconocer fuente interna (por flag o por nombre)
function isInternalSource(source) {
  const name = String(source?.nombre || "").trim().toLowerCase()
  return !!source?.es_interna || name === "medical season"
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

  // ✅ NUEVO: expandir / editar fuente
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editNombre, setEditNombre] = useState("")
  const [editUrl, setEditUrl] = useState("")

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState("Confirmar acción")
  const [confirmMessage, setConfirmMessage] = useState("¿Estás seguro de continuar?")
  const [confirmLabel, setConfirmLabel] = useState("Confirmar")
  const [cancelLabel, setCancelLabel] = useState("Cancelar")
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingCancelAction, setPendingCancelAction] = useState(null)

  // Validado
  const [validadoOpen, setValidadoOpen] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("Acción realizada")
  const [validadoMessage, setValidadoMessage] = useState("Operación completada correctamente.")

  // ✅ IMPORTANTE: no dejes el token pegado si cambia
  const token = useMemo(() => getAuthToken(), [open])

  function showValidado(title, message) {
    setValidadoTitle(title || "Acción realizada")
    setValidadoMessage(message || "Operación completada correctamente.")
    setValidadoOpen(true)
  }

  function openConfirm({ title, message, label, cancelText, action, onCancelAction }) {
    setConfirmTitle(title || "Confirmar acción")
    setConfirmMessage(message || "¿Estás seguro de continuar?")
    setConfirmLabel(label || "Confirmar")
    setCancelLabel(cancelText || "Cancelar")
    setPendingAction(() => action)
    setPendingCancelAction(() => onCancelAction)
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
      setPendingCancelAction(null)

      // ✅ reset expand/editar al abrir
      setExpandedId(null)
      setEditingId(null)
      setEditNombre("")
      setEditUrl("")

      fetchFuentes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  // ✅ detectar nombre duplicado (case-insensitive) para crear
  const nombreDuplicado = useMemo(() => {
    const n = nombre.trim().toLowerCase()
    if (!n) return false
    return (sources || []).some((s) => String(s?.nombre || "").trim().toLowerCase() === n)
  }, [nombre, sources])

  const canAdd = useMemo(() => {
    return nombre.trim().length > 0 && url.trim().length > 0 && !nombreDuplicado
  }, [nombre, url, nombreDuplicado])

  async function recargarConEstrategia(fuenteId, estrategia) {
    const res = await fetch(`${API_URL}/api/clientes/fuentes/${fuenteId}/recargar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ estrategia_duplicados: estrategia }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || "No se pudo importar con estrategia")
    return data
  }

  function preguntarDuplicados({ fuenteId, nombreFuente, duplicadosCantidad }) {
    openConfirm({
      title: "RUT repetidos detectados",
      message:
        `Se encontraron ${duplicadosCantidad} cliente(s) con RUT que ya existe(n) fuera de esta fuente.\n\n` +
        `¿Quieres REEMPLAZAR esos registros con los datos de la fuente "${nombreFuente}"?\n\n` +
        `- Reemplazar: sobrescribe los existentes\n` +
        `- No reemplazar: mantiene los existentes y solo sincroniza los que son de esta fuente + nuevos`,
      label: "Reemplazar",
      cancelText: "No reemplazar",
      action: async () => {
        setWorking(true)
        setError("")
        try {
          const data = await recargarConEstrategia(fuenteId, "reemplazar")
          await fetchFuentes()
          onAfterChange?.()
          showValidado(
            "Importación finalizada",
            `Importación OK — Procesados: ${data.procesados}, Válidos: ${data.validos}, Inválidos: ${data.invalidos}`
          )
        } catch (e) {
          setError(e.message || "Error importando")
        } finally {
          setWorking(false)
        }
      },
      onCancelAction: async () => {
        setWorking(true)
        setError("")
        try {
          const data = await recargarConEstrategia(fuenteId, "omitir")
          await fetchFuentes()
          onAfterChange?.()
          showValidado(
            "Importación finalizada",
            `Importación OK — Procesados: ${data.procesados}, Válidos: ${data.validos}, Inválidos: ${data.invalidos}`
          )
        } catch (e) {
          setError(e.message || "Error importando")
        } finally {
          setWorking(false)
        }
      },
    })
  }

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
        body: JSON.stringify({ nombre: n, url: u, importar_ahora: true }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = String(data?.message || "No se pudo crear la fuente")
        const looksDuplicate =
          msg.toLowerCase().includes("duplicate") ||
          msg.toLowerCase().includes("duplic") ||
          msg.toLowerCase().includes("unique") ||
          msg.toLowerCase().includes("23505")

        if (looksDuplicate) throw new Error("Ya existe una fuente con ese nombre. Usa otro nombre.")
        throw new Error(msg)
      }

      setNombre("")
      setUrl("")
      await fetchFuentes()
      onAfterChange?.()

      if (data?.requiere_confirmacion && data?.fuente?.id) {
        preguntarDuplicados({
          fuenteId: data.fuente.id,
          nombreFuente: data.fuente.nombre || "Fuente",
          duplicadosCantidad: data?.duplicados?.cantidad || 0,
        })
        return
      }

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
    if (nombreDuplicado) return setError("Ya existe una fuente con ese nombre. Usa otro nombre.")
    if (!u) return setError("Debes ingresar un enlace")
    if (!isValidGoogleUrl(u)) return setError("El enlace debe ser de Google Drive/Sheets")

    openConfirm({
      title: "Confirmar ingreso de fuente",
      message: `Se guardará la fuente "${n}" y se importarán los clientes desde el link entregado. ¿Continuar?`,
      label: "Ingresar",
      cancelText: "Cancelar",
      action: doCrearFuente,
      onCancelAction: null,
    })
  }

  const handleRecargar = async (source) => {
    if (isInternalSource(source)) {
      return showValidado("Acción no disponible", "Esta fuente es interna del sistema y no se puede recargar.")
    }

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

      if (data?.requiere_confirmacion) {
        preguntarDuplicados({
          fuenteId: source.id,
          nombreFuente: source.nombre || "Fuente",
          duplicadosCantidad: data?.duplicados?.cantidad || 0,
        })
        return
      }

      await fetchFuentes()
      onAfterChange?.()

      showValidado(
        "Fuente recargada",
        `Importación OK — Procesados: ${data.procesados}, Válidos: ${data.validos}, Inválidos: ${data.invalidos}`
      )
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
    if (isInternalSource(source)) {
      return showValidado("Acción no disponible", "Esta fuente es interna del sistema y no se puede eliminar.")
    }

    openConfirm({
      title: "Eliminar fuente",
      message: `¿Eliminar la fuente "${source.nombre}"?\n\nEsto intentará borrar también los clientes asociados a esta fuente.`,
      label: "Eliminar",
      cancelText: "Cancelar",
      action: () => doEliminarFuente(source),
      onCancelAction: null,
    })
  }

  // ✅ NUEVO: expandir panel
  const toggleExpand = (source) => {
    const next = expandedId === source.id ? null : source.id
    setExpandedId(next)

    // si colapsa, salir de edición
    if (next === null) {
      setEditingId(null)
      setEditNombre("")
      setEditUrl("")
    }
  }

  // ✅ NUEVO: iniciar edición (desde panel)
  const startEdit = (source) => {
    if (isInternalSource(source)) {
      return showValidado("Acción no disponible", "Esta fuente es interna del sistema y no se puede editar.")
    }
    setEditingId(source.id)
    setEditNombre(String(source?.nombre || ""))
    setEditUrl(String(source?.url || ""))
    setError("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNombre("")
    setEditUrl("")
    setError("")
  }

  // ✅ NUEVO: duplicado al editar (ignorando el mismo id)
  const editNombreDuplicado = useMemo(() => {
    if (!editingId) return false
    const n = editNombre.trim().toLowerCase()
    if (!n) return false
    return (sources || []).some((s) => {
      if (s.id === editingId) return false
      return String(s?.nombre || "").trim().toLowerCase() === n
    })
  }, [editNombre, editingId, sources])

  // ✅ NUEVO: guardar edición (requiere endpoint PUT)
  async function doGuardarEdicion(source) {
    const n = editNombre.trim()
    const u = editUrl.trim()

    if (!n) return setError("El nombre no puede estar vacío.")
    if (editNombreDuplicado) return setError("Ya existe una fuente con ese nombre. Usa otro nombre.")
    if (!u) return setError("El enlace no puede estar vacío.")
    if (!isValidGoogleUrl(u)) return setError("El enlace debe ser de Google Drive/Sheets")

    setWorking(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/clientes/fuentes/${source.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nombre: n, url: u }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = String(data?.message || "No se pudo actualizar la fuente")
        const looksDuplicate =
          msg.toLowerCase().includes("duplicate") ||
          msg.toLowerCase().includes("duplic") ||
          msg.toLowerCase().includes("unique") ||
          msg.toLowerCase().includes("23505")
        if (looksDuplicate) throw new Error("Ya existe una fuente con ese nombre. Usa otro nombre.")
        throw new Error(msg)
      }

      await fetchFuentes()
      onAfterChange?.()
      setEditingId(null)
      setEditNombre("")
      setEditUrl("")
      showValidado("Fuente actualizada", "Los cambios se guardaron correctamente.")
    } catch (e) {
      setError(e.message || "Error actualizando fuente")
    } finally {
      setWorking(false)
    }
  }

  const pedirGuardarEdicion = (source) => {
    openConfirm({
      title: "Guardar cambios",
      message: `¿Guardar cambios en la fuente "${source.nombre}"?`,
      label: "Guardar",
      cancelText: "Cancelar",
      action: () => doGuardarEdicion(source),
      onCancelAction: null,
    })
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "")
      showValidado("Copiado", "Se copió el enlace al portapapeles.")
    } catch {
      // sin romper nada si el navegador bloquea clipboard
    }
  }

  if (!open) return null
  const disabled = isImporting || working

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="
          bg-card border border-border rounded-xl p-6 w-full max-w-3xl animate-scale-in
          max-h-[90vh] overflow-y-auto overscroll-contain
        "
      >
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
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (error) setError("")
                }}
                placeholder="Ej: Universidad X / Local Centro"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {nombre.trim() && nombreDuplicado && (
                <p className="mt-1 text-xs text-destructive">
                  Ya existe una fuente con ese nombre (no se permiten nombres repetidos).
                </p>
              )}
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

          {/* Fuentes guardadas */}
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
                {sources.map((s) => {
                  const internal = isInternalSource(s)
                  const expanded = expandedId === s.id
                  const editing = editingId === s.id

                  return (
                    <div
                      key={s.id}
                      className="bg-card border border-border rounded-lg p-3"
                    >
                      {/* fila principal */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium truncate">{s.nombre}</p>

                            {internal && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
                                Interna
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground truncate mt-1">{s.url}</p>

                          <p className="text-[11px] text-muted-foreground mt-1">
                            Última recarga: {formatWhen(s.ultima_recarga_en)}
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {/* ✅ NUEVO: ojo */}
                          <button
                            onClick={() => toggleExpand(s)}
                            disabled={disabled}
                            className="px-3 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-muted hover:bg-muted/80 border-border"
                            title={expanded ? "Cerrar detalles" : "Ver detalles"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleRecargar(s)}
                            disabled={disabled || internal}
                            className="px-3 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary"
                            title={internal ? "Fuente interna (no recargable)" : "Recargar fuente"}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEliminar(s)}
                            disabled={disabled || internal}
                            className="px-3 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-destructive/10 hover:bg-destructive/20 border-destructive/30 text-destructive"
                            title={internal ? "Fuente interna (no eliminable)" : "Eliminar fuente"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* ✅ NUEVO: panel expandible */}
                      {expanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          {!editing ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-muted/40 border border-border rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                                  <p className="text-sm font-medium break-words">{s.nombre}</p>
                                </div>

                                <div className="bg-muted/40 border border-border rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">Enlace</p>
                                  <p className="text-sm font-medium break-all">{s.url}</p>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(s.url)}
                                    className="mt-2 text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 border border-border transition-colors"
                                  >
                                    Copiar link
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] text-muted-foreground">
                                  Última recarga: {formatWhen(s.ultima_recarga_en)}
                                </p>

                                <button
                                  onClick={() => startEdit(s)}
                                  disabled={disabled || internal}
                                  className="px-4 py-2 rounded-lg transition-colors border disabled:opacity-60 disabled:cursor-not-allowed bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary flex items-center gap-2"
                                  title={internal ? "Fuente interna (no editable)" : "Editar fuente"}
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-muted-foreground mb-2">Nombre</label>
                                  <input
                                    value={editNombre}
                                    onChange={(e) => {
                                      setEditNombre(e.target.value)
                                      if (error) setError("")
                                    }}
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                  {editNombre.trim() && editNombreDuplicado && (
                                    <p className="mt-1 text-xs text-destructive">
                                      Ya existe otra fuente con ese nombre.
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs text-muted-foreground mb-2">Enlace</label>
                                  <input
                                    value={editUrl}
                                    onChange={(e) => {
                                      setEditUrl(e.target.value)
                                      if (error) setError("")
                                    }}
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Debe ser de Google Drive/Sheets.
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={cancelEdit}
                                  disabled={disabled}
                                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors flex items-center gap-2 disabled:opacity-60"
                                >
                                  <X className="w-4 h-4" />
                                  Cancelar
                                </button>

                                <button
                                  onClick={() => pedirGuardarEdicion(s)}
                                  disabled={
                                    disabled ||
                                    !editNombre.trim() ||
                                    !editUrl.trim() ||
                                    editNombreDuplicado
                                  }
                                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  <Save className="w-4 h-4" />
                                  Guardar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

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

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onCancel={async () => {
          setConfirmOpen(false)
          const fn = pendingCancelAction
          setPendingAction(null)
          setPendingCancelAction(null)
          if (typeof fn === "function") await fn()
        }}
        onConfirm={async () => {
          setConfirmOpen(false)
          const fn = pendingAction
          setPendingAction(null)
          setPendingCancelAction(null)
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
