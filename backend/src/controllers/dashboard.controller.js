import { supabaseAdmin } from "../db/supabaseAdmin.js";

function getStartOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function getStartOf7DaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6); // 6 días atrás + hoy = 7
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export const getDashboardData = async (req, res) => {
  try {
    const startMonth = getStartOfMonth();
    const start7Days = getStartOf7DaysAgo();

    // 1. Ejecutamos todas las consultas en paralelo para velocidad
    const [
      { count: clientesActivos }, // Total clientes
      { data: comprasMes }, // Compras del mes actual
      { data: movimientosMes }, // Puntos/Canjes del mes actual
      { data: ultimasCompras }, // Las 5 más recientes
      { data: comprasSemana }, // Para la gráfica
      { data: allMovimientos }, // Para calcular Top Clientes (Balance histórico)
    ] = await Promise.all([
      // A: Clientes Activos
      supabaseAdmin
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .neq("estado", "eliminado"),

      // B: Compras Mes (para KPI)
      supabaseAdmin
        .from("compras")
        .select("id, monto, estado")
        .gte("fecha_compra", startMonth)
        .eq("estado", "vigente"),

      // C: Movimientos Mes (para Puntos y Canjes)
      supabaseAdmin
        .from("puntos_movimientos")
        .select("id, tipo, puntos")
        .gte("creado_en", startMonth),

      // D: Últimas 5 compras (Listado)
      supabaseAdmin
        .from("compras")
        .select(`
          id, monto, fecha_compra, estado, puntos_ganados:puntos_movimientos(puntos),
          clientes (nombres, apellidos)
        `)
        .order("fecha_compra", { ascending: false })
        .limit(5),

      // E: Compras últimos 7 días (Gráfica)
      supabaseAdmin
        .from("compras")
        .select("fecha_compra, monto")
        .gte("fecha_compra", start7Days)
        .eq("estado", "vigente"),

      // F: Movimientos (Para Top Clientes - Simplificado para Beta)
      // Nota: En producción esto debería ser una View o RPC, aquí lo hacemos en memoria
      supabaseAdmin
        .from("puntos_movimientos")
        .select("cliente_id, puntos, clientes(nombres, apellidos, compras:compras(count))")
    ]);

    // --- PROCESAMIENTO DE DATOS ---

    // 2. KPIs
    const totalComprasMes = comprasMes?.length || 0;
    
    const puntosOtorgadosMes = movimientosMes
      ?.filter((m) => m.tipo === "ganado" || m.tipo === "ajuste" || m.tipo === "bienvenida")
      .reduce((acc, m) => acc + (m.puntos > 0 ? m.puntos : 0), 0) || 0;

    const canjesMes = movimientosMes
      ?.filter((m) => m.tipo === "canje")
      .length || 0;

    // 3. Gráfica (Agrupar por día)
    const diasMap = {};
    // Inicializar últimos 7 días en 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" }); // Ej: "lun 12"
      diasMap[key] = 0;
    }
    // Llenar con datos reales
    comprasSemana?.forEach((c) => {
      const d = new Date(c.fecha_compra);
      const key = d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" });
      if (diasMap[key] !== undefined) {
        diasMap[key] += Number(c.monto || 0);
      }
    });
    const graphData = Object.keys(diasMap).map((k) => ({ name: k, value: diasMap[k] }));

    // 4. Top Clientes (Calculando balance en memoria - BETA)
    const clientesMap = {};
    allMovimientos?.forEach((m) => {
      if (!clientesMap[m.cliente_id]) {
        clientesMap[m.cliente_id] = {
          id: m.cliente_id,
          nombre: m.clientes ? `${m.clientes.nombres} ${m.clientes.apellidos}`.trim() : "Desconocido",
          puntos: 0,
          compras: m.clientes?.compras?.[0]?.count || 0 // Esto es un aprox
        };
      }
      clientesMap[m.cliente_id].puntos += Number(m.puntos || 0);
    });

    const topClients = Object.values(clientesMap)
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 5);

    // 5. Formatear Últimas Compras
    const recentPurchases = (ultimasCompras || []).map((c) => {
      // Calcular "hace cuánto"
      const diff = Date.now() - new Date(c.fecha_compra).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      
      let timeAgo = `${mins} min`;
      if (mins > 60) timeAgo = `${hours} h`;
      if (hours > 24) timeAgo = `${days} d`;

      // Puntos ganados suele venir como array por el join
      const pts = c.puntos_ganados?.[0]?.puntos || 0;

      return {
        id: c.id,
        customer: c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}` : "—",
        amount: Number(c.monto),
        points: pts,
        timeAgo: `Hace ${timeAgo}`,
        status: c.estado
      };
    });

    res.json({
      ok: true,
      data: {
        stats: {
          activeClients: clientesActivos || 0,
          monthlyPurchases: totalComprasMes,
          monthlyPoints: puntosOtorgadosMes,
          monthlyRedemptions: canjesMes
        },
        graph: graphData,
        topClients,
        recentPurchases
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
};