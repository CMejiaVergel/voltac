"use client";

import * as React from "react";
import { UserPlus, KeyRound, Power, ShieldCheck } from "lucide-react";
import { cn } from "../../utils";
import { ROLES, ROL_DESCRIPCION, ROL_ETIQUETA, type Rol } from "../../roles";

/**
 * Alta y baja de cuentas del panel.
 *
 * Sin esta pantalla, crear la cuenta de un contador exigía entrar por SSH y
 * escribir SQL a mano: suficiente fricción para que en la práctica se acabara
 * compartiendo una sola credencial entre varias personas, que es exactamente lo
 * que los roles vienen a evitar.
 *
 * No hay borrado, solo desactivación. Un usuario borrado deja huérfanas las
 * líneas de auditoría que lo nombran, y el registro de quién hizo qué pierde su
 * valor justo en el caso en que se necesita.
 */

interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
  ultimo_acceso: string | null;
}

const vacio = { usuario: "", nombre: "", password: "", rol: "moderador" as Rol };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [form, setForm] = React.useState(vacio);
  const [error, setError] = React.useState("");
  const [aviso, setAviso] = React.useState("");
  const [cargando, setCargando] = React.useState(true);

  const cargar = React.useCallback(async () => {
    const res = await fetch("/api/usuarios");
    const j = await res.json();
    if (j.success) setUsuarios(j.data);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAviso("");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (!j.success) return setError(j.error ?? "No se pudo crear la cuenta.");
    setAviso(`Cuenta creada: ${form.usuario}. Entréguele la contraseña por un medio seguro.`);
    setForm(vacio);
    void cargar();
  };

  const alternar = async (u: Usuario) => {
    setError("");
    setAviso("");
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    });
    const j = await res.json();
    if (!j.success) return setError(j.error ?? "No se pudo cambiar el estado.");
    void cargar();
  };

  const restablecer = async (u: Usuario) => {
    const nueva = window.prompt(`Nueva contraseña para ${u.usuario} (mínimo 10 caracteres):`);
    if (!nueva) return;
    setError("");
    setAviso("");
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, password: nueva }),
    });
    const j = await res.json();
    if (!j.success) return setError(j.error ?? "No se pudo cambiar la contraseña.");
    setAviso(`Contraseña actualizada para ${u.usuario}.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-primary"
          style={{ fontFamily: "Akira Expanded, sans-serif" }}
        >
          USUARIOS
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quién entra al panel y hasta dónde llega. Las cuentas son comunes a las dos marcas.
        </p>
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      {aviso && (
        <p className="text-sm font-medium bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-3">
          {aviso}
        </p>
      )}

      <form
        onSubmit={crear}
        className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4"
      >
        <h2 className="font-semibold flex items-center gap-2">
          <UserPlus size={18} /> Nueva cuenta
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Usuario
            </span>
            <input
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              required
              minLength={3}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-background"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nombre
            </span>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-background"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contraseña inicial
            </span>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={10}
              placeholder="mínimo 10 caracteres"
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-background"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Rol
            </span>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-background"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_ETIQUETA[r]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-muted-foreground">{ROL_DESCRIPCION[form.rol]}</p>

        <button
          type="submit"
          className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Crear cuenta
        </button>
      </form>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold">Usuario</th>
                <th className="px-6 py-3 font-semibold">Rol</th>
                <th className="px-6 py-3 font-semibold">Último acceso</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{u.usuario}</p>
                    {u.nombre && <p className="text-xs text-muted-foreground">{u.nombre}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      {u.rol === "propietario" && <ShieldCheck size={14} />}
                      {ROL_ETIQUETA[u.rol]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.ultimo_acceso ?? "nunca"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        u.activo
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200",
                      )}
                    >
                      {u.activo ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => restablecer(u)}
                        title="Cambiar contraseña"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => alternar(u)}
                        title={u.activo ? "Desactivar" : "Activar"}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          u.activo ? "hover:bg-destructive/10 text-destructive" : "hover:bg-muted",
                        )}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Un cambio de rol surte efecto en el siguiente inicio de sesión, como mucho ocho horas
        después. Para retirar el acceso de inmediato, desactive la cuenta.
      </p>
    </div>
  );
}
