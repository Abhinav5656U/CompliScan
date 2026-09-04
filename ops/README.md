Production operations:
1. Run `flask db upgrade` during deployment, not `db.create_all()` at application startup.
2. Schedule `backup.sh` daily and copy encrypted backups to a separate storage account/region.
3. Test `restore.sh` regularly in an isolated environment.
4. Use a dedicated runtime database role with only CONNECT/USAGE and required SELECT/INSERT/UPDATE/DELETE privileges. Use a separate migration role for schema changes.
5. Put TLS termination in front of Nginx and redirect HTTP to HTTPS.
6. Set RATELIMIT_STORAGE_URI to a password-protected Redis instance when more than one backend worker is used.

Security checks: run `security_check.sh` before release. Treat any high/critical finding as a failed build rather than ignoring it.
