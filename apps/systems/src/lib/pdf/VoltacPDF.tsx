import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Font, Image, Line, Svg,
} from "@react-pdf/renderer";

// ── Brand constants ─────────────────────────────────────────────────────────
const BRAND = {
  primary:   "#2563eb",
  dark:      "#0a0f1e",
  accent:    "#60a5fa",
  lightBg:   "#f0f4ff",
  gray:      "#64748b",
  lightGray: "#e2e8f0",
  white:     "#ffffff",
  green:     "#16a34a",
  name:      "Voltac Systems",
  tagline:   "IA · Automatización · Software a Medida",
  website:   "voltac.com.co",
  email:     "contacto@voltac.com.co",
  address:   "Colombia",
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:          { backgroundColor: BRAND.white, fontFamily: "Helvetica", fontSize: 9, color: BRAND.dark, paddingBottom: 60 },

  // Header
  header:        { backgroundColor: BRAND.dark, paddingHorizontal: 36, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandBlock:    { flexDirection: "column" },
  brandName:     { fontSize: 22, fontFamily: "Helvetica-Bold", color: BRAND.white, letterSpacing: 3 },
  brandTagline:  { fontSize: 7, color: BRAND.accent, marginTop: 2, letterSpacing: 1 },
  docTypeBlock:  { alignItems: "flex-end" },
  docType:       { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND.primary },
  docNumber:     { fontSize: 9, color: BRAND.accent, marginTop: 2, fontFamily: "Helvetica-Bold" },

  // Accent bar
  accentBar:     { height: 4, backgroundColor: BRAND.primary },

  // Body
  body:          { paddingHorizontal: 36, paddingTop: 20 },

  // Info row (emitter + receiver + dates)
  infoRow:       { flexDirection: "row", gap: 12, marginBottom: 20 },
  infoBox:       { flex: 1, backgroundColor: BRAND.lightBg, borderRadius: 6, padding: 12, borderLeft: `3pt solid ${BRAND.primary}` },
  infoBoxRight:  { flex: 1, backgroundColor: BRAND.lightBg, borderRadius: 6, padding: 12, borderLeft: `3pt solid ${BRAND.accent}` },
  infoLabel:     { fontSize: 7, color: BRAND.gray, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  infoValue:     { fontSize: 9, color: BRAND.dark, fontFamily: "Helvetica-Bold", marginBottom: 1 },
  infoSub:       { fontSize: 8, color: BRAND.gray },

  // Dates box
  datesBox:      { width: 130, backgroundColor: BRAND.lightBg, borderRadius: 6, padding: 12, borderLeft: `3pt solid ${BRAND.accent}` },
  dateRow:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  dateLabel:     { fontSize: 7, color: BRAND.gray },
  dateValue:     { fontSize: 8, color: BRAND.dark, fontFamily: "Helvetica-Bold" },

  // Items table
  tableHeader:   { flexDirection: "row", backgroundColor: BRAND.dark, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 8, marginBottom: 2 },
  thText:        { fontSize: 7, color: BRAND.white, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow:      { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: `0.5pt solid ${BRAND.lightGray}` },
  tableRowAlt:   { backgroundColor: BRAND.lightBg },
  tdText:        { fontSize: 8.5, color: BRAND.dark },
  tdNum:         { fontSize: 8.5, color: BRAND.dark, textAlign: "right" },

  // Column widths
  colDesc:  { flex: 1 },
  colQty:   { width: 40, textAlign: "right" },
  colPrice: { width: 75, textAlign: "right" },
  colDto:   { width: 45, textAlign: "right" },
  colTax:   { width: 50, textAlign: "right" },
  colTotal: { width: 75, textAlign: "right" },

  // Totals
  totalsRow:     { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox:     { width: 210 },
  totalLine:     { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: `0.5pt solid ${BRAND.lightGray}` },
  totalLabel:    { fontSize: 8, color: BRAND.gray },
  totalValue:    { fontSize: 8, color: BRAND.dark },
  grandLine:     { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, backgroundColor: BRAND.primary, borderRadius: 4, paddingHorizontal: 10, marginTop: 4 },
  grandLabel:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND.white },
  grandValue:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND.white },

  // Status badge
  statusBadge:   { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 16 },

  // Notes
  notesSection:  { marginTop: 20, flexDirection: "row", gap: 12 },
  notesBox:      { flex: 1, backgroundColor: BRAND.lightBg, borderRadius: 6, padding: 10 },
  notesLabel:    { fontSize: 7, fontFamily: "Helvetica-Bold", color: BRAND.gray, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  notesText:     { fontSize: 8, color: BRAND.dark, lineHeight: 1.5 },

  // Footer
  footer:        { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: BRAND.dark, paddingHorizontal: 36, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText:    { fontSize: 7, color: BRAND.accent },
  footerBrand:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: BRAND.white },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);

const pct = (n: number) => `${n || 0}%`;

const STATUS_BG: Record<string, string> = {
  "Borrador":            "#f1f5f9",
  "Enviada":             "#dbeafe",
  "Parcialmente pagada": "#fef3c7",
  "Pagada":              "#dcfce7",
  "Vencida":             "#fee2e2",
  "Aceptada":            "#dcfce7",
  "Rechazada":           "#fee2e2",
};
const STATUS_FG: Record<string, string> = {
  "Borrador":            "#64748b",
  "Enviada":             "#1d4ed8",
  "Parcialmente pagada": "#d97706",
  "Pagada":              "#16a34a",
  "Vencida":             "#dc2626",
  "Aceptada":            "#16a34a",
  "Rechazada":           "#dc2626",
};

// ── Invoice PDF ──────────────────────────────────────────────────────────────
interface InvoicePDFProps {
  invoice: any;
  items:   any[];
  payments?: any[];
  thirdParty?: any;
}

export function InvoicePDF({ invoice, items, payments = [], thirdParty }: InvoicePDFProps) {
  const isEmitted = invoice.type === "emitted";
  const docLabel  = isEmitted ? "FACTURA" : "FACTURA RECIBIDA";
  const tpLabel   = isEmitted ? "Cliente" : "Proveedor";
  const totalPaid = payments.reduce((a, p) => a + p.amount, 0);
  const balance   = (invoice.total || 0) - totalPaid;

  return (
    <Document title={`${invoice.number} — Voltac Systems`} author="Voltac Systems">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.brandBlock}>
            <Text style={s.brandName}>{BRAND.name.toUpperCase()}</Text>
            <Text style={s.brandTagline}>{BRAND.tagline}</Text>
          </View>
          <View style={s.docTypeBlock}>
            <Text style={s.docType}>{docLabel}</Text>
            <Text style={s.docNumber}>{invoice.number}</Text>
          </View>
        </View>
        <View style={s.accentBar} />

        {/* ── Body ── */}
        <View style={s.body}>
          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: STATUS_BG[invoice.status] || "#f1f5f9" }]}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: STATUS_FG[invoice.status] || "#64748b" }}>
              {invoice.status?.toUpperCase()}
            </Text>
          </View>

          {/* Info row */}
          <View style={s.infoRow}>
            {/* Emitter */}
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Emisor</Text>
              <Text style={s.infoValue}>{BRAND.name}</Text>
              <Text style={s.infoSub}>{BRAND.email}</Text>
              <Text style={s.infoSub}>{BRAND.website}</Text>
              <Text style={s.infoSub}>{BRAND.address}</Text>
            </View>

            {/* Third party */}
            <View style={s.infoBoxRight}>
              <Text style={s.infoLabel}>{tpLabel}</Text>
              <Text style={s.infoValue}>{thirdParty?.name || invoice.third_party_name || "—"}</Text>
              {thirdParty?.email && <Text style={s.infoSub}>{thirdParty.email}</Text>}
              {thirdParty?.phone && <Text style={s.infoSub}>{thirdParty.phone}</Text>}
              {thirdParty?.document_number && (
                <Text style={s.infoSub}>{thirdParty.document_type || "Doc."}: {thirdParty.document_number}</Text>
              )}
              {thirdParty?.address && <Text style={s.infoSub}>{thirdParty.address}</Text>}
            </View>

            {/* Dates */}
            <View style={s.datesBox}>
              <Text style={s.infoLabel}>Fechas</Text>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Emisión:</Text>
                <Text style={s.dateValue}>{invoice.issue_date?.slice(0, 10)}</Text>
              </View>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Vencimiento:</Text>
                <Text style={s.dateValue}>{invoice.due_date?.slice(0, 10)}</Text>
              </View>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Moneda:</Text>
                <Text style={s.dateValue}>{invoice.currency || "COP"}</Text>
              </View>
            </View>
          </View>

          {/* Items table */}
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>Descripción</Text>
            <Text style={[s.thText, s.colQty]}>Cant.</Text>
            <Text style={[s.thText, s.colPrice]}>P. Unit.</Text>
            <Text style={[s.thText, s.colDto]}>Dto%</Text>
            <Text style={[s.thText, s.colTax]}>IVA%</Text>
            <Text style={[s.thText, s.colTotal]}>Total</Text>
          </View>

          {items.map((item: any, idx: number) => {
            const base  = (item.quantity || 0) * (item.unit_price || 0);
            const after = base * (1 - (item.discount_pct || 0) / 100);
            const tax   = item.tax_id ? (item.tax_id === 1 ? 19 : item.tax_id === 2 ? 5 : 0) : 0;
            const total = after * (1 + tax / 100);
            return (
              <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tdText, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tdNum, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.tdNum, s.colPrice]}>{fmt(item.unit_price)}</Text>
                <Text style={[s.tdNum, s.colDto]}>{pct(item.discount_pct)}</Text>
                <Text style={[s.tdNum, s.colTax]}>{tax > 0 ? pct(tax) : "—"}</Text>
                <Text style={[s.tdNum, s.colTotal]}>{fmt(total)}</Text>
              </View>
            );
          })}

          {/* Totals */}
          <View style={s.totalsRow}>
            <View style={s.totalsBox}>
              <View style={s.totalLine}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmt(invoice.subtotal)}</Text>
              </View>
              {(invoice.discount || 0) > 0 && (
                <View style={s.totalLine}>
                  <Text style={s.totalLabel}>Descuento ({invoice.discount}%)</Text>
                  <Text style={s.totalValue}>-{fmt(invoice.subtotal * (invoice.discount / 100))}</Text>
                </View>
              )}
              <View style={s.totalLine}>
                <Text style={s.totalLabel}>IVA</Text>
                <Text style={s.totalValue}>{fmt(invoice.tax_total)}</Text>
              </View>
              {totalPaid > 0 && (
                <View style={s.totalLine}>
                  <Text style={[s.totalLabel, { color: BRAND.green }]}>Abonado</Text>
                  <Text style={[s.totalValue, { color: BRAND.green }]}>-{fmt(totalPaid)}</Text>
                </View>
              )}
              <View style={s.grandLine}>
                <Text style={s.grandLabel}>{totalPaid > 0 ? "SALDO" : "TOTAL"}</Text>
                <Text style={s.grandValue}>{fmt(totalPaid > 0 ? balance : invoice.total)}</Text>
              </View>
            </View>
          </View>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <View style={s.notesSection}>
              {invoice.notes && (
                <View style={s.notesBox}>
                  <Text style={s.notesLabel}>Notas</Text>
                  <Text style={s.notesText}>{invoice.notes}</Text>
                </View>
              )}
              {invoice.terms && (
                <View style={s.notesBox}>
                  <Text style={s.notesLabel}>Términos y Condiciones</Text>
                  <Text style={s.notesText}>{invoice.terms}</Text>
                </View>
              )}
            </View>
          )}

          {/* Payment history if any */}
          {payments.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={[s.infoLabel, { marginBottom: 6 }]}>Historial de Pagos</Text>
              {payments.map((p: any, i: number) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: `0.5pt solid ${BRAND.lightGray}` }}>
                  <Text style={{ fontSize: 8, color: BRAND.gray }}>{p.date?.slice(0, 10)} — {p.method}</Text>
                  <Text style={{ fontSize: 8, color: BRAND.green, fontFamily: "Helvetica-Bold" }}>{fmt(p.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{BRAND.email} · {BRAND.website}</Text>
          <Text style={s.footerBrand}>{BRAND.name.toUpperCase()}</Text>
          <Text style={s.footerText}>Generado el {new Date().toLocaleDateString("es-CO")}</Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Quote PDF ────────────────────────────────────────────────────────────────
interface QuotePDFProps {
  quote:     any;
  items:     any[];
  client?:   any;
}

export function QuotePDF({ quote, items, client }: QuotePDFProps) {
  return (
    <Document title={`${quote.number} — Voltac Systems`} author="Voltac Systems">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.brandBlock}>
            <Text style={s.brandName}>{BRAND.name.toUpperCase()}</Text>
            <Text style={s.brandTagline}>{BRAND.tagline}</Text>
          </View>
          <View style={s.docTypeBlock}>
            <Text style={s.docType}>COTIZACIÓN</Text>
            <Text style={s.docNumber}>{quote.number}</Text>
          </View>
        </View>
        <View style={s.accentBar} />

        <View style={s.body}>
          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: STATUS_BG[quote.status] || "#f1f5f9" }]}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: STATUS_FG[quote.status] || "#64748b" }}>
              {quote.status?.toUpperCase()}
            </Text>
          </View>

          {/* Info row */}
          <View style={s.infoRow}>
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Ofertante</Text>
              <Text style={s.infoValue}>{BRAND.name}</Text>
              <Text style={s.infoSub}>{BRAND.email}</Text>
              <Text style={s.infoSub}>{BRAND.website}</Text>
            </View>
            <View style={s.infoBoxRight}>
              <Text style={s.infoLabel}>Dirigido a</Text>
              <Text style={s.infoValue}>{client?.name || quote.client_name || "—"}</Text>
              {client?.email && <Text style={s.infoSub}>{client.email}</Text>}
              {client?.phone && <Text style={s.infoSub}>{client.phone}</Text>}
            </View>
            <View style={s.datesBox}>
              <Text style={s.infoLabel}>Fechas</Text>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Emisión:</Text>
                <Text style={s.dateValue}>{quote.issue_date?.slice(0, 10)}</Text>
              </View>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Válida hasta:</Text>
                <Text style={s.dateValue}>{quote.expiry_date?.slice(0, 10)}</Text>
              </View>
              <View style={s.dateRow}>
                <Text style={s.dateLabel}>Moneda:</Text>
                <Text style={s.dateValue}>{quote.currency || "COP"}</Text>
              </View>
            </View>
          </View>

          {/* Items table */}
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>Descripción</Text>
            <Text style={[s.thText, s.colQty]}>Cant.</Text>
            <Text style={[s.thText, s.colPrice]}>P. Unit.</Text>
            <Text style={[s.thText, s.colDto]}>Dto%</Text>
            <Text style={[s.thText, s.colTax]}>IVA%</Text>
            <Text style={[s.thText, s.colTotal]}>Total</Text>
          </View>

          {items.map((item: any, idx: number) => {
            const base  = (item.quantity || 0) * (item.unit_price || 0);
            const after = base * (1 - (item.discount_pct || 0) / 100);
            const tax   = item.tax_id ? (item.tax_id === 1 ? 19 : item.tax_id === 2 ? 5 : 0) : 0;
            const total = after * (1 + tax / 100);
            return (
              <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tdText, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tdNum, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.tdNum, s.colPrice]}>{fmt(item.unit_price)}</Text>
                <Text style={[s.tdNum, s.colDto]}>{pct(item.discount_pct)}</Text>
                <Text style={[s.tdNum, s.colTax]}>{tax > 0 ? pct(tax) : "—"}</Text>
                <Text style={[s.tdNum, s.colTotal]}>{fmt(total)}</Text>
              </View>
            );
          })}

          {/* Totals */}
          <View style={s.totalsRow}>
            <View style={s.totalsBox}>
              <View style={s.totalLine}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmt(quote.subtotal)}</Text>
              </View>
              {(quote.discount || 0) > 0 && (
                <View style={s.totalLine}>
                  <Text style={s.totalLabel}>Descuento ({quote.discount}%)</Text>
                  <Text style={s.totalValue}>-{fmt(quote.subtotal * (quote.discount / 100))}</Text>
                </View>
              )}
              <View style={s.totalLine}>
                <Text style={s.totalLabel}>IVA</Text>
                <Text style={s.totalValue}>{fmt(quote.tax_total)}</Text>
              </View>
              <View style={s.grandLine}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{fmt(quote.total)}</Text>
              </View>
            </View>
          </View>

          {/* Accept CTA */}
          <View style={{ marginTop: 24, backgroundColor: BRAND.lightBg, borderRadius: 8, padding: 14, borderLeft: `4pt solid ${BRAND.primary}` }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BRAND.dark, marginBottom: 4 }}>
              ¿Cómo aceptar esta cotización?
            </Text>
            <Text style={{ fontSize: 7.5, color: BRAND.gray, lineHeight: 1.5 }}>
              Responde a este documento por correo a {BRAND.email} indicando el número de cotización {quote.number},
              o contáctanos a través de {BRAND.website}. Esta cotización es válida hasta el {quote.expiry_date?.slice(0, 10)}.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{BRAND.email} · {BRAND.website}</Text>
          <Text style={s.footerBrand}>{BRAND.name.toUpperCase()}</Text>
          <Text style={s.footerText}>Generado el {new Date().toLocaleDateString("es-CO")}</Text>
        </View>

      </Page>
    </Document>
  );
}
