import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";

interface UpcomingPayment {
  id: string;
  amount: number;
  due_date: string;
  property_id: string | null;
  property?: {
    title: string;
    location: string;
  };
}

export const usePaymentReminders = () => {
  const { user } = useAuth();
  const hasShownReminders = useRef(false);
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request push notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      notificationPermission.current = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      notificationPermission.current = permission;
      return permission === "granted";
    }

    return false;
  }, []);

  // Show browser push notification
  const showPushNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if (notificationPermission.current === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: "payment-reminder",
        requireInteraction: true,
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    }
  }, []);

  // Check for upcoming payments and show reminders
  const checkUpcomingPayments = useCallback(async () => {
    if (!user || hasShownReminders.current) return;

    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data: payments, error } = await supabase
        .from("rental_payments")
        .select(`
          id,
          amount,
          due_date,
          property_id,
          properties:property_id (
            title,
            location
          )
        `)
        .eq("tenant_id", user.id)
        .eq("status", "pending")
        .gte("due_date", today.toISOString().split("T")[0])
        .lte("due_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .order("due_date", { ascending: true });

      if (error) throw error;

      if (payments && payments.length > 0) {
        hasShownReminders.current = true;
        
        // Group payments by urgency
        const urgentPayments: UpcomingPayment[] = [];
        const upcomingPayments: UpcomingPayment[] = [];

        payments.forEach((payment) => {
          const daysUntilDue = differenceInDays(new Date(payment.due_date), today);
          const typedPayment = {
            ...payment,
            property: payment.properties as { title: string; location: string } | undefined,
          };

          if (daysUntilDue <= 3) {
            urgentPayments.push(typedPayment);
          } else if (daysUntilDue <= 7) {
            upcomingPayments.push(typedPayment);
          }
        });

        // Show urgent payment notifications (due in 3 days or less)
        urgentPayments.forEach((payment) => {
          const daysUntilDue = differenceInDays(new Date(payment.due_date), today);
          const dueText = daysUntilDue === 0 ? "today" : daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;
          const propertyName = payment.property?.title || "your property";

          // In-app toast notification
          toast.warning(`Payment Due ${dueText}!`, {
            description: `GHS ${payment.amount.toLocaleString()} for ${propertyName}`,
            duration: 10000,
            action: {
              label: "View",
              onClick: () => window.location.href = "/profile?tab=billing",
            },
          });

          // Push notification
          showPushNotification(
            `⚠️ Payment Due ${dueText}!`,
            `GHS ${payment.amount.toLocaleString()} for ${propertyName} is due ${format(new Date(payment.due_date), "MMM d, yyyy")}`,
            () => window.location.href = "/profile?tab=billing"
          );
        });

        // Show summary for upcoming payments (due in 4-7 days)
        if (upcomingPayments.length > 0) {
          const totalAmount = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);
          
          setTimeout(() => {
            toast.info(`${upcomingPayments.length} Upcoming Payment${upcomingPayments.length > 1 ? "s" : ""}`, {
              description: `Total: GHS ${totalAmount.toLocaleString()} due this week`,
              duration: 8000,
              action: {
                label: "View All",
                onClick: () => window.location.href = "/profile?tab=billing",
              },
            });
          }, 2000); // Delay to not overlap with urgent notifications
        }

        // Show general reminder for payments due in 7-30 days
        const futurePayments = payments.filter((p) => {
          const days = differenceInDays(new Date(p.due_date), today);
          return days > 7 && days <= 30;
        });

        if (futurePayments.length > 0 && urgentPayments.length === 0 && upcomingPayments.length === 0) {
          const nextPayment = futurePayments[0];
          const daysUntilDue = differenceInDays(new Date(nextPayment.due_date), today);
          
          toast.info(`Next Payment in ${daysUntilDue} days`, {
            description: `GHS ${nextPayment.amount.toLocaleString()} due ${format(new Date(nextPayment.due_date), "MMM d, yyyy")}`,
            duration: 6000,
          });
        }
      }
    } catch (error) {
      console.error("Error checking upcoming payments:", error);
    }
  }, [user, showPushNotification]);

  // Enable payment reminders
  const enableReminders = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success("Payment reminders enabled!", {
        description: "You'll receive notifications for upcoming payments",
      });
      // Store preference
      localStorage.setItem("paymentRemindersEnabled", "true");
    } else {
      toast.info("In-app reminders enabled", {
        description: "Enable browser notifications for push alerts",
      });
    }
    return granted;
  }, [requestNotificationPermission]);

  // Disable payment reminders
  const disableReminders = useCallback(() => {
    localStorage.setItem("paymentRemindersEnabled", "false");
    toast.info("Payment reminders disabled");
  }, []);

  // Check if reminders are enabled
  const isRemindersEnabled = useCallback(() => {
    return localStorage.getItem("paymentRemindersEnabled") !== "false";
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount if previously enabled
    if (isRemindersEnabled()) {
      requestNotificationPermission();
    }

    // Check for upcoming payments on initial load
    const timeoutId = setTimeout(() => {
      if (isRemindersEnabled()) {
        checkUpcomingPayments();
      }
    }, 3000); // Delay to let the page load first

    return () => clearTimeout(timeoutId);
  }, [user, checkUpcomingPayments, isRemindersEnabled, requestNotificationPermission]);

  return {
    enableReminders,
    disableReminders,
    isRemindersEnabled,
    checkUpcomingPayments,
    requestNotificationPermission,
  };
};
