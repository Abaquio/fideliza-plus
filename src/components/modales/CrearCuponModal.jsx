"use client"

import { useEffect, useMemo, useState } from "react"
import ConfirmDialog from "../../ui/confirm"

function getApiBase() {
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:4000"
  return "https://fideliza-plus.onrender.com"
}

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token") || ""
}

async function safeJsonFetch(url, options) {
  const res = await fetch(url, options)

  if (res.status === 401) {
    const err = new Error("UNAUTHORIZED")
    err.status = 401
    throw err
  }

  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    const text = await res.text()
    throw new Error(`Respuesta no-JSON (${res.status}) en ${url}. ${text.slice(0, 80)}`)
  }
  const data = await res.json()
  return { res, data }
}

export default function CrearCuponModal({ open, onClose, onSaved, editingCupon = null }) {
  const isEdit = !!editingCupon

  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [form, setForm] = useState({
    codigo: "",
    tipo_descuento: "porcentaje",
    valor: "",
    costo_puntos: "",
    estado: "activo",
    vence_en: "",
  })

  useEffect(() => {
    if (!open) return

    if (editingCupon) {
      setForm({
        codigo: editingCupon.codigo || "",
        tipo_descuento: editingCupon.tipo_descuento || "porcentaje",
        valor: editingCupon.valor ?? "",
        costo_puntos: editingCupon.costo_puntos ?? "",
        estado: editingCupon.estado || "activo",
        vence_en: editingCupon.vence_en ? String(editingCupon.vence_en).slice(0, 10) : "",
      })
    } else {
      setForm({
        codigo: "",
        tipo_descuento: "porcentaje",
        valor: "",
        costo_puntos: "",
        estado: "activo",
        vence_en: "",
      })
    }

    setConfirmOpen(false)
  }, [open, editingCupon])

  const canSubmit = useMemo(() => {
    if (!form.codigo.trim()) return false
    if (!form.tipo_descuento) return false
    if (form.valor === "" || Number(form.valor) <= 0) return false
    if (form.costo_puntos === "" || Number(form.costo_puntos) < 1) return false
    return true
  }, [form])

  if (!open) return null

  const doSubmit = async () => {
    try {
      setSaving(true)
      const API = getApiBase()
      const token = getToken()

      const payload = {
        codigo: form.codigo.trim(),
        tipo_descuento: form.tipo_descuento,
        valor: Number(form.valor),
        costo_puntos: Number(form.costo_puntos),
        estado: form.estado,
        vence_en: form.vence_en ? new Date(form.vence_en).toISOString() : null,
      }

      const url = isEdit ? `${API}/api/descuentos/${editingCupon.id}` : `${API}/api/descuentos`
      const method = isEdit ? "PUT" : "POST"

      const { data } = await safeJsonFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!data.ok) {
        alert(data.message || "No se pudo guardar el cupón")
        return
      }

      onSaved?.({ action: isEdit ? "edit" : "create" })
    } catch (e) {
      console.error(e)
      alert("No se pudo guardar (revisa consola)")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title={isEdit ? "Confirmar edición" : "Confirmar creación"}
        message={isEdit ? "¿Confirmas guardar los cambios del cupón?" : "¿Confirmas crear este cupón?"}
        confirmLabel={isEdit ? "Sí, guardar" : "Sí, crear"}
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          doSubmit()
        }}
      />

      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
          <h2 className="text-2xl font-bold mb-4">{isEdit ? "Editar Cupón" : "Crear Nuevo Cupón"}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código del Cupón</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="VERANO2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo Descuento</label>
                <select
                  value={form.tipo_descuento}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_descuento: e.target.value }))}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto_fijo">Monto Fijo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="number"
                  min="1"
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Costo en Puntos</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.costo_puntos}
                onChange={(e) => setForm((p) => ({ ...p, costo_puntos: e.target.value }))}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="activo">Activo</option>
                <option value="usado">Usado</option>
                <option value="expirado">Expirado</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha de Expiración</label>
              <input
                type="date"
                value={form.vence_en}
                onChange={(e) => setForm((p) => ({ ...p, vence_en: e.target.value }))}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSubmit || saving}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando..." : isEdit ? "Guardar" : "Crear Cupón"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
