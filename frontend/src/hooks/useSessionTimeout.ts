'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useSessionTimeout(timeoutMinutes = 2) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isAuthPage = pathname.includes('/auth') || pathname.includes('/login');
    if (isAuthPage) return;

    // Function to clear timers
    const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    // Function to logout
    const handleLogout = () => {
      clearTimers();
      localStorage.removeItem('user');
      alert('Your session has expired due to 2 minutes of inactivity.');
      window.location.href = pathname.split('/')[1] === 'am' ? '/am/auth' : '/en/auth';
    };

    // Reset the session timer
    const resetTimer = () => {
      clearTimers();
      setTimeLeft(timeoutMinutes * 60); // Reset display

      // Start the visible countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set the actual logout timeout
      timerRef.current = setTimeout(handleLogout, timeoutMinutes * 60 * 1000);
    };

    // Events to track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // We only reset on click or keypress (removed mousemove to prevent infinite loops)
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start timer on mount
    resetTimer();

    return () => {
      clearTimers();
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router, pathname, timeoutMinutes]);

  // Return the time left so we can display it in the Layout
  return { timeLeft };
}