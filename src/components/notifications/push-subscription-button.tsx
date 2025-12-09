"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { usePushSubscription } from "~/hooks/use-push-subscription";

/**
 * Button component for enabling/disabling push notifications
 * Shows current subscription status and handles permission requests
 */
export function PushSubscriptionButton() {
  console.log("[PushSubscription] 🎨 PushSubscriptionButton component rendered");
  
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const [isToggling, setIsToggling] = useState(false);

  console.log("[PushSubscription] 📊 Button state:", {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
  });

  // Don't show if not supported
  if (!isSupported) {
    console.log("[PushSubscription] ❌ Button hidden - not supported");
    return null;
  }

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      console.error("Error toggling push subscription:", err);
    } finally {
      setIsToggling(false);
    }
  };

  // Determine button state and tooltip message
  let tooltipMessage = "";
  let buttonVariant: "default" | "outline" | "ghost" = "ghost";
  let IconComponent = Bell;

  if (permission === "denied") {
    tooltipMessage =
      "Las notificaciones push están bloqueadas. Por favor, habilítalas en la configuración del navegador.";
    buttonVariant = "ghost";
    IconComponent = BellOff;
  } else if (isSubscribed) {
    tooltipMessage = "Desactivar notificaciones push";
    buttonVariant = "default";
    IconComponent = Bell;
  } else {
    tooltipMessage = "Activar notificaciones push";
    buttonVariant = "ghost";
    IconComponent = BellOff;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading || isToggling || permission === "denied"}
            className="h-7 w-7 p-0"
            aria-label={tooltipMessage}
          >
            {isLoading || isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconComponent className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltipMessage}</p>
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

