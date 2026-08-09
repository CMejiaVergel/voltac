#!/usr/bin/env bash
#
# Respaldo diario de los datos de Voltac Systems S.A.S.
#
# Qué copia, tal como quedaron los datos tras unificar el repositorio:
#
#   DATA_DIR/
#     contabilidad.db      facturas, terceros, movimientos, calendario
#     sistema.db           usuarios del panel y auditoria
#     systems/voltac.db    prospectos, proyectos y noticias de esa marca
#     energy/voltac.db     idem, de la otra marca
#     uploads/             imagenes de proyectos y del blog, por marca
#
# ATENCION al historial de este archivo: hasta ahora apuntaba a
# `/var/www/voltac-systems/voltac.db`, que es la base ANTERIOR a la migracion.
# Ese archivo sigue existiendo pero ya no lo escribe nadie, asi que los
# respaldos generados desde la migracion contienen datos congelados. Cualquier
# copia anterior a este cambio hay que darla por inservible.
#
# Por que no es un simple `cp`: la base esta EN USO mientras la aplicacion
# corre. Copiar el archivo a pelo puede capturarlo a mitad de una escritura y
# producir un respaldo corrupto que solo se descubre el dia que se necesita.
# `sqlite3 .backup` usa la API de respaldo en linea, que produce una copia
# consistente sin detener la aplicacion.
#
# Uso:  ./scripts/backup.sh
# Programado por systemd (voltac-backup.timer), a diario.

set -euo pipefail

DATA_DIR="${VOLTAC_DATA_DIR:-/var/www/voltac-data}"
DEST="${BACKUP_DIR:-/var/backups/voltac}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$(mktemp -d)"

# El directorio temporal se borra pase lo que pase, incluso si el script falla.
trap 'rm -rf "$TMP"' EXIT

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if ! command -v sqlite3 >/dev/null 2>&1; then
  log "ERROR: falta sqlite3. Instalar con: apt install -y sqlite3"
  exit 1
fi

if [ ! -d "$DATA_DIR" ]; then
  log "ERROR: no existe $DATA_DIR. Revise VOLTAC_DATA_DIR."
  exit 1
fi

mkdir -p "$DEST"
chmod 700 "$DEST"

# --- 1. Instantanea consistente de cada base ---------------------------------
COPIADAS=0

respaldar_base() {
  local relativa="$1"
  local origen="$DATA_DIR/$relativa"
  local destino="$TMP/$relativa"

  if [ ! -f "$origen" ]; then
    log "AVISO: no se encontro $origen"
    return 0
  fi

  mkdir -p "$(dirname "$destino")"
  sqlite3 "$origen" ".backup '$destino'"

  # Verificacion: un respaldo que no se puede leer no es un respaldo. Mejor
  # enterarse aqui que el dia de la restauracion.
  if [ "$(sqlite3 "$destino" 'PRAGMA integrity_check;')" != "ok" ]; then
    log "ERROR: la copia de $relativa no pasa integrity_check. Se aborta."
    exit 1
  fi

  local tablas
  tablas=$(sqlite3 "$destino" "SELECT count(*) FROM sqlite_master WHERE type='table';")
  log "  $relativa copiada y verificada ($tablas tablas)"
  COPIADAS=$((COPIADAS + 1))
}

respaldar_base "contabilidad.db"
respaldar_base "sistema.db"
respaldar_base "systems/voltac.db"
respaldar_base "energy/voltac.db"

# Que el respaldo salga vacio y el script termine con exito seria la peor
# combinacion posible: nadie mira los registros de algo que no falla.
if [ "$COPIADAS" -eq 0 ]; then
  log "ERROR: no se respaldo ninguna base. Se aborta."
  exit 1
fi

# --- 2. Archivos subidos ------------------------------------------------------
if [ -d "$DATA_DIR/uploads" ]; then
  cp -r "$DATA_DIR/uploads" "$TMP/uploads"
  log "Uploads copiados ($(du -sh "$TMP/uploads" | cut -f1))"
else
  log "AVISO: no se encontro $DATA_DIR/uploads"
fi

# --- 3. Empaquetado -----------------------------------------------------------
ARCHIVE="$DEST/voltac-$STAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$TMP" .
chmod 600 "$ARCHIVE"
log "Respaldo creado: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# --- 4. Copia fuera del servidor ---------------------------------------------
# Una copia en el mismo disco protege de un borrado accidental, pero NO de un
# fallo del disco ni de que el proveedor pierda la maquina. Si hay rclone
# configurado con un remoto llamado `voltac-backup`, se sube tambien alli.
if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q '^voltac-backup:'; then
  if rclone copy "$ARCHIVE" voltac-backup:voltac-systems/ 2>&1; then
    log "Copia remota subida a voltac-backup:"
  else
    log "AVISO: fallo la subida remota; la copia local si quedo"
  fi
else
  log "AVISO: sin copia fuera del servidor (rclone no configurado)"
fi

# --- 5. Rotacion --------------------------------------------------------------
BORRADOS=$(find "$DEST" -name 'voltac-*.tar.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
[ "$BORRADOS" -gt 0 ] && log "Rotacion: $BORRADOS respaldos de mas de $RETENTION_DAYS dias eliminados"

log "Listo. $COPIADAS bases respaldadas. Respaldos disponibles: $(find "$DEST" -name 'voltac-*.tar.gz' | wc -l)"
