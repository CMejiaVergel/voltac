#!/usr/bin/env bash
#
# Restauración desde un respaldo.
#
# Existe por una razón: un respaldo que nunca se ha restaurado no es un
# respaldo, es una suposición. Este script permite probar la restauración en
# un directorio aparte, sin tocar producción, para comprobar que las copias
# sirven de verdad.
#
# Probar sin riesgo:   ./scripts/restore.sh /var/backups/voltac/voltac-XXX.tar.gz
# Restaurar de verdad: ./scripts/restore.sh <archivo> --en-produccion

set -euo pipefail

ARCHIVE="${1:-}"
MODO="${2:-prueba}"
APP_DIR="${APP_DIR:-/var/www/voltac-systems}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Uso: $0 <archivo.tar.gz> [--en-produccion]"
  echo
  echo "Respaldos disponibles:"
  ls -lh /var/backups/voltac/voltac-*.tar.gz 2>/dev/null | tail -10 || echo "  (ninguno)"
  exit 1
fi

DEST="$(mktemp -d)"
tar -xzf "$ARCHIVE" -C "$DEST"

echo "Contenido del respaldo:"
if [ -f "$DEST/voltac.db" ]; then
  echo "  integridad : $(sqlite3 "$DEST/voltac.db" 'PRAGMA integrity_check;')"
  echo "  leads      : $(sqlite3 "$DEST/voltac.db" 'SELECT count(*) FROM quotes;' 2>/dev/null || echo n/a)"
  echo "  facturas   : $(sqlite3 "$DEST/voltac.db" 'SELECT count(*) FROM acc_invoices;' 2>/dev/null || echo n/a)"
  echo "  clientes   : $(sqlite3 "$DEST/voltac.db" 'SELECT count(*) FROM acc_clients;' 2>/dev/null || echo n/a)"
fi
[ -d "$DEST/uploads" ] && echo "  uploads    : $(find "$DEST/uploads" -type f | wc -l) archivos"

if [ "$MODO" != "--en-produccion" ]; then
  echo
  echo "MODO PRUEBA. No se toco produccion. Copia extraida en: $DEST"
  echo "Para restaurar de verdad: $0 $ARCHIVE --en-produccion"
  exit 0
fi

# A partir de aquí sí se sobrescribe. Antes se guarda lo que hay, porque
# restaurar por error el respaldo equivocado no debe ser irreversible.
echo
read -rp "Esto SOBRESCRIBE la base actual. Escriba RESTAURAR para continuar: " OK
[ "$OK" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }

SAFETY="/var/backups/voltac/antes-de-restaurar-$(date +%Y%m%d-%H%M%S).db"
[ -f "$APP_DIR/voltac.db" ] && cp "$APP_DIR/voltac.db" "$SAFETY" && echo "Base actual guardada en $SAFETY"

pm2 stop voltac-systems
cp "$DEST/voltac.db" "$APP_DIR/voltac.db"
[ -d "$DEST/uploads" ] && cp -r "$DEST/uploads/." "$APP_DIR/uploads/"
pm2 start voltac-systems

echo "Restauracion completada."
