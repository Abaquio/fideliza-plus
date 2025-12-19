import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User } from "lucide-react"

export default function PerfilFull() {
  const navigate = useNavigate()

  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  }, [])

  // Si tu app pasa user por props en otra parte, esto igual funciona con lo guardado
  const nombre = localUser?.nombre || localUser?.name || "Usuario"
  const email = localUser?.email || "-"
  const rol = localUser?.rol || "-"
  const sucursal = localUser?.sucursal_id || "-"

  return (
    <div className="p-6 animate-slide-in-left">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Volver"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-2xl font-bold">Perfil</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>

          <div>
            <p className="text-lg font-semibold">{nombre}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Rol</p>
            <p className="text-sm font-medium">{rol}</p>
          </div>

          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Sucursal</p>
            <p className="text-sm font-medium">{String(sucursal)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
