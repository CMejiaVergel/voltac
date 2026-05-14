"use client";

import React from "react";

export default function AccountingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary">Dashboard Financiero</h2>
        <div className="flex gap-2">
          <select className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground">
            <option>Mes Actual</option>
            <option>Mes Anterior</option>
            <option>Trimestre</option>
            <option>Año Actual</option>
          </select>
          <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Exportar
          </button>
        </div>
      </div>
      
      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Rentabilidad Neta", value: "$0 COP", color: "text-green-500" },
          { title: "Ingresos (Mes)", value: "$0 COP", color: "text-primary" },
          { title: "Cuentas por Cobrar", value: "$0 COP", color: "text-amber-500" },
          { title: "Cuentas por Pagar", value: "$0 COP", color: "text-red-500" },
        ].map((kpi, i) => (
          <div key={i} className="bg-background border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
            <p className={`text-2xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-secondary/5 border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
        El dashboard interactivo con widgets configurables se implementará en la Fase 6.
      </div>
    </div>
  );
}
