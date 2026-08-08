#!/usr/bin/env bash
#
# Respaldo diario de los datos de Voltac Systems.
#
# Qué copia:
#   - voltac.db  : contabilidad, facturas, leads, proyectos y noticias
#   - uploads/   : imágenes de proyectos y del blog
#
# Por qué no es un simple `cp`: la base está EN USO mientras la aplicación
# corre. Copiar el archivo a pelo puede capturarlo a mitad de una escritura y
# producir un respaldo corrupto que solo se descubre el día que se necesita.
# `sqlite3 .backup` usa la API de respaldo en línea, que produce una copia
# consistente sin detener la aplicación.
#
# Uso:  ./scripts/backup.sh
# Programado por systemd (voltac-backup.timer), a diario.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/voltac-systems}"
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

mkdir -p "$DEST"
chmod 700 "$DEST"

# --- 1. Instantánea consistente de la base -----------------------------------
if [ -f "$APP_DIR/voltac.db" ]; then
  sqlite3 "$APP_DIR/voltac.db" ".backup '$TMP/voltac.db'"

  # Verificación: un respaldo que no se puede leer no es un respaldo. Mejor
  # enterarse aquí que el día de la restauración.
  if [ "$(sqlite3 "$TMP/voltac.db" 'PRAGMA integrity_check;')" != "ok" ]; then
    log "ERROR: la copia de la base no pasa integrity_check. Se aborta."
    exit 1
  fi
  TABLAS=$(sqlite3 "$TMP/voltac.db" "SELECT count(*) FROM sqlite_master WHERE type='table';")
  log "Base copiada y verificada ($TABLAS tablas)"
else
  log "AVISO: no se encontró $APP_DIR/voltac.db"
fi

# --- 2. Archivos subidos ------------------------------------------------------
if [ -d "$APP_DIR/uploads" ]; then
  cp -r "$APP_DIR/uploads" "$TMP/uploads"
  log "Uploads copiados ($(du -sh "$TMP/uploads" | cut -f1))"
fi

# --- 3. Empaquetado -----------------------------------------------------------
ARCHIVE="$DEST/voltac-$STAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$TMP" .
chmod 600 "$ARCHIVE"
log "Respaldo creado: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# --- 4. Copia fuera del servidor ---------------------------------------------
# Una copia en el mismo disco protege de un borrado accidental, pero NO de un
# fallo del disco ni de que el proveedor pierda la máquina. Si hay rclone
# configurado con un remoto llamado `voltac-backup`, se sube también allí.
if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q '^voltac-backup:'; then
  if rclone copy "$ARCHIVE" voltac-backup:voltac-systems/ 2>&1; then
    log "Copia remota subida a voltac-backup:"
  else
    log "AVISO: fallo la subida remota; la copia local si quedo"
  fi
else
  log "AVISO: sin copia fuera del servidor (rclone no configurado)"
fi

# --- 5. Rotación --------------------------------------------------------------
BORRADOS=$(find "$DEST" -name 'voltac-*.tar.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
[ "$BORRADOS" -gt 0 ] && log "Rotación: $BORRADOS respaldos de más de $RETENTION_DAYS días eliminados"

log "Listo. Respaldos disponibles: $(find "$DEST" -name 'voltac-*.tar.gz' | wc -l)"
