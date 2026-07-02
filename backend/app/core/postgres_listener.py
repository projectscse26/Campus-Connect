import asyncio
import asyncpg
import json
import logging
from typing import Optional

from app.core.config import get_settings
from app.api.audit_logs import manager

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
settings = get_settings()

class PostgresListener:
    def __init__(self):
        self.connection: Optional[asyncpg.Connection] = None
        self.is_listening = False
        # Derive asyncpg URL from SQLAlchemy URL if necessary
        # SQLAlchemy format: postgresql://user:pass@host:port/db
        # asyncpg format is compatible
        self.db_url = settings.DATABASE_URL
        
    async def connect(self):
        """Connect to Postgres and start listening."""
        if not self.db_url:
            logger.error("No DATABASE_URL set. Cannot start Postgres listener.")
            return

        while True:
            try:
                print("Connecting to Postgres for LISTEN/NOTIFY...")
                self.connection = await asyncpg.connect(self.db_url)
                
                # Add listener for the channel
                await self.connection.add_listener("audit_logs_channel", self._handle_notify)
                self.is_listening = True
                print("Successfully connected and listening to 'audit_logs_channel'")
                
                # Keep connection alive (if connection drops, asyncpg will raise an exception)
                while not self.connection.is_closed():
                    await asyncio.sleep(10)
                    
            except (asyncpg.PostgresError, OSError) as e:
                self.is_listening = False
                logger.warning(f"Postgres connection lost or failed to connect: {e}. Retrying in 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                self.is_listening = False
                logger.error(f"Unexpected error in Postgres listener: {e}")
                await asyncio.sleep(5)

    def _handle_notify(self, connection, pid, channel, payload):
        """Callback when a NOTIFY event is received."""
        try:
            data = json.loads(payload)
            # data represents the newly inserted audit_log row
            # Transform it to match the frontend expected format
            message = {
                "id": data.get("id"),
                "timestamp": data.get("timestamp"),
                "user_id": data.get("user_id"),
                "actor_name": data.get("actor_name"),
                "actor_email": data.get("actor_email"),
                "role": data.get("role"),
                "ip_address": data.get("ip_address"),
                "method": data.get("method"),
                "endpoint": data.get("endpoint"),
                "module": data.get("module"),
                "status_code": data.get("status_code"),
                "response_time_ms": data.get("response_time_ms"),
                "request_id": data.get("request_id"),
            }
            
            # Broadcast to all WebSockets connected to THIS fastAPI instance
            # We must schedule the async broadcast on the running event loop
            asyncio.create_task(manager.broadcast(message))
            
        except json.JSONDecodeError:
            logger.error(f"Failed to decode Postgres payload: {payload}")
        except Exception as e:
            logger.error(f"Error handling Postgres NOTIFY: {e}")

    async def close(self):
        """Close the connection."""
        self.is_listening = False
        if self.connection and not self.connection.is_closed():
            await self.connection.close()
            logger.info("Postgres listener closed.")

# Global instance
pg_listener = PostgresListener()
