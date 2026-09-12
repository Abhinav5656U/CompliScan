import os
import ssl
from celery import Celery

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")

celery = Celery(
    "meterolens",
    backend=redis_url,
    broker=redis_url,
    include=["app.tasks"]
)

if redis_url.startswith("rediss://"):
    celery.conf.broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
    celery.conf.redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
