# PRD — Módulo Accounting · Admin Panel Voltac
**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Proyecto:** Voltac Web — Admin Panel  
**Módulo:** Accounting  
**Destinatario:** Antigravity  

## Checklist de Implementación

### Fase 0 — Configuración Base
- [x] Crear entrada "Accounting" en el menú lateral del Admin Panel
- [x] Definir estructura de rutas del módulo
- [x] Configurar base de datos: tablas y relaciones de todas las entidades
- [x] Implementar sistema de roles: Contador, Visualizador Contable
- [x] Crear middleware de verificación de permisos para rutas del módulo
- [x] Configurar panel de Configuración del módulo (Empresa, Plan de Cuentas, Impuestos, Monedas, Categorías, Numeración)
- [x] Cargar plan de cuentas base (estándar)
- [x] Implementar sección de Integración n8n (URL, token, test de conexión, log)

### Fase 1 — Clientes & Proveedores
- [x] CRUD completo de Clientes
- [x] CRUD completo de Proveedores
- [ ] Importación desde Excel (plantilla descargable)
- [ ] Exportación a Excel
- [ ] Vista de ficha individual con historial vinculado
- [x] Búsqueda y filtros avanzados en ambas listas

### Fase 2 — Ingresos & Egresos
- [x] Formulario de registro de movimiento financiero (todos los campos definidos)
- [x] Vista de tabla con filtros avanzados
- [ ] Vista de línea de tiempo mensual
- [ ] Adjuntar comprobante (upload y visualización)
- [ ] Importación masiva desde Excel
- [ ] Exportación a Excel con filtros aplicados
- [x] Resumen de totales en la tabla
- [ ] Vinculación a facturas, clientes y proveedores

### Fase 3 — Facturación
- [x] Formulario de creación de factura emitida (ítems, cálculos, impuestos, descuentos)
- [x] Numeración automática de facturas
- [x] Gestión de estados de factura
- [ ] Registro de pagos parciales y totales
- [ ] Historial de pagos por factura
- [ ] Generación y exportación de factura a PDF con membrete Voltac
- [ ] Envío de factura por correo (via webhook n8n)
- [x] Formulario de registro de factura recibida (proveedor)
- [ ] Adjuntar PDF de factura recibida
- [ ] Alertas de vencimiento automáticas
- [x] Listado con filtros avanzados (ambos tipos)
- [ ] Exportación de listado a Excel
