import { TrendingUp, Users, ShoppingBag, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      label: "Clientes Activos",
      value: "1,234",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Compras del Mes",
      value: "856",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingBag,
      color: "text-accent",
    },
    {
      label: "Puntos Otorgados",
      value: "45.2K",
      change: "+23.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      label: "Cupones Canjeados",
      value: "234",
      change: "-3.2%",
      trend: "down",
      icon: Gift,
      color: "text-chart-4",
    },
  ]

  const recentPurchases = [
    { id: 1, customer: "María González", amount: "$125.00", points: 125, date: "Hace 5 min" },
    { id: 2, customer: "Carlos Ruiz", amount: "$89.50", points: 90, date: "Hace 12 min" },
    { id: 3, customer: "Ana Martínez", amount: "$210.00", points: 210, date: "Hace 25 min" },
    { id: 4, customer: "Luis Hernández", amount: "$67.00", points: 67, date: "Hace 1 hora" },
  ]

  const topClients = [
    { name: "María González", points: 8540, purchases: 42 },
    { name: "Pedro Sánchez", points: 7230, purchases: 38 },
    { name: "Laura Torres", points: 6890, purchases: 35 },
    { name: "Carlos Ruiz", points: 5420, purchases: 28 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al panel de control de Fideliza+</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-6 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} bg-primary/10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-primary" : "text-destructive"}`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="font-medium">{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compras Recientes */}
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in animate-delay-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Compras Recientes
          </h2>
          <div className="space-y-3">
            {recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{purchase.customer}</p>
                  <p className="text-sm text-muted-foreground">{purchase.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{purchase.amount}</p>
                  <p className="text-sm text-primary">+{purchase.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-card border border-border rounded-xl p-6 animate-fade-in animate-delay-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Top Clientes
          </h2>
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div
                key={client.name}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.purchases} compras</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{client.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">puntos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfica Placeholder */}
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in animate-delay-300">
        <h2 className="text-xl font-bold mb-4">Actividad de los últimos 7 días</h2>
        <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Gráfica de actividad</p>
          </div>
        </div>
      </div>
    </div>
  )
}
