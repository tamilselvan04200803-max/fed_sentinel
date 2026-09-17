import { useEffect, useRef } from 'react';
import { useFedSentinelStore } from '../store/useFedSentinelStore';

export const useLiveEvents = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { settings, isDemoMode, setSystemStatus, addEvent } = useFedSentinelStore();
  const apiBaseUrl = settings.apiBaseUrl;

  useEffect(() => {
    // If in Demo Mode, disconnect real websocket
    if (isDemoMode) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setSystemStatus({ wsStatus: 'disconnected' });
      return;
    }

    const connectWs = () => {
      try {
        const wsUrl = apiBaseUrl.replace('http', 'ws').replace('/api', '') + '/ws/live';
        setSystemStatus({ wsStatus: 'connecting' });
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setSystemStatus({ wsStatus: 'connected' });
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            addEvent(parsed);
          } catch (e) {
            console.error('Failed to parse WS message', e);
          }
        };

        ws.onclose = () => {
          setSystemStatus({ wsStatus: 'disconnected' });
          // Exponential backoff reconnect could be added here
          reconnectTimeoutRef.current = setTimeout(() => {
            setSystemStatus({ wsStatus: 'reconnecting' });
            connectWs();
          }, 3000);
        };

        ws.onerror = () => {
          setSystemStatus({ wsStatus: 'error' });
          ws.close();
        };

      } catch (err) {
        setSystemStatus({ wsStatus: 'error' });
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [apiBaseUrl, isDemoMode, setSystemStatus, addEvent]);

  return {
    ws: wsRef.current,
  };
};
