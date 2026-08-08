import { BarChart3, Users, Clock, MousePointerClick } from "lucide-react";
import { getAnalyticsData } from "./actions";
import { AnalyticsTable } from "./AnalyticsTable";

export default async function AnalyticsPage() {
  const { stats, events } = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-secondary tracking-tight">Analytics</h1>
      <p className="text-secondary/60">Monitoreo de comportamiento y tráfico recolectado mediante los eventos web.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Visitantes Únicos", value: stats?.uniqueVisitors || 0, icon: <Users size={24} className="text-primary" /> },
          { label: "T. Promedio", value: (stats?.avgTimeSeconds || 0) + 's', icon: <Clock size={24} className="text-primary" /> },
          { label: "Log Clics Cotizar", value: stats?.clicks || 0, icon: <MousePointerClick size={24} className="text-primary" /> },
          { label: "Total Logs Registrados", value: stats?.totalEvents || 0, icon: <BarChart3 size={24} className="text-primary" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col items-start gap-4">
            <div className="p-3 bg-muted rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-secondary/50">{stat.label}</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-secondary">{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnalyticsTable events={events || []} />
    </div>
  );
}
