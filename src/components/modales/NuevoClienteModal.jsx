"use client"

import { useEffect, useMemo, useState } from "react"

export default function NuevoClienteModal({ open, onClose, onSubmit, isSaving = false }) {
  const [form, setForm] = useState({
    rut: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
  })

  // Reset al abrir (para que se sienta limpio como tu modal actual)
  useEffect(() => {
    if (open) {
      setForm({ rut: "", nombres: "", apellidos: "", email: "", telefono: "" })
    }
  }, [open])

  const canSubmit = useMemo(() => {
    return form.rut.trim() && form.nombres.trim()
  }, [form])

  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!canSubmit || isSaving) return
    await onSubmit?.({
      rut: form.rut,
      nombres: form.nombres,
      apellidos: form.apellidos || null,
      email: form.email || null,
      telefono: form.telefono || null,
    })
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold mb-4">Nuevo Cliente</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">RUT</label>
            <input
              type="text"
              value={form.rut}
              onChange={handleChange("rut")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: 11222333-4"
            />
            <p className="mt-1 text-xs text-muted-foreground">Sin puntos. Con guión y dígito verificador.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombres</label>
            <input
              type="text"
              value={form.nombres}
              onChange={handleChange("nombres")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: María"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apellidos</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={handleChange("apellidos")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: González"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={handleChange("telefono")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSubmit || isSaving}
            >
              {isSaving ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
