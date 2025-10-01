import { NextRequest } from 'next/server';
import { addClient, removeClient } from '../votes/route';

// Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Function to send data to this client
      const sendData = (data: string) => {
        if (!isActive) return;
        
        const message = `data: ${data}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          // Client disconnected
          isActive = false;
          removeClient(sendData);
        }
      };

      // Add this client to the list
      addClient(sendData);

      // Keep connection alive with heartbeat (every 15 seconds)
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch (error) {
          isActive = false;
          clearInterval(heartbeatInterval);
          removeClient(sendData);
        }
      }, 15000); // Reduced from 30s to 15s

      // Cleanup on disconnect
      const cleanup = () => {
        isActive = false;
        clearInterval(heartbeatInterval);
        removeClient(sendData);
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      };

      request.signal.addEventListener('abort', cleanup);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

