#!/usr/bin/env bash
#
# Restauracion desde un respaldo.
#
# Existe por una razon: un respaldo que nunca se ha restaurado no es un
# respaldo, es una suposicion. Este script permite probar la restauracion en
# un directorio aparte, sin tocar produccion, para comprobar que las copias
# sirven de verdad.
#
# Sigue la forma actual de los datos: una base de contabilidad, una de
# identidad y una operativa por marca. Los respaldos anteriores a ese cambio
# traian un unico `voltac.db` en la raiz y este script los reconoce para
# avisar, pero no los restaura: su contenido corresponde a otra estructura.
#
# Probar sin riesgo:   ./scripts/restore.sh /var/backups/voltac/voltac-XXX.tar.gz
# Restaurar de verdad: ./scripts/restore.sh <archivo> --en-produccion

set -euo pipefail

ARCHIVE="${1:-}"
MODO="${2:-prueba}"
DATA_DIR="${VOLTAC_DATA_DIR:-/var/www/voltac-data}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/voltac}"

BASES=("contabilidad.db" "sistema.db" "systems/voltac.db" "energy/voltac.db")

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Uso: $0 <archivo.tar.gz> [--en-produccion]"
  echo
  echo "Respaldos disponibles:"
  ls -lh "$BACKUP_DIR"/voltac-*.tar.gz 2>/dev/null | tail -10 || echo "  (ninguno)"
  exit 1
fi

DEST="$(mktemp -d)"
tar -xzf "$ARCHIVE" -C "$DEST"

echo "Contenido del respaldo:"

if [ -f "$DEST/voltac.db" ] && [ ! -f "$DEST/contabilidad.db" ]; then
  echo
  echo "  Este respaldo es del formato ANTERIOR a la unificacion del repositorio:"
  echo "  una sola base en la raiz. No se puede restaurar con este script porque"
  echo "  la estructura actual separa contabilidad, identidad y operacion."
  echo "  Copia extraida en: $DEST"
  exit 1
fi

ENCONTRADAS=0
for base in "${BASES[@]}"; do
  [ -f "$DEST/$base" ] || continue
  ENCONTRADAS=$((ENCONTRADAS + 1))
  echo "  $base"
  echo "    integridad : $(sqlite3 "$DEST/$base" 'PRAGMA integrity_check;')"
  case "$base" in
    contabilidad.db)
      echo "    facturas   : $(sqlite3 "$DEST/$base" 'SELECT count(*) FROM acc_invoices;' 2>/dev/null || echo n/a)"
      echo "    clientes   : $(sqlite3 "$DEST/$base" 'SELECT count(*) FROM acc_clients;' 2>/dev/null || echo n/a)"
      ;;
    sistema.db)
      echo "    usuarios   : $(sqlite3 "$DEST/$base" 'SELECT count(*) FROM usuarios;' 2>/dev/null || echo n/a)"
      ;;
    *)
      echo "    leads      : $(sqlite3 "$DEST/$base" 'SELECT count(*) FROM quotes;' 2>/dev/null || echo n/a)"
      echo "    proyectos  : $(sqlite3 "$DEST/$base" 'SELECT count(*) FROM projects;' 2>/dev/null || echo n/a)"
      ;;
  esac
done
[ -d "$DEST/uploads" ] && echo "  uploads      : $(find "$DEST/uploads" -type f | wc -l) archivos"

if [ "$ENCONTRADAS" -eq 0 ]; then
  echo "  (ninguna base reconocible en el archivo)"
  exit 1
fi

if [ "$MODO" != "--en-produccion" ]; then
  echo
  echo "MODO PRUEBA. No se toco produccion. Copia extraida en: $DEST"
  echo "Para restaurar de verdad: $0 $ARCHIVE --en-produccion"
  exit 0
fi

# A partir de aqui si se sobrescribe. Antes se guarda lo que hay, porque
# restaurar por error el respaldo equivocado no debe ser irreversible.
echo
read -rp "Esto SOBRESCRIBE los datos actuales. Escriba RESTAURAR para continuar: " OK
[ "$OK" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }

SAFETY="$BACKUP_DIR/antes-de-restaurar-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SAFETY"
for base in "${BASES[@]}"; do
  [ -f "$DATA_DIR/$base" ] || continue
  mkdir -p "$SAFETY/$(dirname "$base")"
  cp "$DATA_DIR/$base" "$SAFETY/$base"
done
echo "Datos actuales guardados en $SAFETY"

pm2 stop voltac-systems voltac-energy

for base in "${BASES[@]}"; do
  [ -f "$DEST/$base" ] || continue
  mkdir -p "$DATA_DIR/$(dirname "$base")"
  cp "$DEST/$base" "$DATA_DIR/$base"
  echo "Restaurada: $base"
done

if [ -d "$DEST/uploads" ]; then
  mkdir -p "$DATA_DIR/uploads"
  cp -r "$DEST/uploads/." "$DATA_DIR/uploads/"
  echo "Restaurados: uploads"
fi

pm2 start voltac-systems voltac-energy

echo "Restauracion completada."
