'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useSessionTimeout(timeoutMinutes = 5) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isAuthPage = pathname.includes('/auth') || pathname.includes('/login');
    if (isAuthPage) return;

    const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const handleLogout = () => {
      clearTimers();
      
      // ✅ Check the role BEFORE removing the user
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      localStorage.removeItem('user');
      
      const locale = pathname.split('/')[1] === 'am' ? 'am' : 'en';
      
      // ✅ Show correct message and redirect to correct login
      if (isAdmin) {
        alert('Your admin session has expired due to 5 minutes of inactivity.');
        window.location.href = `/${locale}/admin/login`; 
      } else {
        alert('Your session has expired due to 5 minutes of inactivity.');
        window.location.href = `/${locale}/auth`; 
      }
    };

    const resetTimer = () => {
      clearTimers();
      setTimeLeft(timeoutMinutes * 60); 

      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(handleLogout, timeoutMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimers();
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router, pathname, timeoutMinutes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return { timeLeft, formattedTime: formatTime(timeLeft) };
}