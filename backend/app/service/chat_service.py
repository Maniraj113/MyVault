"""Chat service refactored to Firestore."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from google.cloud.firestore import Client, DocumentReference, FieldFilter
from google.api_core.exceptions import FailedPrecondition

from ..schemas import ChatMessageCreate

logger = logging.getLogger("myvault.chat_service")


def create_chat_message(db: Client, payload: ChatMessageCreate) -> dict:
    now = datetime.now(timezone.utc)
    item_ref = db.collection("items").document()
    msg_ref = db.collection("chat_messages").document()
    
    # Create item document
    item_doc = {
        "id": item_ref.id,
        "kind": "chat",
        "title": f"Chat message: {payload.message[:50]}...",
        "content": payload.message,
        "created_at": now,
        "updated_at": now,
    }
    
    # Create chat message document
    chat_doc = {
        "id": msg_ref.id,
        "item_id": item_ref.id,
        "message": payload.message,
        "is_user": True,
        "conversation_id": payload.conversation_id,
        "status": "sent",
        "created_at": now,
        "updated_at": now,
    }
    
    # Write both documents
    batch = db.batch()
    batch.set(item_ref, item_doc)
    batch.set(msg_ref, chat_doc)
    batch.commit()
    
    # Return chat message with embedded item
    result = chat_doc.copy()
    result["item"] = item_doc
    return result


def get_chat_messages(db: Client, conversation_id: Optional[str] = None, limit: int = 50, offset: int = 0) -> list[dict]:
    logger.info(f"Getting chat messages: conversation_id={conversation_id}, limit={limit}, offset={offset}")
    
    try:
        q = db.collection("chat_messages")
        if conversation_id:
            q = q.where(filter=FieldFilter("conversation_id", "==", conversation_id))
        
        try:
            q = q.order_by("created_at", direction="DESCENDING")
            messages = [d.to_dict() for d in q.offset(offset).limit(limit).stream()]
        except FailedPrecondition:
            # Fallback without ordering if index missing
            messages = [d.to_dict() for d in q.offset(offset).limit(limit).stream()]
        
        logger.info(f"Found {len(messages)} chat messages")
        
        # Hydrate each message with its item
        for msg in messages:
            try:
                item_id = msg.get("item_id")
                logger.info(f"Message {msg.get('id')} has item_id: {item_id}")
                if item_id:
                    item_snap = db.collection("items").document(item_id).get()
                    if item_snap.exists:
                        item_data = item_snap.to_dict()
                        msg["item"] = item_data
                        logger.info(f"Attached item to message {msg.get('id')}: {item_data.get('title')}")
                    else:
                        logger.warning(f"Item {item_id} not found for message {msg.get('id')}")
                        # Create a fallback item to prevent frontend crash
                        msg["item"] = {
                            "id": item_id or msg.get("id"),
                            "kind": "chat",
                            "title": "Chat message",
                            "content": msg.get("message", ""),
                            "created_at": msg.get("created_at"),
                            "updated_at": msg.get("updated_at")
                        }
                else:
                    logger.warning(f"Message {msg.get('id')} has no item_id")
                    # Create a fallback item to prevent frontend crash
                    msg["item"] = {
                        "id": msg.get("id"),
                        "kind": "chat",
                        "title": "Chat message",
                        "content": msg.get("message", ""),
                        "created_at": msg.get("created_at"),
                        "updated_at": msg.get("updated_at")
                    }
            except Exception as e:
                logger.error(f"Error hydrating item for message {msg.get('id')}: {str(e)}")
                # Create a fallback item to prevent frontend crash
                msg["item"] = {
                    "id": msg.get("id"),
                    "kind": "chat",
                    "title": "Chat message",
                    "content": msg.get("message", ""),
                    "created_at": msg.get("created_at"),
                    "updated_at": msg.get("updated_at")
                }
        
        logger.info(f"Returning {len(messages)} messages with items")
        return messages
        
    except Exception as e:
        logger.error(f"Error in get_chat_messages: {str(e)}", exc_info=True)
        # Return empty list instead of crashing
        return []


def update_message_status(db: Client, message_id: str, status: str) -> Optional[dict]:
    ref = db.collection("chat_messages").document(str(message_id))
    if not ref.get().exists:
        return None
    
    updates = {"status": status, "updated_at": datetime.now(timezone.utc)}
    if status == "delivered":
        updates["delivered_at"] = datetime.now(timezone.utc)
    elif status == "read":
        updates["read_at"] = datetime.now(timezone.utc)
    
    ref.set(updates, merge=True)
    return ref.get().to_dict()


def get_conversations(db: Client, limit: int = 20) -> list[dict]:
    # Get latest message per conversation
    q = db.collection("chat_messages").order_by("created_at", direction="DESCENDING").limit(1000)
    messages = [d.to_dict() for d in q.stream()]
    
    latest: dict[str, dict] = {}
    counts: dict[str, int] = {}
    unread: dict[str, int] = {}
    
    for m in messages:
        cid = m.get("conversation_id")
        counts[cid] = counts.get(cid, 0) + 1
        unread[cid] = unread.get(cid, 0) + (1 if m.get("status") == "unread" else 0)
        if cid not in latest:
            latest[cid] = m
    
    items = sorted(latest.values(), key=lambda x: x.get("created_at"), reverse=True)[:limit]
    return [
        {
            "conversation_id": it.get("conversation_id"),
            "last_message": {
                "id": it.get("id"),
                "message": it.get("message"),
                "is_user": it.get("is_user"),
                "status": it.get("status"),
                "created_at": it.get("created_at"),
            },
            "message_count": counts.get(it.get("conversation_id"), 0),
            "unread_count": unread.get(it.get("conversation_id"), 0),
        }
        for it in items
    ]


def update_chat_message(db: Client, message_id: str, payload: ChatMessageCreate) -> Optional[dict]:
    ref = db.collection("chat_messages").document(str(message_id))
    if not ref.get().exists:
        return None
    
    updates = {
        "message": payload.message,
        "updated_at": datetime.now(timezone.utc),
    }
    ref.set(updates, merge=True)
    return ref.get().to_dict()


def delete_chat_message(db: Client, message_id: str) -> bool:
    ref = db.collection("chat_messages").document(str(message_id))
    if not ref.get().exists:
        return False
    ref.delete()
    return True
