import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAlerts, Alert } from '../hooks/useAlerts';
import { useMedSchedule, Dose } from '../hooks/useMedSchedule';
import { requestNotificationPermission, showNotification } from '../services/notificationService';

export const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { alerts } = useAlerts(user?.uid);
  const { doses } = useMedSchedule(user?.uid);
  
  const lastAlertId = useRef<string | null>(null);
  const notifiedDoseIds = useRef<Set<string>>(new Set());

  // Request permission on mount
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Handle Alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[0];
      
      // If it's a new alert and it's critical or medium priority
      if (latestAlert.id !== lastAlertId.current && !latestAlert.read) {
        if (latestAlert.priority === 'critical' || latestAlert.priority === 'medium') {
          showNotification(`CareMate Alert: ${latestAlert.type.replace('_', ' ').toUpperCase()}`, {
            body: latestAlert.message,
            tag: latestAlert.id,
          });
        }
        lastAlertId.current = latestAlert.id;
      }
    }
  }, [alerts]);

  // Handle Medication Reminders
  useEffect(() => {
    const checkDoses = () => {
      const now = Date.now();
      
      doses.forEach((dose) => {
        if (dose.status !== 'pending') return;
        if (notifiedDoseIds.current.has(dose.id)) return;

        const scheduledTime = dose.scheduledAt?.toDate().getTime();
        if (!scheduledTime) return;

        // If dose is due within the next 1 minute or is currently due
        // and we haven't notified for it in this session
        const diff = scheduledTime - now;
        
        // Notify if it's due in less than 5 minutes (or already due)
        if (diff < 300000 && diff > -3600000) { // 5 mins before to 1 hour after
          showNotification(`Medication Reminder: ${dose.medName}`, {
            body: `It's time to take your dose of ${dose.medName}.`,
            tag: `dose-${dose.id}`,
            requireInteraction: true,
          });
          notifiedDoseIds.current.add(dose.id);
        }
      });
    };

    const interval = setInterval(checkDoses, 30000); // Check every 30 seconds
    checkDoses(); // Initial check

    return () => clearInterval(interval);
  }, [doses]);

  return null; // This component doesn't render anything
};
