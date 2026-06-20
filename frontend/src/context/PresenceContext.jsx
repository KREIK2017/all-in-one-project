import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const PresenceContext = createContext();

// baseURL = http://localhost:3001/api  ->  http://localhost:3001
const SOCKET_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState({}); // { [userId]: status }
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatuses({});
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('presence:update', ({ userId, status }) => {
      setStatuses((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Ручна зміна власного статусу — через сокет (сервер збереже + розішле)
  const setStatus = useCallback(
    (status) => {
      socketRef.current?.emit('presence:set', status);
      if (user) setStatuses((prev) => ({ ...prev, [user.id]: status })); // оптимістично
    },
    [user]
  );

  return <PresenceContext.Provider value={{ statuses, setStatus }}>{children}</PresenceContext.Provider>;
};

export const usePresence = () => useContext(PresenceContext);
