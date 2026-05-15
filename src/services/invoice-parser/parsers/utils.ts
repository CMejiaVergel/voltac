export const parseAmount = (s: string): number => {
  if (!s) return 0;
  const t = s.replace(/\s/g, "");
  const lastDot = t.lastIndexOf(".");
  const lastComma = t.lastIndexOf(",");
  let n: string;
  if (lastDot > lastComma) n = t.replace(/,/g, "");          // US: remove commas
  else if (lastComma > lastDot) n = t.replace(/\./g, "").replace(",", "."); // CO: remove dots, comma→dot
  else n = t.replace(/,/g, "");
  return parseFloat(n) || 0;
};

export const clean = (s: string) => s?.replace(/\s+/g, " ").trim() || "";

export const toISO = (raw: string): string => {
  if (!raw || raw === "--" || raw === "—") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-]/);
  if (parts.length !== 3) return "";
  const [a, b, c] = parts.map(Number);
  if (a > 31) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
  return `${c > 100 ? c : 2000 + c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
};
