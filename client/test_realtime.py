import asyncio
import json
import time
import config
from supabase import create_async_client, Client

async def main():
    print(f"Connecting to Supabase Realtime (Async)...")
    print(f"URL: {config.SUPABASE_URL}")
    
    try:
        supabase = await create_async_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        
        # Create channel
        channel = supabase.channel('room_1')
        
        # Subscribe
        print("Subscribing...")
        await channel.subscribe()
        print("Subscribed!")

        # Broadcast loop
        print("Broadcasting telemetry (Ctrl+C to stop)...")
        count = 0
        while True:
            # Simulated Telemetry
            payload = {
                "rpm": 4000 + (count * 100) % 3000,
                "speed": 100 + (count * 1) % 50,
                "gear": 4,
                "timestamp": time.time()
            }
            
            # Send broadcast
            # Use send_broadcast based on dir() inspection
            resp = await channel.send_broadcast("telemetry", payload)
            
            if count % 10 == 0:
                print(f"Sent packet #{count}: {payload['rpm']} RPM")
            
            count += 1
            await asyncio.sleep(0.05) # 20Hz
            
    except KeyboardInterrupt:
        print("Stopping...")
        try:
            await channel.unsubscribe()
        except:
            pass
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
