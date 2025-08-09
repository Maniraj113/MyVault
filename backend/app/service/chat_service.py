"""Chat service for handling chat messages and conversations."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models import Item, ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageOut


def create_chat_message(db: Session, payload: ChatMessageCreate) -> ChatMessage:
    """Create a new chat message."""
    conversation_id = payload.conversation_id or str(uuid4())
    
    item = Item(
        kind="chat",
        title=f"Chat message: {payload.message[:50]}...",
        content=payload.message
    )
    db.add(item)
    db.flush()
    
    chat_message = ChatMessage(
        item_id=item.id,
        message=payload.message,
        is_user=True,
        conversation_id=conversation_id
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message


def get_chat_messages(
    db: Session,
    conversation_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> list[ChatMessage]:
    """Get chat messages, optionally filtered by conversation."""
    query = db.query(ChatMessage).join(Item)
    
    if conversation_id:
        query = query.filter(ChatMessage.conversation_id == conversation_id)
    
    return query.order_by(desc(Item.created_at)).offset(offset).limit(limit).all()


def get_conversations(db: Session, limit: int = 20) -> list[dict]:
    """Get list of recent conversations."""
    from sqlalchemy import func
    
    conversations = (
        db.query(
            ChatMessage.conversation_id,
            func.max(Item.created_at).label("last_message_at"),
            func.count(ChatMessage.id).label("message_count")
        )
        .join(Item)
        .filter(ChatMessage.conversation_id.isnot(None))
        .group_by(ChatMessage.conversation_id)
        .order_by(desc("last_message_at"))
        .limit(limit)
        .all()
    )
    
    return [
        {
            "conversation_id": conv.conversation_id,
            "last_message_at": conv.last_message_at,
            "message_count": conv.message_count
        }
        for conv in conversations
    ]
