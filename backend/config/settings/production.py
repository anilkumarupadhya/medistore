"""
Production settings — debug off, optional S3 storage, strict security headers.
"""
from .base import *  # noqa: F401, F403
from decouple import config
import dj_database_url

DEBUG = False

ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS",
    default="",
    cast=lambda v: [s.strip() for s in v.split(",") if s.strip()],
)

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL"),
        conn_max_age=600,
        ssl_require=config("DB_SSL_REQUIRE", default=False, cast=bool),
    )
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="",
    cast=lambda v: [s.strip() for s in v.split(",") if s.strip()],
)
CORS_ALLOW_CREDENTIALS = True

# ── Storage: use S3 only when AWS credentials are provided ──────────────────
_aws_key = config("AWS_ACCESS_KEY_ID", default="")
if _aws_key:
    DEFAULT_FILE_STORAGE  = "storages.backends.s3boto3.S3Boto3Storage"
    STATICFILES_STORAGE   = "storages.backends.s3boto3.S3StaticStorage"
# else: fall back to local filesystem storage (base.py defaults)

# ── Security headers ────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER      = True
SECURE_CONTENT_TYPE_NOSNIFF    = True
X_FRAME_OPTIONS                = "DENY"
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT            = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE          = True
CSRF_COOKIE_SECURE             = True
