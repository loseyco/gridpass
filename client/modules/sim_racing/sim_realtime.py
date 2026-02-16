import asyncio
import threading
import logging
import queue
import time
from supabase import create_async_client

logger = logging.getLogger(__name__)

class RealtimeManager:
    def __init__(self, supabase_url, supabase_key, device_id):
        self.url = supabase_url
        self.key = supabase_key
        self.device_id = device_id
        self.input_queue = queue.Queue() # Thread-safe queue
        self.running = False
        self.thread = None
        self.connected = False

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self.thread.start()
        logger.info("RealtimeManager thread started")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)

    def broadcast(self, data):
        """Queue data to be broadcasted"""
        if self.connected: 
            # Drop old data if queue is full to ensure freshness
            if self.input_queue.qsize() > 5:
                try:
                    self.input_queue.get_nowait()
                except queue.Empty:
                    pass
            self.input_queue.put(data)

    def _run_event_loop(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._async_main())
        loop.close()

    async def _async_main(self):
        retry_delay = 1
        client = None
        
        while self.running:
            try:
                if not client:
                    logger.info("Connecting to Realtime...")
                    client = await create_async_client(self.url, self.key)
                    channel = client.channel(f'device-{self.device_id}')
                    await channel.subscribe()
                    self.connected = True
                    logger.info("Realtime Connected!")
                    retry_delay = 1

                # Process Queue
                while self.running and self.connected:
                    try:
                        # Non-blocking check
                        if not self.input_queue.empty():
                            data = self.input_queue.get_nowait()
                            await channel.send_broadcast("telemetry", data)
                        else:
                            await asyncio.sleep(0.016) # ~60Hz poll
                    except Exception as e:
                        logger.error(f"Broadcast error: {e}")
                        self.connected = False
                        client = None # Force reconnect
                        break
            except Exception as e:
                logger.error(f"Realtime connection error: {e}")
                self.connected = False
                client = None
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 30)

        logger.info("Realtime loop ended")
