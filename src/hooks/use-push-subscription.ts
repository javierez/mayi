"use client";

import { useState, useEffect, useCallback } from "react";
import { env } from "~/env";
import { checkEndpointSubscriptionAction } from "~/server/actions/push-subscription";

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface UsePushSubscriptionReturn {
  isSupported: boolean;
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkPermission: () => Promise<PushPermissionState>;
}

/**
 * Convert VAPID public key from base64 URL to Uint8Array
 * Required by the Push API
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}

/**
 * Custom hook for managing push notification subscriptions
 * Features:
 * - Browser support detection
 * - Permission state management
 * - Subscribe/unsubscribe functionality
 * - Automatic permission checking
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  console.log("[PushSubscription] 🎣 usePushSubscription hook initialized");
  
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check browser support and current permission state
  const checkSupport = useCallback(async () => {
    console.log("[PushSubscription] 🔍 Checking browser support...");
    
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      console.log("[PushSubscription] ❌ Browser does not support push notifications");
      setIsSupported(false);
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    console.log("[PushSubscription] ✅ Browser supports push notifications");
    setIsSupported(true);

    // Check current permission state
    try {
      const permissionResult = await navigator.permissions.query({
        name: "notifications" as PermissionName,
      });
      const permissionState = (permissionResult.state as PushPermissionState) || "default";
      console.log(`[PushSubscription] 📋 Notification permission state: ${permissionState}`);
      setPermission(permissionState);

      // Listen for permission changes
      permissionResult.onchange = () => {
        const newState = (permissionResult.state as PushPermissionState) || "default";
        console.log(`[PushSubscription] 🔄 Permission changed to: ${newState}`);
        setPermission(newState);
      };
    } catch {
      // Fallback for browsers that don't support permissions.query
      const fallbackPermission = Notification.permission;
      console.log(`[PushSubscription] 📋 Using fallback permission check: ${fallbackPermission}`);
      if (fallbackPermission === "granted") {
        setPermission("granted");
      } else if (fallbackPermission === "denied") {
        setPermission("denied");
      } else {
        setPermission("default");
      }
    }

    // Check if already subscribed locally
    try {
      console.log("[PushSubscription] 🔍 Checking local service worker subscription...");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log("[PushSubscription] ✅ Local subscription found:", {
          endpoint: subscription.endpoint.substring(0, 50) + "...",
        });
        
        // Verify with server that this endpoint is actually subscribed
        console.log("[PushSubscription] 🔍 Verifying subscription with server...");
        const serverCheck = await checkEndpointSubscriptionAction(subscription.endpoint);
        
        console.log("[PushSubscription] 📡 Server verification result:", {
          success: serverCheck.success,
          isSubscribed: serverCheck.isSubscribed,
          subscriptionId: serverCheck.subscriptionId?.toString(),
          error: serverCheck.error,
        });
        
        if (serverCheck.success && serverCheck.isSubscribed) {
          console.log("[PushSubscription] ✅ Subscription verified - user is subscribed");
          setIsSubscribed(true);
        } else {
          // Local subscription exists but not in server database
          // This can happen if the database was reset or subscription was deleted server-side
          console.log("[PushSubscription] ⚠️ Local subscription exists but not found on server. Treating as not subscribed.");
          setIsSubscribed(false);
        }
      } else {
        console.log("[PushSubscription] ℹ️ No local subscription found");
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("[PushSubscription] ❌ Error checking subscription:", err);
      setIsSubscribed(false);
    }

    setIsLoading(false);
    console.log("[PushSubscription] ✅ Support check complete");
  }, []);

  useEffect(() => {
    void checkSupport();
  }, [checkSupport]);

  // Check permission state
  const checkPermission = useCallback(async (): Promise<PushPermissionState> => {
    if (!isSupported) {
      return "unsupported";
    }

    try {
      const permissionResult = await navigator.permissions.query({
        name: "notifications" as PermissionName,
      });
      const state = (permissionResult.state as PushPermissionState) || "default";
      setPermission(state);
      return state;
    } catch {
      // Fallback
      const state =
        Notification.permission === "granted"
          ? "granted"
          : Notification.permission === "denied"
            ? "denied"
            : "default";
      setPermission(state);
      return state;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log("[PushSubscription] 🚀 Starting subscription process...");
    
    if (!isSupported) {
      console.log("[PushSubscription] ❌ Cannot subscribe: browser not supported");
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if VAPID public key is configured
      const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.log("[PushSubscription] ❌ VAPID public key not configured");
        setError("Push notifications are not configured on the server");
        setIsLoading(false);
        return false;
      }
      console.log("[PushSubscription] ✅ VAPID public key found");

      // Request notification permission
      console.log("[PushSubscription] 📋 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log(`[PushSubscription] 📋 Permission result: ${permission}`);
      
      if (permission !== "granted") {
        setPermission(permission as PushPermissionState);
        setError("Notification permission was denied");
        console.log("[PushSubscription] ❌ Permission denied");
        setIsLoading(false);
        return false;
      }

      setPermission("granted");
      console.log("[PushSubscription] ✅ Permission granted");

      // Register service worker if not already registered
      let registration: ServiceWorkerRegistration;
      try {
        console.log("[PushSubscription] 🔍 Checking service worker registration...");
        registration = await navigator.serviceWorker.ready;
        console.log("[PushSubscription] ✅ Service worker already ready");
      } catch {
        // Try to register if not ready
        console.log("[PushSubscription] 🔄 Registering service worker...");
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        console.log("[PushSubscription] ✅ Service worker registered");
      }

      // Subscribe to push notifications
      console.log("[PushSubscription] 🔔 Subscribing to push notifications...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log("[PushSubscription] ✅ Local subscription created:", {
        endpoint: subscription.endpoint.substring(0, 50) + "...",
      });

      // Send subscription to server
      console.log("[PushSubscription] 📤 Sending subscription to server...");
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(
                ...new Uint8Array(subscription.getKey("p256dh")!),
              ),
            ),
            auth: btoa(
              String.fromCharCode(
                ...new Uint8Array(subscription.getKey("auth")!),
              ),
            ),
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        console.log("[PushSubscription] ❌ Server subscription failed:", errorData);
        throw new Error(errorData.error ?? "Failed to save subscription");
      }

      console.log("[PushSubscription] ✅ Subscription saved to server successfully");
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to subscribe to push notifications";
      console.error("[PushSubscription] ❌ Subscription error:", err);
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    console.log("[PushSubscription] 🛑 Starting unsubscribe process...");
    
    if (!isSupported) {
      console.log("[PushSubscription] ❌ Cannot unsubscribe: browser not supported");
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[PushSubscription] 🔍 Checking for local subscription...");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log("[PushSubscription] ✅ Local subscription found:", {
          endpoint: subscription.endpoint.substring(0, 50) + "...",
        });
        
        // Check server to get subscription ID before unsubscribing
        console.log("[PushSubscription] 🔍 Checking server for subscription ID...");
        const serverCheck = await checkEndpointSubscriptionAction(subscription.endpoint);
        console.log("[PushSubscription] 📡 Server check result:", {
          success: serverCheck.success,
          isSubscribed: serverCheck.isSubscribed,
          subscriptionId: serverCheck.subscriptionId?.toString(),
        });
        
        // Unsubscribe from push service
        console.log("[PushSubscription] 🔓 Unsubscribing from push service...");
        await subscription.unsubscribe();
        console.log("[PushSubscription] ✅ Local unsubscribe successful");

        // Remove from server if we found the subscription ID
        if (serverCheck.success && serverCheck.isSubscribed && serverCheck.subscriptionId) {
          try {
            console.log("[PushSubscription] 🗑️ Removing subscription from server...");
            const response = await fetch("/api/push/unsubscribe", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscriptionId: serverCheck.subscriptionId.toString(),
              }),
            });

            if (!response.ok) {
              console.warn("[PushSubscription] ⚠️ Failed to remove subscription from server, but local unsubscribe succeeded");
            } else {
              console.log("[PushSubscription] ✅ Subscription removed from server");
            }
          } catch (err) {
            console.warn("[PushSubscription] ⚠️ Error removing subscription from server:", err);
          }
        } else {
          console.log("[PushSubscription] ℹ️ No server subscription found to remove (may have already been deleted)");
        }

        setIsSubscribed(false);
        setIsLoading(false);
        console.log("[PushSubscription] ✅ Unsubscribe complete");
        return true;
      }

      console.log("[PushSubscription] ℹ️ No local subscription found");
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to unsubscribe from push notifications";
      console.error("[PushSubscription] ❌ Unsubscribe error:", err);
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkPermission,
  };
}

