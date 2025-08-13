"""Chat API endpoints."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
from google.cloud.firestore import Client

from ..firestore_db import get_db
from ..schemas import ChatMessageCreate, ChatMessageOut, ChatMessageUpdate
from ..service.chat_service import (
    create_chat_message,
    get_chat_messages,
    get_conversations,
    update_message_status
)
from ..service.chat_service import delete_chat_message, update_chat_message

router = APIRouter()
logger = logging.getLogger("myvault.chat")


@router.post("/messages", summary="Send a chat message")
def send_message(payload: ChatMessageCreate) -> dict:
    """Send a new chat message."""
    import logging
    logger = logging.getLogger("myvault.chat_api")
    
    try:
        logger.info(f"Received chat message request: {payload.message[:50]}...")
        with get_db() as db:
            logger.info("Database session acquired")
            chat_message = create_chat_message(db, payload)
            return chat_message
    except Exception as e:
        logger.error(f"Failed to create chat message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create chat message: {str(e)}")


@router.get("/messages", summary="Get chat messages")
def get_messages(
    conversation_id: Optional[str] = Query(None, description="Filter by conversation ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of messages to return"),
    offset: int = Query(0, ge=0, description="Number of messages to skip")
) -> list[dict]:
    """Get chat messages, optionally filtered by conversation."""
    import logging
    logger = logging.getLogger("myvault.chat_api")
    
    try:
        logger.info(f"Getting chat messages: conversation_id={conversation_id}, limit={limit}, offset={offset}")
        with get_db() as db:
            messages = get_chat_messages(db, conversation_id, limit, offset)
            logger.info(f"Returning {len(messages)} messages")
            return messages
    except Exception as e:
        logger.error(f"Failed to get chat messages: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get chat messages: {str(e)}")


@router.put("/messages/{message_id}", response_model=ChatMessageOut, summary="Edit a chat message")
def edit_message(
    message_id: str = Path(..., description="Message ID"),
    payload: ChatMessageCreate = ...,
) -> ChatMessageOut:
    try:
        with get_db() as db:
            message = update_chat_message(db, message_id, payload)
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")
            return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update message {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")


@router.delete("/messages/{message_id}", summary="Delete a chat message")
def remove_message(message_id: str = Path(..., description="Message ID")) -> dict:
    try:
        with get_db() as db:
            deleted = delete_chat_message(db, message_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Message not found")
            return {"message": "Message deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete message {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")


@router.get("/conversations", summary="Get recent conversations")
def get_recent_conversations(
    limit: int = Query(20, ge=1, le=50, description="Number of conversations to return")
) -> list[dict]:
    """Get list of recent conversations."""
    try:
        with get_db() as db:
            conversations = get_conversations(db, limit)
            return conversations
    except Exception as e:
        logger.error(f"Failed to get conversations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get conversations: {str(e)}")


@router.get("/messages/{conversation_id}")
def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
) -> list[dict]:
    """Get all messages for a specific conversation."""
    try:
        with get_db() as db:
            messages = get_chat_messages(db, conversation_id, limit, offset)
            return messages
    except Exception as e:
        logger.error(f"Failed to get conversation messages for {conversation_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get conversation messages: {str(e)}")


@router.put("/messages/{message_id}/status", response_model=ChatMessageOut)
def update_message_delivery_status(
    message_id: str,
    status_update: ChatMessageUpdate
) -> ChatMessageOut:
    """Update message delivery status (sent, delivered, read)."""
    try:
        with get_db() as db:
            message = update_message_status(db, message_id, status_update.status)
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")
            return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update message status for {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update message status: {str(e)}")
