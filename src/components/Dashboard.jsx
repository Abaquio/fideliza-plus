import { Users, Award, Gift, ShoppingCart } from "lucide-react"
import StatCard from "./StatCard"

export default function Dashboard() {
  const stats = [
    {
      title: "Clientes Registrados",
      value: "1,284",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "from-[#480048] to-[#601848]",
    },
    {
      title: "Puntos Otorgados",
      value: "45,892",
      change: "+8.2%",
      trend: "up",
      icon: Award,
      color: "from-[#601848] to-[#C04848]",
    },
    {
      title: "Canjes Realizados",
      value: "328",
      change: "-3.1%",
      trend: "down",
      icon: Gift,
      color: "from-[#C04848] to-[#F07241]",
    },
    {
      title: "Compras del Día",
      value: "89",
      change: "+15.8%",
      trend: "up",
      icon: ShoppingCart,
      color: "from-[#F07241] to-[#C04848]",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general de tu programa de fidelización</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Additional Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {[
              { name: "María González", action: "Canjeó 500 puntos", time: "Hace 5 min", color: "#F07241" },
              { name: "Carlos Ruiz", action: "Acumuló 150 puntos", time: "Hace 12 min", color: "#480048" },
              { name: "Ana Martínez", action: "Se registró al programa", time: "Hace 25 min", color: "#601848" },
              { name: "Luis Pérez", action: "Canjeó cupón 20% desc.", time: "Hace 1 hora", color: "#C04848" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: activity.color }}
                >
                  {activity.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.name}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Mejores Clientes</h3>
          <div className="space-y-4">
            {[
              { name: "Roberto Silva", points: 8450, purchases: 42, rank: 1 },
              { name: "Patricia López", points: 7230, purchases: 38, rank: 2 },
              { name: "Fernando Castro", points: 6890, purchases: 35, rank: 3 },
              { name: "Isabel Moreno", points: 5670, purchases: 29, rank: 4 },
            ].map((customer, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#480048] to-[#F07241] flex items-center justify-center text-white font-bold text-sm">
                  {customer.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.purchases} compras</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#F07241]">{customer.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">puntos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
