"""Chat service for handling chat messages and conversations."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, case, and_

from ..models import Item, ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageOut, ChatMessageUpdate

logger = logging.getLogger("myvault.chat_service")


def create_chat_message(db: Session, payload: ChatMessageCreate) -> ChatMessage:
    """Create a new chat message."""
    logger.info(f"Creating chat message - Conversation: {payload.conversation_id} - Message: {payload.message[:50]}...")
    
    try:
        # Create the item first
        item = Item(
            kind="chat",
            title=f"Chat message: {payload.message[:50]}...",
            content=payload.message
        )
        logger.info(f"Adding item to database...")
        db.add(item)
        db.flush()
        logger.info(f"Item created with ID: {item.id}")
        
        # Create the chat message
        chat_message = ChatMessage(
            item_id=item.id,
            message=payload.message,
            is_user=True,
            conversation_id=payload.conversation_id,
            status="sent",
            created_at=datetime.now()
        )
        logger.info(f"Adding chat message to database...")
        db.add(chat_message)
        db.flush()
        logger.info(f"Chat message created with ID: {chat_message.id}")
        
        # Commit the transaction
        logger.info(f"Committing transaction...")
        db.commit()
        logger.info(f"Transaction committed successfully")
        
        # Eagerly load the 'item' relationship and return it
        logger.info(f"Loading chat message with relationships...")
        chat_message = db.query(ChatMessage).options(joinedload(ChatMessage.item)).filter(ChatMessage.id == chat_message.id).one()
        logger.info(f"Successfully created chat message with ID: {chat_message.id}")
        return chat_message
        
    except Exception as e:
        logger.error(f"Failed to create chat message: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {str(e)}", exc_info=True)
        db.rollback()
        raise


def get_chat_messages(
    db: Session,
    conversation_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> list[ChatMessage]:
    """Get chat messages, optionally filtered by conversation."""
    logger.info(f"Fetching chat messages - Conversation: {conversation_id}, limit={limit}, offset={offset}")
    
    try:
        query = db.query(ChatMessage).options(joinedload(ChatMessage.item)).join(Item)
        
        if conversation_id:
            query = query.filter(ChatMessage.conversation_id == conversation_id)
        
        messages = query.order_by(desc(Item.created_at)).offset(offset).limit(limit).all()
        logger.info(f"Retrieved {len(messages)} chat messages from database")
        return messages
        
    except Exception as e:
        logger.error(f"Failed to retrieve chat messages: {str(e)}")
        raise


def update_message_status(db: Session, message_id: int, status: str) -> Optional[ChatMessage]:
    """Update message status (sent, delivered, read)."""
    logger.info(f"Updating message {message_id} status to {status}")
    
    try:
        message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
        if not message:
            return None
            
        message.status = status
        if status == "delivered" and not message.delivered_at:
            message.delivered_at = datetime.now()
        elif status == "read" and not message.read_at:
            message.read_at = datetime.now()
            
        db.commit()
        db.refresh(message)
        logger.info(f"Successfully updated message {message_id} status to {status}")
        return message
        
    except Exception as e:
        logger.error(f"Failed to update message status: {str(e)}")
        db.rollback()
        raise

def get_conversations(db: Session, limit: int = 20) -> list[dict]:
    """Get list of recent conversations with last message preview."""
    from sqlalchemy import func
    
    # Get the latest message for each conversation
    latest_messages = (
        db.query(
            ChatMessage.conversation_id,
            func.max(ChatMessage.created_at).label("last_message_at")
        )
        .group_by(ChatMessage.conversation_id)
        .order_by(desc("last_message_at"))
        .limit(limit)
        .subquery()
    )
    
    # Join with messages to get the actual message content
    conversations = (
        db.query(
            ChatMessage,
            func.count(ChatMessage.id).label("message_count"),
            func.count(case((ChatMessage.status == 'unread', 1))).label("unread_count")
        )
        .join(latest_messages, and_(
            ChatMessage.conversation_id == latest_messages.c.conversation_id,
            ChatMessage.created_at == latest_messages.c.last_message_at
        ))
        .join(Item)
        .group_by(ChatMessage.conversation_id, ChatMessage.id, Item.id)
        .order_by(desc(ChatMessage.created_at))
        .all()
    )
    
    return [
        {
            "conversation_id": conv.ChatMessage.conversation_id,
            "last_message": {
                "id": conv.ChatMessage.id,
                "message": conv.ChatMessage.message,
                "is_user": conv.ChatMessage.is_user,
                "status": conv.ChatMessage.status,
                "created_at": conv.ChatMessage.created_at
            },
            "message_count": conv.message_count,
            "unread_count": conv.unread_count
        }
        for conv in conversations
    ]


def update_chat_message(db: Session, message_id: int, payload: ChatMessageCreate) -> Optional[ChatMessage]:
    message = db.query(ChatMessage).options(joinedload(ChatMessage.item)).filter(ChatMessage.id == message_id).first()
    if not message:
        return None
    message.message = payload.message
    message.item.content = payload.message
    message.item.title = f"Chat message: {payload.message[:50]}..."
    db.commit()
    db.refresh(message)
    return message


def delete_chat_message(db: Session, message_id: int) -> bool:
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        return False
    # delete the parent Item to cascade delete ChatMessage
    item = db.query(Item).filter(Item.id == message.item_id).first()
    if item:
        db.delete(item)
    else:
        db.delete(message)
    db.commit()
    return True
