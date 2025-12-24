"use client"

export default function EliminarClienteModal({ open, cliente, onClose, onConfirm, isSaving = false }) {
  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold mb-2">Eliminar cliente</h2>
        <p className="text-muted-foreground mb-4">
          Esto <b>no borra</b> el cliente de la base de datos. Quedará con estado <b>eliminado</b> y podrás
          reactivarlo después (mantiene historial y no podras crear otro usuario con el mismo RUT).
        </p>

        <div className="bg-muted border border-border rounded-lg p-3 text-sm mb-4">
          <div className="font-medium">{cliente?.name || "Cliente"}</div>
          <div className="text-muted-foreground">RUT: {cliente?.rut || "-"}</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}
