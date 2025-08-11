"""Chat API endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import ChatMessageCreate, ChatMessageOut, ChatMessageUpdate
from ..service.chat_service import (
    create_chat_message,
    get_chat_messages,
    get_conversations,
    update_message_status
)
from ..service.chat_service import delete_chat_message, update_chat_message

router = APIRouter()


@router.post("/messages", response_model=ChatMessageOut, summary="Send a chat message")
def send_message(payload: ChatMessageCreate) -> ChatMessageOut:
    """Send a new chat message."""
    import logging
    logger = logging.getLogger("myvault.chat_api")
    
    try:
        logger.info(f"Received chat message request: {payload.message[:50]}...")
        with get_db() as db:
            logger.info("Database session acquired")
            chat_message = create_chat_message(db, payload)
            logger.info(f"Chat message created successfully with ID: {chat_message.id}")
            return chat_message
    except Exception as e:
        logger.error(f"Failed to create chat message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create chat message: {str(e)}")


@router.get("/messages", response_model=list[ChatMessageOut], summary="Get chat messages")
def get_messages(
    conversation_id: Optional[str] = Query(None, description="Filter by conversation ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of messages to return"),
    offset: int = Query(0, ge=0, description="Number of messages to skip")
) -> list[ChatMessageOut]:
    """Get chat messages, optionally filtered by conversation."""
    with get_db() as db:
        messages = get_chat_messages(db, conversation_id, limit, offset)
        return messages


@router.put("/messages/{message_id}", response_model=ChatMessageOut, summary="Edit a chat message")
def edit_message(
    message_id: int = Path(..., description="Message ID"),
    payload: ChatMessageCreate = ...,
) -> ChatMessageOut:
    with get_db() as db:
        message = update_chat_message(db, message_id, payload)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        return message


@router.delete("/messages/{message_id}", summary="Delete a chat message")
def remove_message(message_id: int = Path(..., description="Message ID")) -> dict:
    with get_db() as db:
        deleted = delete_chat_message(db, message_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Message not found")
        return {"message": "Message deleted"}


@router.get("/conversations", summary="Get recent conversations")
def get_recent_conversations(
    limit: int = Query(20, ge=1, le=50, description="Number of conversations to return")
) -> list[dict]:
    """Get list of recent conversations."""
    with get_db() as db:
        conversations = get_conversations(db, limit)
        return conversations


@router.get("/messages/{conversation_id}", response_model=list[ChatMessageOut])
def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
) -> list[ChatMessageOut]:
    """Get all messages for a specific conversation."""
    with get_db() as db:
        messages = get_chat_messages(db, conversation_id, limit, offset)
        return messages


@router.put("/messages/{message_id}/status", response_model=ChatMessageOut)
def update_message_delivery_status(
    message_id: int,
    status_update: ChatMessageUpdate
) -> ChatMessageOut:
    """Update message delivery status (sent, delivered, read)."""
    with get_db() as db:
        message = update_message_status(db, message_id, status_update.status)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        return message
