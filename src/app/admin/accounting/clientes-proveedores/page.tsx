"use client";

import React, { useState } from "react";
import { Search, Plus, Download, Upload, Filter, MoreHorizontal, User, Building } from "lucide-react";

export default function ClientesProveedoresPage() {
  const [activeTab, setActiveTab] = useState<"clientes" | "proveedores">("clientes");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Directorio de Terceros</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión centralizada de clientes y proveedores para operaciones contables.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Upload size={16} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">
              Nuevo {activeTab === "clientes" ? "Cliente" : "Proveedor"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("clientes")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "clientes" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User size={16} />
          Clientes
          {activeTab === "clientes" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("proveedores")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "proveedores" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building size={16} />
          Proveedores
          {activeTab === "proveedores" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder={`Buscar ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-4 py-3">Nombre / Razón Social</th>
              <th className="px-4 py-3">ID Fiscal</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border hover:bg-secondary/5 transition-colors">
              <td className="px-4 py-3 text-center text-muted-foreground" colSpan={5}>
                No hay {activeTab} registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
