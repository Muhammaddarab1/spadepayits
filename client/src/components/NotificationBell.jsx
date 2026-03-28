import { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosInstance.js';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-primary transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden rounded-lg border bg-white shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2 bg-gray-50">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`border-b last:border-0 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium text-gray-900 truncate ${!n.isRead ? 'font-bold' : ''}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => { markRead(n._id); setOpen(false); }}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            VIEW
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n._id)}
                            className="text-[10px] text-green-600 hover:text-green-700 font-bold"
                          >
                            READ
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold"
                        >
                          REMOVE
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t px-4 py-2 bg-gray-50 text-center">
             <Link 
              to="/" 
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-primary font-medium"
             >
              View all on dashboard
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
