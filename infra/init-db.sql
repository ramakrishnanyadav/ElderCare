-- Initialize Database and Roles for ELDERCARE 360
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create non-superuser application role without BYPASSRLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eldercare_app') THEN
    CREATE ROLE eldercare_app WITH LOGIN PASSWORD 'app_secure_pass_2026' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE eldercare_db TO eldercare_app;
GRANT USAGE ON SCHEMA public TO eldercare_app;
