import { BarChart3, Users, Clock, MousePointerClick, ExternalLink, TrendingUp, Globe, Activity, Eye } from "lucide-react";
import { getAnalyticsData } from "./actions";
import { AnalyticsTable } from "./AnalyticsTable";

export default async function AnalyticsPage() {
  const { stats, events } = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Analytics</h1>
          <p className="text-secondary/60 mt-1">Monitoreo de comportamiento, tráfico web y métricas de Google Analytics.</p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm w-fit"
        >
          <ExternalLink size={16} />
          Abrir Google Analytics
        </a>
      </div>

      {/* Internal Stats */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary/40 mb-3">Datos Internos del Sitio</h2>
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
      </div>

      {/* Google Analytics Section */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary/40 mb-3">Google Analytics (GTM-N9XQCHD4)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Usuarios Activos",
              description: "Usuarios en tiempo real",
              icon: <Activity size={20} className="text-emerald-600" />,
              bg: "bg-emerald-50",
              border: "border-emerald-100",
              href: "https://analytics.google.com/analytics/web/#/realtime/rt-overview",
            },
            {
              label: "Sesiones Totales",
              description: "Tráfico del período",
              icon: <TrendingUp size={20} className="text-blue-600" />,
              bg: "bg-blue-50",
              border: "border-blue-100",
              href: "https://analytics.google.com/analytics/web/#/report/visitors-overview",
            },
            {
              label: "Páginas Vistas",
              description: "Contenido más visitado",
              icon: <Eye size={20} className="text-violet-600" />,
              bg: "bg-violet-50",
              border: "border-violet-100",
              href: "https://analytics.google.com/analytics/web/#/report/content-pages",
            },
            {
              label: "Procedencia",
              description: "Fuentes de tráfico",
              icon: <Globe size={20} className="text-amber-600" />,
              bg: "bg-amber-50",
              border: "border-amber-100",
              href: "https://analytics.google.com/analytics/web/#/report/trafficsources-overview",
            },
          ].map((card, i) => (
            <a
              key={i}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-4 p-4 rounded-2xl border ${card.border} ${card.bg} hover:shadow-md transition-all duration-200`}
            >
              <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-secondary text-sm truncate">{card.label}</p>
                <p className="text-xs text-secondary/50 truncate">{card.description}</p>
              </div>
              <ExternalLink size={14} className="text-secondary/30 group-hover:text-secondary/60 ml-auto flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>

        {/* GTM Status Banner */}
        <div className="bg-gradient-to-r from-[#F9820B]/10 to-[#F9820B]/5 border border-[#F9820B]/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-semibold text-secondary text-sm">Google Tag Manager activo</p>
              <p className="text-xs text-secondary/55 mt-0.5">
                Contenedor <span className="font-mono font-semibold text-secondary/70">GTM-N9XQCHD4</span> instalado en todas las páginas del sitio.
                Los eventos y conversiones se registran automáticamente en GA4.
              </p>
            </div>
          </div>
          <a
            href="https://tagmanager.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-border text-secondary/70 px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex-shrink-0"
          >
            <ExternalLink size={14} />
            Gestionar GTM
          </a>
        </div>
      </div>

      {/* Internal Events Log */}
      <AnalyticsTable events={events || []} />
    </div>
  );
}
