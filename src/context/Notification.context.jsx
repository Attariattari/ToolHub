"use client";
import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useSocketIo } from './SocketIoContext';
import Api from '@/utils/Api';


const NotificationContext = createContext();

// Action types
const NOTIFICATION_ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_DROPDOWN_NOTIFICATIONS: 'SET_DROPDOWN_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  notifications: [],
  dropdownNotifications: [],
  unreadCount: 0,
  totalNotifications: 0,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 1,
    totalItems: 0
  }
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications || [],
        pagination: action.payload.pagination || state.pagination,
        unreadCount: action.payload.unreadCount || 0,
        totalNotifications: action.payload.totalNotifications || 0,
        loading: false,
        error: null
      };

    case NOTIFICATION_ACTIONS.SET_DROPDOWN_NOTIFICATIONS:
      return {
        ...state,
        dropdownNotifications: action.payload.notifications || [],
        unreadCount: action.payload.unreadCount || 0,
        loading: false,
        error: null
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = action.payload;
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        dropdownNotifications: [newNotification, ...state.dropdownNotifications.slice(0, 4)],
        unreadCount: state.unreadCount + 1,
        totalNotifications: state.totalNotifications + 1
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      const notificationId = action.payload;
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        dropdownNotifications: state.dropdownNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        dropdownNotifications: state.dropdownNotifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    default:
      return state;
  }
}


export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { socket, isConnected, addEventListener } = useSocketIo();

  // Fetch dropdown notifications
  const fetchDropdownNotifications = useCallback(async () => {
    try {
      const response = await Api.get('/notifications/dropdown');
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_DROPDOWN_NOTIFICATIONS,
        payload: response.data.data
      });
    } catch (error) {
      console.error('Error fetching dropdown notifications:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message
      });
    }
  }, []);

  // Fetch all notifications for admin page
  const fetchAllNotifications = useCallback(async (page = 1, filter = 'all') => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });

      const response = await Api.get(`/notifications/all?page=${page}&filter=${filter}`);

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: response.data.data
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message
      });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await Api.patch(`/notifications/${notificationId}/read`);

      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_AS_READ,
        payload: notificationId
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message
      });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await Api.patch('/notifications/read-all');

      dispatch({
        type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: error.message
      });
    }
  }, []);

  // Listen for real-time notifications using your socket context
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔔 Setting up notification listener...');

    const handleNotification = (notification) => {
      console.log('🔔 New notification received:', notification);

      // Format the notification to match your frontend structure
      const formattedNotification = {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        time: 'Just now',
        isRead: false,
        read: false,
        icon: getIconForType(notification.type),
        color: getColorForType(notification.type).color,
        bgColor: getColorForType(notification.type).bgColor,
        data: notification.data
      };

      dispatch({
        type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
        payload: formattedNotification
      });

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    };

    // Use your socket context's addEventListener method
    const cleanup = addEventListener('notification', handleNotification);

    // Join admin room for receiving notifications
    if (socket && isConnected) {
      socket.emit('join', 'admin-room');
      console.log('🏠 Joined admin-room for notifications');
    }

    return cleanup;
  }, [socket, isConnected, addEventListener]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  // Helper functions
  const getIconForType = (type) => {
    const iconMap = {
      task_completed: 'CheckCheck',
      task_failed: 'AlertTriangle',
      system: 'Info',
      user: 'User',
      security: 'Shield',
      other: 'Bell'
    };
    return iconMap[type] || 'Bell';
  };

  const getColorForType = (type) => {
    const colorMap = {
      task_completed: { color: 'text-green-600', bgColor: 'bg-green-100' },
      task_failed: { color: 'text-red-600', bgColor: 'bg-red-100' },
      system: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
      user: { color: 'text-purple-600', bgColor: 'bg-purple-100' },
      security: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
      other: { color: 'text-gray-600', bgColor: 'bg-gray-100' }
    };
    return colorMap[type] || { color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const value = {
    // State
    notifications: state.notifications,
    dropdownNotifications: state.dropdownNotifications,
    unreadCount: state.unreadCount,
    totalNotifications: state.totalNotifications,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,

    // Actions
    fetchDropdownNotifications,
    fetchAllNotifications,
    markAsRead,
    markAllAsRead,

    // Socket connection status
    isConnected,

    // Dispatch for custom actions if needed
    dispatch
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};