"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import io from "socket.io-client";

const SocketIoContext = createContext(null);

// const SOCKET_URL = "http://localhost:4000";
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL; 

const generateUniqueDeviceId = () => {
  return `device-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
};

const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return null;

  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateUniqueDeviceId();
    localStorage.setItem('deviceId', deviceId);
    console.log("📱 Generated new device ID:", deviceId);
  } else {
    console.log("📱 Using existing device ID:", deviceId);
  }
  return deviceId;
};

export default function SocketIoProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [user, setUser] = useState(null); // 🔥 USER STATE ADDED

  const socketRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !deviceId) {
      const id = getOrCreateDeviceId();
      setDeviceId(id);
    }
  }, []);

  const clientId = user?._id || deviceId;

  useEffect(() => {
    if (isInitializedRef.current || !clientId || socketRef.current) {
      return;
    }

    console.log("🔍 Initializing socket connection...");
    console.log("Client ID:", clientId);

    let clientSocket = null;

    try {
      clientSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          deviceId: clientId, // ✅ send as `auth.deviceId`
          // token: yourTokenIfAvailable (optional)
        },
        extraHeaders: {
          "ngrok-skip-browser-warning": "true"
        },
        forceNew: false,
        autoConnect: true
      });

      socketRef.current = clientSocket;
      isInitializedRef.current = true;
      setSocket(clientSocket);

      clientSocket.on('connect', () => {
        console.log('🟢 SOCKET CONNECTED!', clientSocket.id);
        setIsConnected(true);
        setConnectionAttempts(0);
        setReconnecting(false);
      });

      clientSocket.on('connect_error', (error) => {
        console.error('🔴 CONNECTION ERROR:', error.message);
        setIsConnected(false);
        setConnectionAttempts(prev => prev + 1);
      });

      clientSocket.on('disconnect', (reason) => {
        console.log('🟡 DISCONNECTED:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          setTimeout(() => clientSocket.connect(), 1000);
        }
      });

      clientSocket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Reconnection attempt: ${attempt}`);
        setConnectionAttempts(attempt);
        setReconnecting(true);
      });

      clientSocket.on('reconnect', (attemptNumber) => {
        console.log(`🟢 RECONNECTED after ${attemptNumber} attempts`);
        setIsConnected(true);
        setReconnecting(false);
        setConnectionAttempts(0);
      });

      clientSocket.on('reconnect_failed', () => {
        console.error('🔴 RECONNECTION FAILED');
        setReconnecting(false);
      });

      clientSocket.on('message', (data) => {
        console.log('📩 Message:', data);
      });

      clientSocket.on('notification', (data) => {
        console.log('🔔 Notification:', data);
      });

    } catch (error) {
      console.error("❌ Socket creation failed:", error);
      isInitializedRef.current = false;
      socketRef.current = null;
    }

    return () => {
      if (clientSocket) {
        clientSocket.removeAllListeners();
        clientSocket.disconnect();
        socketRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [clientId]);

  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      socket.connect();
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
      return true;
    } else {
      console.warn('⚠️ Cannot send - socket not connected');
      return false;
    }
  }, [socket, isConnected]);

  const addEventListener = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => { };
  }, [socket]);

  const testConnection = useCallback(() => {
    if (socket && isConnected) {
      const testData = {
        message: 'Hello from client',
        timestamp: Date.now(),
        clientId
      };
      socket.emit('test', testData);
      return true;
    } else {
      return false;
    }
  }, [socket, isConnected, clientId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.debugSocket = {
        socket,
        isConnected,
        reconnecting,
        connectionAttempts,
        clientId,
        SOCKET_URL,
        sendMessage,
        reconnect,
        testConnection
      };
    }
  }, [socket, isConnected, reconnecting, connectionAttempts, clientId, sendMessage, reconnect, testConnection]);

  return (
    <SocketIoContext.Provider value={{
      socket,
      isConnected,
      reconnecting,
      connectionAttempts,
      deviceId,
      reconnect,
      sendMessage,
      addEventListener,
      testConnection,
      isInitialized: isInitializedRef.current,
      socketId: socket?.id || null,
      user,
      setUser // 🔥 Expose setter to set user when available
    }}>
      {children}
    </SocketIoContext.Provider>
  );
}

export const useSocketIo = () => {
  const context = useContext(SocketIoContext);
  if (!context) {
    throw new Error('useSocketIo must be used within SocketIoProvider');
  }
  return context;
};
