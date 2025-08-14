"""File upload API endpoints."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Query as FastAPIQuery

from fastapi.responses import RedirectResponse

from ..firestore_db import get_db
from ..schemas import FileUploadOut, DocumentCreate
from ..storage import upload_file, delete_file, get_file_info, generate_signed_url

router = APIRouter()
logger = logging.getLogger("myvault.files")

# Allowed file types and size limits
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "text/plain", "application/msword", 
                         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                         "application/vnd.ms-excel", 
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=FileUploadOut, summary="Upload file")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None), 
    folder: str = Form("documents"),
    category: Optional[str] = Form("other"),
    person: Optional[str] = Form("Unknown")
) -> FileUploadOut:
    """Upload a document or image file."""
    try:
        logger.info(f"Uploading file: {file.filename}, type: {file.content_type}")
        
        # Validate file type
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(ALLOWED_TYPES)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Use user-selected folder, but validate it's reasonable
        # Only override if user didn't specify a folder or specified an invalid one
        if not folder or folder not in ["Personal", "Work", "Medical", "Financial", "Education", "Travel", "Legal", "images", "documents"]:
            # Fallback to type-based folder only if user selection is invalid
            if file.content_type in ALLOWED_IMAGE_TYPES:
                folder = "images"
            elif file.content_type in ALLOWED_DOCUMENT_TYPES:
                folder = "documents"
            else:
                folder = "documents"
        
        # Upload to Firebase Storage
        from io import BytesIO
        file_data = BytesIO(file_content)
        
        storage_info = upload_file(
            file_data=file_data,
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
            folder=folder
        )
        
        # Create item and file records in Firestore
        with get_db() as db:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            # Create item document
            item_ref = db.collection("items").document()
            item_doc = {
                "id": item_ref.id,
                "kind": "file",
                "title": title or file.filename or "Uploaded file",
                "content": content,
                "created_at": now,
                "updated_at": now,
            }
            
            # Create file document
            file_ref = db.collection("files").document()
            file_doc = {
                "id": file_ref.id,
                "item_id": item_ref.id,
                "original_filename": file.filename or "unknown",
                "storage_path": storage_info["storage_path"],
                "storage_bucket": storage_info["storage_bucket"],
                "public_url": storage_info["public_url"],
                "content_type": file.content_type or "application/octet-stream",
                "size": len(file_content),
                "folder": folder,
                "uploaded_at": now,
                "item": item_doc,
                # Add user metadata
                "user_folder": folder,  # Store the user's selected folder
                "category": category,   # User-selected category
                "person": person,       # User-selected person
            }
            
            # Write both documents in batch
            batch = db.batch()
            batch.set(item_ref, item_doc)
            batch.set(file_ref, file_doc)
            batch.commit()
            
            logger.info(f"File uploaded successfully: {file_ref.id}")
            return file_doc
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.get("/", response_model=list[FileUploadOut], summary="List files")
def list_files(
    folder: Optional[str] = FastAPIQuery(None, description="Filter by folder"),
    content_type: Optional[str] = FastAPIQuery(None, description="Filter by content type"),
    limit: int = FastAPIQuery(50, ge=1, le=100, description="Number of files to return"),
    offset: int = FastAPIQuery(0, ge=0, description="Number of files to skip")
) -> list[FileUploadOut]:
    """Get uploaded files with optional filters."""
    try:
        with get_db() as db:
            logger.info(f"Listing files: folder={folder}, content_type={content_type}")
            q = db.collection("files")
            
            if folder:
                q = q.where("folder", "==", folder)
            if content_type:
                q = q.where("content_type", "==", content_type)
            
            try:
                q = q.order_by("uploaded_at", direction="DESCENDING")
                docs = list(q.offset(offset).limit(limit).stream())
            except Exception as order_error:
                logger.warning(f"Failed to order by uploaded_at: {order_error}")
                docs = list(q.offset(offset).limit(limit).stream())
            
            result = []
            for doc in docs:
                file_data = doc.to_dict()
                # Hydrate with item data if needed
                if not file_data.get("item"):
                    item_id = file_data.get("item_id")
                    if item_id:
                        item_snap = db.collection("items").document(item_id).get()
                        if item_snap.exists:
                            file_data["item"] = item_snap.to_dict()
                result.append(file_data)
            
            logger.info(f"Found {len(result)} files")
            return result
            
    except Exception as e:
        logger.error(f"Failed to list files: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/{file_id}", response_model=FileUploadOut, summary="Get file by ID")
def get_file(file_id: str) -> FileUploadOut:
    """Get a specific file by ID."""
    try:
        with get_db() as db:
            ref = db.collection("files").document(file_id)
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="File not found")
            
            file_data = snap.to_dict()
            
            # Hydrate with item data if needed
            if not file_data.get("item"):
                item_id = file_data.get("item_id")
                if item_id:
                    item_snap = db.collection("items").document(item_id).get()
                    if item_snap.exists:
                        file_data["item"] = item_snap.to_dict()
            
            return file_data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file {file_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")


@router.get("/{file_id}/download", summary="Download file")
def download_file(file_id: str, signed: bool = FastAPIQuery(False, description="Use signed URL for private access")):
    """Download a file or get download URL."""
    try:
        with get_db() as db:
            ref = db.collection("files").document(file_id)
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="File not found")
            
            file_data = snap.to_dict()
            storage_path = file_data.get("storage_path")
            
            if not storage_path:
                raise HTTPException(status_code=404, detail="File storage path not found")
            
            if signed:
                # Generate signed URL for private access
                signed_url = generate_signed_url(storage_path, expiration_hours=1)
                if not signed_url:
                    raise HTTPException(status_code=404, detail="Failed to generate download URL")
                return {"download_url": signed_url}
            else:
                # Redirect to public URL
                public_url = file_data.get("public_url")
                if not public_url:
                    raise HTTPException(status_code=404, detail="File public URL not found")
                return RedirectResponse(url=public_url)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download file {file_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


@router.delete("/{file_id}", summary="Delete file")
def delete_uploaded_file(file_id: str) -> dict:
    """Delete a file and its storage."""
    try:
        with get_db() as db:
            ref = db.collection("files").document(file_id)
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="File not found")
            
            file_data = snap.to_dict()
            storage_path = file_data.get("storage_path")
            item_id = file_data.get("item_id")
            
            # Delete from Firebase Storage
            if storage_path:
                delete_success = delete_file(storage_path)
                if not delete_success:
                    logger.warning(f"Failed to delete storage file: {storage_path}")
            
            # Delete from Firestore
            batch = db.batch()
            batch.delete(ref)
            
            # Also delete associated item
            if item_id:
                item_ref = db.collection("items").document(item_id)
                if item_ref.get().exists:
                    batch.delete(item_ref)
            
            batch.commit()
            
            logger.info(f"File deleted successfully: {file_id}")
            return {"message": "File deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file {file_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/folders/list", summary="List available folders")
def list_folders() -> dict:
    """Get list of available file folders."""
    return {
        "folders": [
            {"name": "documents", "description": "PDF, Word, Excel and text files"},
            {"name": "images", "description": "JPEG, PNG, GIF and WebP images"},
        ]
    }
