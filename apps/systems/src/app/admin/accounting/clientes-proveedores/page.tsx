"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Download, Upload, Filter, MoreHorizontal, User, Building, Trash2, Edit } from "lucide-react";
import { ThirdPartyModal } from "./components/ThirdPartyModal";

export default function ClientesProveedoresPage() {
  const [activeTab, setActiveTab] = useState<"clientes" | "proveedores">("clientes");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "clientes" ? "/api/accounting/clients" : "/api/accounting/suppliers";
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        setData(json.data.filter((item: any) => item.is_active));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      const endpoint = activeTab === "clientes" ? `/api/accounting/clients/${id}` : `/api/accounting/suppliers/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.document_number?.includes(searchTerm) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button onClick={openNewModal} className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">
              Nuevo {activeTab === "clientes" ? "Cliente" : "Proveedor"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab("clientes"); setSearchTerm(""); }}
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
          onClick={() => { setActiveTab("proveedores"); setSearchTerm(""); }}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-4 py-3">Nombre / Razón Social</th>
              <th className="px-4 py-3">ID Fiscal</th>
              <th className="px-4 py-3">Contacto</th>
              {activeTab === "proveedores" && <th className="px-4 py-3">Categoría</th>}
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  Cargando...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  No hay {activeTab} registrados o que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.document_type} {item.document_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{item.email}</div>
                    <div className="text-xs text-muted-foreground">{item.phone}</div>
                  </td>
                  {activeTab === "proveedores" && (
                    <td className="px-4 py-3 text-muted-foreground">{item.category || "-"}</td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="p-1.5 hover:bg-secondary/10 rounded-lg text-secondary transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ThirdPartyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        type={activeTab}
        initialData={editingItem}
      />
    </div>
  );
}
