-- Run as the PostgreSQL administrator when provisioning a production database.
-- Do not put passwords in this file.
CREATE ROLE meterolens_app LOGIN PASSWORD 'REPLACE_FROM_SECRET_MANAGER';
CREATE SCHEMA IF NOT EXISTS public;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE meterolens TO meterolens_app;
GRANT USAGE ON SCHEMA public TO meterolens_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO meterolens_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO meterolens_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO meterolens_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO meterolens_app;
-- Keep CREATE/ALTER/DROP privileges with a separate migration/owner role.
