"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useSession, signOut } from "~/lib/auth-client";
import { useUserRole } from "~/hooks/use-user-role";
import { FeedbackModal } from "~/components/feedback/feedback-modal";
import {
  getAccountDetailsAction,
  getCurrentUserAccountId,
} from "~/app/actions/account-settings";
import { AccountSetupRedirect } from "~/components/auth/account-setup-redirect";
import { InactiveUserBanner } from "~/components/auth/inactive-user-banner";
import OnboardingModal from "~/components/onboarding/onboarding-modal";
import { Toaster } from "sonner";
import { TokenTrackerRing } from "~/components/layout/token-tracker-ring";
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Briefcase,
  ChevronDown,
  Search,
  TrendingUp,
  HandHeart,
  Coins,
  MessageCircle,
  UserCog,
  CheckSquare,
} from "lucide-react";
import type { FC, ReactNode } from "react";

// CSS for line drawing animation
const lineDrawingStyles = `
  @keyframes drawLine {
    from {
      height: 0%;
    }
    to {
      height: 100%;
    }
  }
`;

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const baseNavigation: NavigationItem[] = [
  { name: "Resumen", href: "/operaciones", icon: BarChart3 },
  { name: "Propiedades", href: "/propiedades", icon: Building2 },
  { name: "Contactos", href: "/contactos", icon: Users },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Tareas", href: "/tareas", icon: CheckSquare },
  { name: "Agentes", href: "/agents", icon: UserCog },
  { name: "Contabilidad", href: "/contabilidad", icon: Coins, disabled: true },
];

const operacionesItems: NavigationItem[] = [
  { name: "Cruces", href: "/operaciones/prospects", icon: Search },
  {
    name: "Conexiones",
    href: "/operaciones/leads",
    icon: TrendingUp,
    disabled: false,
  },
  {
    name: "Acuerdos",
    href: "/operaciones/deals",
    icon: HandHeart,
    disabled: false,
  },
];

const adminNavigation: NavigationItem[] = [
  { name: "Administración", href: "/admin", icon: Shield },
];

const accountAdminNavigation: NavigationItem[] = [
  { name: "Administración", href: "/account-admin", icon: Shield },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [operacionesExpanded, setOperacionesExpanded] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { hasRoleId, userRoles, roles, loading: roleLoading } = useUserRole();

  // Check if current page is image-studio
  const isImageStudioPage = pathname.includes("image-studio");

  // Debug: Log pathname and image-studio detection
  useEffect(() => {
    console.log("Current pathname:", pathname);
    console.log("Is image-studio page:", isImageStudioPage);
  }, [pathname, isImageStudioPage]);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("=== Role Debug Info ===");
    console.log("Session user ID:", session?.user?.id);
    console.log("Roles (string array):", roles);
    console.log("User roles (legacy number array):", userRoles);
    console.log("Has role ID 2:", hasRoleId(2));
    console.log("Has role ID 3:", hasRoleId(3));
    console.log("Role loading state:", roleLoading);
    console.log("=======================");
  }, [session, roles, userRoles, roleLoading, hasRoleId]);

  // Build navigation based on user role
  const navigation = [...baseNavigation];
  if (hasRoleId(2)) {
    console.log("Adding admin navigation for role ID 2");
    navigation.push(...adminNavigation);
  }
  // Add account admin navigation for role ID 3
  if (hasRoleId(3)) {
    console.log("Adding account-admin navigation for role ID 3");
    navigation.push(...accountAdminNavigation);
  }

  // Auto-expand operaciones when on operaciones pages
  useEffect(() => {
    if (pathname.startsWith("/operaciones")) {
      setOperacionesExpanded(true);
    }
  }, [pathname]);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user?.id || onboardingChecked) return;

      try {
        console.log("🔍 Checking onboarding status for user...");

        // Check sessionStorage first to avoid unnecessary API calls
        const cachedStatus = sessionStorage.getItem("onboarding_completed");
        if (cachedStatus === "true") {
          console.log("✅ Onboarding already completed (from cache)");
          setOnboardingChecked(true);
          return;
        }

        // Fetch accountId from user
        const accountId = await getCurrentUserAccountId(session.user.id);
        if (!accountId) {
          console.log("❌ No account ID found");
          return;
        }

        const details = await getAccountDetailsAction(accountId);
        if (!details.success || !details.data) {
          console.log("❌ Failed to fetch account details");
          return;
        }

        const onboardingData = details.data.onboardingData;
        const completed =
          onboardingData &&
          typeof onboardingData === "object" &&
          "completed" in onboardingData
            ? Boolean(onboardingData.completed)
            : false;

        console.log("📋 Onboarding status:", {
          accountId: accountId.toString(),
          completed,
          onboardingData,
        });

        // Cache the result in sessionStorage
        sessionStorage.setItem("onboarding_completed", completed.toString());

        if (!completed) {
          console.log("🎯 Showing onboarding modal");
          setShowOnboarding(true);
        }

        setOnboardingChecked(true);
      } catch (error) {
        console.error("❌ Error checking onboarding status:", error);
        setOnboardingChecked(true);
      }
    };

    void checkOnboarding();
  }, [session, onboardingChecked]);

  // Fetch account logo
  useEffect(() => {
    const fetchAccountLogo = async () => {
      if (!session?.user?.id) return;

      try {
        const userAccountId = await getCurrentUserAccountId(session.user.id);
        if (!userAccountId) return;

        const result = await getAccountDetailsAction(userAccountId);
        if (result.success && result.data?.logo) {
          setAccountLogo(result.data.logo);
        }
      } catch (error) {
        console.error("Error fetching account logo:", error);
      }
    };

    void fetchAccountLogo();
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    // Clear onboarding cache on logout
    sessionStorage.removeItem("onboarding_completed");
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Account Setup Redirect Component */}
      <AccountSetupRedirect />
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-60 flex-col overflow-visible bg-white">
          <div className="mt-6 flex h-16 items-center justify-between px-4">
            <div className="relative flex h-16 w-40 items-center justify-center">
              <Image
                src={accountLogo ?? "/vestazoomin.jpeg"}
                alt="Vesta CRM Logo"
                fill
                className="object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 overflow-visible px-2 py-4">
            {navigation
              .filter((item) => !item.href.includes("admin"))
              .slice(0, 3)
              .map((item) => {
                const isActive = pathname === item.href;
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="group flex cursor-not-allowed items-center rounded-md px-2 py-2 text-sm font-medium text-gray-400 opacity-50"
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}

            {/* Operaciones Section - Mobile */}
            <div className="space-y-1">
              <div className="flex items-center">
                <button
                  onClick={() => setOperacionesExpanded(!operacionesExpanded)}
                  className="group flex flex-1 items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Briefcase className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  Operaciones
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 text-gray-400 transition-transform",
                      operacionesExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {operacionesExpanded && (
                <>
                  <style>{lineDrawingStyles}</style>
                  <div className="relative ml-8 space-y-0.5">
                    {/* Vertical line with draw animation */}
                    <div
                      className="absolute bottom-0 left-0 top-0 -ml-4 w-px bg-gray-300"
                      style={{
                        height: "0%",
                        animation: "drawLine 0.8s ease-out 0.6s forwards",
                      }}
                    />
                    {operacionesItems.map((subItem, index) => {
                      const isActive = pathname === subItem.href;
                      const animationDelay = `${index * 200}ms`;

                      if (subItem.disabled) {
                        return (
                          <div
                            key={subItem.name}
                            className="animate-in slide-in-from-left-2 fade-in group flex cursor-not-allowed items-center rounded-md px-2 py-1.5 text-xs font-normal text-gray-400 opacity-50 duration-300"
                            style={{ animationDelay }}
                          >
                            <subItem.icon className="mr-2.5 h-3.5 w-3.5 flex-shrink-0" />
                            {subItem.name}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "animate-in slide-in-from-left-2 fade-in group flex items-center rounded-md px-2 py-1.5 text-xs font-normal duration-300",
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          )}
                          style={{ animationDelay }}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <subItem.icon
                            className={cn(
                              "mr-2.5 h-3.5 w-3.5 flex-shrink-0",
                              isActive
                                ? "text-gray-500"
                                : "text-gray-400 group-hover:text-gray-500",
                            )}
                          />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Remaining non-admin items */}
            {navigation
              .filter((item) => !item.href.includes("admin"))
              .slice(3)
              .map((item) => {
                const isActive = pathname === item.href;
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="group flex cursor-not-allowed items-center rounded-md px-2 py-2 text-sm font-medium text-gray-400 opacity-50"
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}

            {/* Admin buttons at the end */}
            {navigation
              .filter((item) => item.href.includes("admin"))
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* Token Tracker Ring - Mobile (only on image-studio pages) */}
          {isImageStudioPage && (
            <div className="overflow-visible px-4 pb-4">
              <TokenTrackerRing />
            </div>
          )}

          {/* Mobile Feedback button */}
          <div className="px-2 pb-2">
            <Button
              onClick={() => setFeedbackModalOpen(true)}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar feedback
            </Button>
          </div>

          {/* Mobile User profile section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {isMounted ? (session?.user?.name ?? "Usuario") : "Usuario"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {isMounted ? session?.user?.email : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-visible border-r border-gray-200 bg-white">
          <div className="mt-4 flex h-16 items-center px-4">
            <div className="relative flex h-16 w-40 items-center justify-center">
              <Image
                src={accountLogo ?? "/vestazoomin.jpeg"}
                alt="Vesta CRM Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-visible px-2 py-4">
            {navigation
              .filter((item) => !item.href.includes("admin"))
              .slice(0, 3)
              .map((item) => {
                const isActive = pathname === item.href;
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="group flex cursor-not-allowed items-center rounded-md px-2 py-2 text-sm font-medium text-gray-400 opacity-50"
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}

            {/* Operaciones Section - Desktop */}
            <div className="space-y-1">
              <div className="flex items-center">
                <button
                  onClick={() => setOperacionesExpanded(!operacionesExpanded)}
                  className="group flex flex-1 items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Briefcase className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  Operaciones
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 text-gray-400 transition-transform",
                      operacionesExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {operacionesExpanded && (
                <div className="relative ml-8 space-y-0.5">
                  {/* Vertical line with draw animation */}
                  <div
                    className="absolute bottom-0 left-0 top-0 -ml-4 w-px bg-gray-300"
                    style={{
                      height: "0%",
                      animation: "drawLine 0.8s ease-out 0.6s forwards",
                    }}
                  />
                  {operacionesItems.map((subItem, index) => {
                    const isActive = pathname === subItem.href;
                    const animationDelay = `${index * 200}ms`;

                    if (subItem.disabled) {
                      return (
                        <div
                          key={subItem.name}
                          className="animate-in slide-in-from-left-2 fade-in group flex cursor-not-allowed items-center rounded-md px-2 py-1.5 text-xs font-normal text-gray-400 opacity-50 duration-300"
                          style={{ animationDelay }}
                        >
                          <subItem.icon className="mr-2.5 h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1">{subItem.name}</span>
                          <span className="text-[9px] text-gray-400">
                            (próximamente)
                          </span>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "animate-in slide-in-from-left-2 fade-in group flex items-center rounded-md px-2 py-1.5 text-xs font-normal duration-300",
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                        style={{ animationDelay }}
                      >
                        <subItem.icon
                          className={cn(
                            "mr-2.5 h-3.5 w-3.5 flex-shrink-0",
                            isActive
                              ? "text-gray-500"
                              : "text-gray-400 group-hover:text-gray-500",
                          )}
                        />
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {navigation
              .filter((item) => !item.href.includes("admin"))
              .slice(3)
              .map((item) => {
                const isActive = pathname === item.href;
                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className="group flex cursor-not-allowed items-center rounded-md px-2 py-2 text-sm font-medium text-gray-400 opacity-50"
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}

            {/* Admin buttons at the end */}
            {navigation
              .filter((item) => item.href.includes("admin"))
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* Token Tracker Ring - Desktop (only on image-studio pages) */}
          {isImageStudioPage && (
            <div className="overflow-visible px-4 pb-4">
              <TokenTrackerRing />
            </div>
          )}

          {/* Desktop Feedback button */}
          <div className="px-2 pb-2">
            <Button
              onClick={() => setFeedbackModalOpen(true)}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar feedback
            </Button>
          </div>

          {/* Desktop User profile section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {isMounted ? (session?.user?.name ?? "Usuario") : "Usuario"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {isMounted ? session?.user?.email : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-60">
        <div className="sticky top-0 flex h-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Show banner if user has role_id = 5 (Inactive) */}
            {hasRoleId(5) && <InactiveUserBanner />}
            {children}
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => {
          console.log("✅ Onboarding completed, closing modal");
          // Update sessionStorage to mark as completed
          sessionStorage.setItem("onboarding_completed", "true");
          setShowOnboarding(false);
        }}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
};
