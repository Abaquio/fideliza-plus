import { TrendingUp, TrendingDown } from "lucide-react"

export default function StatCard({ title, value, change, trend, icon: Icon, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
        >
          {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  )
}
