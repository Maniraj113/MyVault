"""
Firebase Storage integration for file uploads.
Handles documents, images, and other file types.
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Optional, BinaryIO
from datetime import datetime, timezone

from google.cloud import storage
from google.auth import default as google_auth_default

logger = logging.getLogger("myvault.storage")

_client: storage.Client | None = None


def _resolve_project_id() -> str | None:
    """Resolve the Google Cloud project ID from environment or ADC."""
    # Prefer explicit env vars
    for key in ("GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "FIREBASE_PROJECT_ID"):
        val = os.getenv(key)
        if val:
            return val
    # Fall back to ADC default project
    try:
        _, project_id = google_auth_default()
        return project_id
    except Exception:
        return None


def get_storage_client() -> storage.Client:
    """Get or create Firebase Storage client."""
    global _client
    if _client is None:
        project_id = _resolve_project_id()
        if not project_id:
            raise RuntimeError(
                "Firebase project ID not found. Set env var GOOGLE_CLOUD_PROJECT to your project ID (e.g., myvault-f3f99)."
            )
        logger.info(f"Initializing Firebase Storage client for project: {project_id}")
        _client = storage.Client(project=project_id)
    return _client


def get_bucket_name() -> str:
    """Get the Firebase Storage bucket name."""
    project_id = _resolve_project_id()
    if not project_id:
        raise RuntimeError("Firebase project ID not found")
    
    # Default Firebase Storage bucket pattern
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET", f"{project_id}.appspot.com")
    return bucket_name


def upload_file(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    folder: str = "documents"
) -> dict:
    """
    Upload a file to Firebase Storage.
    
    Args:
        file_data: Binary file data
        filename: Original filename
        content_type: MIME type of the file
        folder: Storage folder (documents, images, etc.)
    
    Returns:
        Dict with file info including public URL
    """
    try:
        client = get_storage_client()
        bucket_name = get_bucket_name()
        bucket = client.bucket(bucket_name)
        
        # Generate unique filename to avoid conflicts
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        storage_path = f"{folder}/{unique_filename}"
        
        # Create blob and upload
        blob = bucket.blob(storage_path)
        blob.upload_from_file(file_data, content_type=content_type)
        
        # Make the file publicly accessible
        blob.make_public()
        
        # Get public URL
        public_url = blob.public_url
        
        file_info = {
            "id": str(uuid.uuid4()),
            "original_filename": filename,
            "storage_path": storage_path,
            "storage_bucket": bucket_name,
            "public_url": public_url,
            "content_type": content_type,
            "size": blob.size,
            "folder": folder,
            "uploaded_at": datetime.now(timezone.utc),
        }
        
        logger.info(f"File uploaded successfully: {storage_path}")
        return file_info
        
    except Exception as e:
        logger.error(f"Failed to upload file {filename}: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to upload file: {str(e)}")


def delete_file(storage_path: str) -> bool:
    """
    Delete a file from Firebase Storage.
    
    Args:
        storage_path: Path to file in storage
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_storage_client()
        bucket_name = get_bucket_name()
        bucket = client.bucket(bucket_name)
        
        blob = bucket.blob(storage_path)
        if blob.exists():
            blob.delete()
            logger.info(f"File deleted successfully: {storage_path}")
            return True
        else:
            logger.warning(f"File not found for deletion: {storage_path}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to delete file {storage_path}: {str(e)}", exc_info=True)
        return False


def get_file_info(storage_path: str) -> Optional[dict]:
    """
    Get information about a file in Firebase Storage.
    
    Args:
        storage_path: Path to file in storage
    
    Returns:
        File info dict or None if not found
    """
    try:
        client = get_storage_client()
        bucket_name = get_bucket_name()
        bucket = client.bucket(bucket_name)
        
        blob = bucket.blob(storage_path)
        if not blob.exists():
            return None
            
        blob.reload()  # Refresh metadata
        
        return {
            "storage_path": storage_path,
            "storage_bucket": bucket_name,
            "public_url": blob.public_url,
            "content_type": blob.content_type,
            "size": blob.size,
            "created": blob.time_created,
            "updated": blob.updated,
        }
        
    except Exception as e:
        logger.error(f"Failed to get file info {storage_path}: {str(e)}", exc_info=True)
        return None


def generate_signed_url(storage_path: str, expiration_hours: int = 1) -> Optional[str]:
    """
    Generate a signed URL for private file access.
    
    Args:
        storage_path: Path to file in storage
        expiration_hours: URL expiration time in hours
    
    Returns:
        Signed URL or None if failed
    """
    try:
        client = get_storage_client()
        bucket_name = get_bucket_name()
        bucket = client.bucket(bucket_name)
        
        blob = bucket.blob(storage_path)
        if not blob.exists():
            return None
            
        from datetime import timedelta
        
        url = blob.generate_signed_url(
            expiration=datetime.now(timezone.utc) + timedelta(hours=expiration_hours),
            method="GET"
        )
        
        return url
        
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {storage_path}: {str(e)}", exc_info=True)
        return None
