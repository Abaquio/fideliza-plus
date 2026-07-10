"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, ShoppingBag, Gift, ArrowUpRight, Loader2, DollarSign } from "lucide-react"

// Ajusta URL si es necesario
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
  return sessionStorage.getItem("token") || localStorage.getItem("token") || ""
}

function formatCLP(n) {
  return Number(n).toLocaleString("es-CL", { style: "currency", currency: "CLP" })
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    stats: {
      activeClients: 0,
      monthlyPurchases: 0,
      monthlyPoints: 0,
      monthlyRedemptions: 0
    },
    graph: [],
    topClients: [],
    recentPurchases: []
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken()
        if (!token) return

        const res = await fetch(`${getApiBase()}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()

        if (json.ok) {
          setData(json.data)
        }
      } catch (error) {
        console.error("Error cargando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Definición de tarjetas de estadísticas
  const statsCards = [
    {
      label: "Clientes Activos",
      value: data.stats.activeClients,
      subLabel: "Total registrados",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Compras del Mes",
      value: data.stats.monthlyPurchases,
      subLabel: "Operaciones vigentes",
      icon: ShoppingBag,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Puntos Otorgados",
      value: data.stats.monthlyPoints.toLocaleString(),
      subLabel: "Este mes",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Cupones Canjeados",
      value: data.stats.monthlyRedemptions,
      subLabel: "Este mes",
      icon: Gift,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando tablero...</span>
      </div>
    )
  }

  // Calcular maximo valor para la gráfica (para normalizar barras)
  const maxGraphVal = Math.max(...data.graph.map(d => d.value), 1000)

  return (
    <div className="space-y-6 animate-fade-in p-1">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de actividad y métricas clave.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  <div className="flex items-center gap-1 mt-1">
                     <span className="text-xs text-muted-foreground">{stat.subLabel}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Gráfica Simple (HTML/CSS) */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Ventas últimos 7 días</h2>
              <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Monto acumulado
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {data.graph.map((day, idx) => {
                 // Altura proporcional (min 5% para que se vea algo)
                 const heightPct = Math.max(5, (day.value / maxGraphVal) * 100);
                 return (
                   <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full bg-muted/30 rounded-t-lg flex items-end h-full overflow-hidden">
                         <div 
                           className="w-full bg-primary/80 hover:bg-primary transition-all duration-500 rounded-t-md mx-auto max-w-[40px]"
                           style={{ height: `${heightPct}%` }}
                         ></div>
                         {/* Tooltip simple */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                           {formatCLP(day.value)}
                         </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 truncate max-w-full">{day.name}</p>
                   </div>
                 )
              })}
              {data.graph.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                   No hay datos recientes
                </div>
              )}
            </div>
          </div>

          {/* Últimas Compras */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Últimas Transacciones</h2>
            <div className="space-y-4">
              {data.recentPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay compras registradas.</p>
              ) : (
                data.recentPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-transparent hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center font-bold">
                        {purchase.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{purchase.customer}</p>
                        <p className="text-xs text-muted-foreground">{purchase.timeAgo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCLP(purchase.amount)}</p>
                      <p className="text-xs text-primary font-medium">+{purchase.points} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha (1/3) - Top Clientes */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Mejores Clientes</h2>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {data.topClients.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No hay suficientes datos.</p>
              ) : (
                data.topClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`
                       w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                       ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-orange-400" : "bg-primary/50"}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.nombre}</p>
                      <p className="text-xs text-muted-foreground">Bal: {client.puntos.toLocaleString()} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Banner pequeño de promoción o info */}
            <div className="mt-8 bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-xl border border-primary/10">
              <h3 className="font-semibold text-primary mb-1">Tip Pro</h3>
              <p className="text-xs text-muted-foreground">
                Incentiva a tus clientes Top con cupones exclusivos para aumentar su fidelidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}