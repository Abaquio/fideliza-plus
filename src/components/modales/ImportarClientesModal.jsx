"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Trash2, Link2 } from "lucide-react"

const STORAGE_KEY = "fideliza_import_sources_v1"

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

function extractDriveFileId(url) {
  if (!url) return null
  // file/d/<ID>
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (m1?.[1]) return m1[1]
  // open?id=<ID>
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2?.[1]) return m2[1]
  // spreadsheets/d/<ID>
  const m3 = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (m3?.[1]) return m3[1]
  return null
}

function formatWhen(ts) {
  if (!ts) return "-"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("es-CL")
}

export default function ImportarClientesModal({
  open,
  onClose,
  onImport,
  onReloadSource,
  onRemoveSource,
  isImporting = false,
}) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [sources, setSources] = useState([])

  useEffect(() => {
    if (open) {
      setUrl("")
      setError("")
      const saved = safeParse(localStorage.getItem(STORAGE_KEY) || "[]", [])
      setSources(Array.isArray(saved) ? saved : [])
    }
  }, [open])

  // Persistencia
  useEffect(() => {
    if (!open) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources))
  }, [sources, open])

  const isValidDriveUrl = (value) => {
    if (!value) return false
    return value.includes("drive.google.com") || value.includes("docs.google.com")
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const canAdd = useMemo(() => url.trim().length > 0, [url])

  const addOrUpdateSource = (driveUrl) => {
    const fileId = extractDriveFileId(driveUrl) || `custom-${Math.random().toString(36).slice(2)}`
    const now = new Date().toISOString()

    setSources((prev) => {
      const exists = prev.find((s) => s.fileId === fileId || s.url === driveUrl)
      if (exists) {
        return prev.map((s) =>
          s === exists ? { ...s, url: driveUrl, lastUsedAt: now } : s
        )
      }
      return [
        { id: crypto?.randomUUID?.() ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, fileId, url: driveUrl, createdAt: now, lastUsedAt: now },
        ...prev,
      ]
    })
  }

  const handleImport = async () => {
    const value = url.trim()
    if (!value) {
      setError("Debes ingresar un enlace")
      return
    }
    if (!isValidDriveUrl(value)) {
      setError("El enlace debe ser de Google Drive")
      return
    }

    setError("")
    addOrUpdateSource(value)
    await onImport?.(value)
  }

  const handleReload = async (source) => {
    setError("")
    // actualiza lastUsedAt
    setSources((prev) =>
      prev.map((s) =>
        s.id === source.id ? { ...s, lastUsedAt: new Date().toISOString() } : s
      )
    )
    if (onReloadSource) return await onReloadSource(source)
    // fallback: recargar = importar
    return await onImport?.(source.url)
  }

  const handleRemove = (source) => {
    setSources((prev) => prev.filter((s) => s.id !== source.id))
    onRemoveSource?.(source)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg animate-scale-in">
        <h2 className="text-2xl font-bold mb-2">Importar Clientes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pega el enlace de un archivo Excel alojado en Google Drive.
        </p>

        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Input link */}
          <div>
            <label className="block text-sm font-medium mb-2">Enlace de Google Drive</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              El archivo debe estar configurado como “Cualquiera con el enlace puede ver”.
            </p>
          </div>

          {/* Formato esperado */}
          <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Formato esperado del Excel:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>rut</li>
              <li>nombres</li>
              <li>apellidos</li>
              <li>email</li>
              <li>telefono</li>
            </ul>
          </div>

          {/* Lista de fuentes */}
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Fuentes guardadas</p>
              <p className="text-xs text-muted-foreground">{sources.length} fuente(s)</p>
            </div>

            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no has agregado fuentes. Pega un enlace y presiona “Importar”.
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
                        <p className="text-sm font-medium truncate">
                          {s.fileId ? `Drive ID: ${s.fileId}` : "Fuente"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{s.url}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Última recarga: {formatWhen(s.lastUsedAt)}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleReload(s)}
                        disabled={isImporting}
                        className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Recargar fuente"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(s)}
                        disabled={isImporting}
                        className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Quitar fuente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              disabled={isImporting}
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isImporting || !canAdd}
            >
              {isImporting ? "Importando..." : "Importar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
