#!/bin/bash
set -e

# The main application database ($POSTGRES_DB) is created automatically by the
# postgres image. This script additionally creates the CRM database, named from
# the CRM_DB_NAME env var (sourced from the root .env), if it does not exist.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE "$CRM_DB_NAME"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$CRM_DB_NAME')\gexec
EOSQL

echo "init-crm-db: ensured CRM database '$CRM_DB_NAME'."
