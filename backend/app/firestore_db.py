from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator
import os
import logging

from google.cloud import firestore
from google.auth import default as google_auth_default

logger = logging.getLogger("myvault.firestore")

_client: firestore.Client | None = None


def _resolve_project_id() -> str | None:
    # Prefer explicit env vars
    for key in ("GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "FIRESTORE_PROJECT_ID", "FIREBASE_PROJECT_ID"):
        val = os.getenv(key)
        if val:
            return val
    # Fall back to ADC default project
    try:
        _, project_id = google_auth_default()
        return project_id
    except Exception:
        return None


def get_client() -> firestore.Client:
    global _client
    if _client is None:
        project_id = _resolve_project_id()
        if not project_id:
            raise RuntimeError(
                "Firestore project ID not found. Set env var GOOGLE_CLOUD_PROJECT to your project ID (e.g., myvault-f3f99)."
            )
        database_id = os.getenv("FIRESTORE_DATABASE_ID", "myvault")
        logger.info(f"Initializing Firestore client for project: {project_id}, database: {database_id}")
        _client = firestore.Client(project=project_id, database=database_id)
    return _client


@contextmanager
def get_db() -> Iterator[firestore.Client]:
    yield get_client()


