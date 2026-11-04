#!/usr/bin/env bash
# Copies the local RoadAtlas database into a hosted MongoDB (Atlas and friends).
#
#   ATLAS_URI='mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/roadatlas' \
#     ./dev/push-db-to-atlas.sh
#
# Add --drop to wipe the target collections first (needs an explicit --yes):
#
#   ATLAS_URI='...' ./dev/push-db-to-atlas.sh --drop --yes
#
# Both mongodump and mongorestore run inside the local Mongo container, which is
# the only place they are installed. The dump is written to a git-ignored temp
# file first so a failed upload never leaves the target half-written by a broken
# pipe.
set -euo pipefail

CONTAINER="${ROADATLAS_MONGO_CONTAINER:-roadatlas-mongo}"
LOCAL_URI="${LOCAL_URI:-mongodb://127.0.0.1:27017/roadatlas}"
DB_NAME="roadatlas"
TARGET_DB="${TARGET_DB:-roadatlas}"
DROP=""
CONFIRMED=""

for arg in "$@"; do
  case "$arg" in
    --drop) DROP="--drop=1" ;;
    --yes) CONFIRMED="yes" ;;
    *) echo "error: unknown argument '$arg'" >&2; exit 1 ;;
  esac
done

if [ -z "${ATLAS_URI:-}" ]; then
  echo "error: set ATLAS_URI to the target connection string" >&2
  exit 1
fi

if [ -n "$DROP" ] && [ "$CONFIRMED" != "yes" ]; then
  echo "error: --drop needs --yes (it removes every collection in the target)" >&2
  exit 1
fi

case "$ATLAS_URI" in
  *127.0.0.1* | *localhost*)
    echo "error: ATLAS_URI points at localhost; that is not a remote database" >&2
    exit 1
    ;;
esac

if ! podman ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container '$CONTAINER' is not running (podman start $CONTAINER)" >&2
  exit 1
fi

DUMP="$(mktemp -t roadatlas-atlas-XXXXXX.archive)"
trap 'rm -f "$DUMP"' EXIT

echo "==> dumping local '$DB_NAME' from $CONTAINER"
podman exec "$CONTAINER" mongodump --quiet --uri="$LOCAL_URI" --archive >"$DUMP"
echo "    $(du -h "$DUMP" | cut -f1) archive"

echo "==> restoring into the remote database"
RESTORE_ARGS=(
  --quiet
  --uri="$ATLAS_URI"
  --archive
  --nsInclude="$DB_NAME.*"
  --nsFrom="$DB_NAME.*"
  --nsTo="$TARGET_DB.*"
)
if [ -n "$DROP" ]; then
  RESTORE_ARGS+=(--drop)
  echo "    WARNING: dropping existing remote collections"
fi
podman exec -i "$CONTAINER" mongorestore "${RESTORE_ARGS[@]}" <"$DUMP"

echo "==> verifying the remote database"
podman exec "$CONTAINER" mongosh --quiet "$ATLAS_URI" --eval '
  const db = db.getSiblingDB("'"$TARGET_DB"'");
  for (const name of ["users", "roadmaps", "steps", "progresses", "foci"]) {
    print("    " + name.padEnd(12) + db.getCollection(name).countDocuments());
  }
'

echo "done."
