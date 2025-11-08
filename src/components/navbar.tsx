"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Building,
  Menu,
  X,
  Info,
  DollarSign,
  FileText,
  UserPlus,
  GraduationCap,
} from "lucide-react";
import { useState, useCallback, memo } from "react";
import { cn } from "~/lib/utils";
import { SocialLinks } from "~/components/ui/social-links";

// Types
type SocialPlatform =
  | "facebook"
  | "twitter"
  | "instagram"
  | "linkedin"
  | "youtube";

interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

interface NavbarProps {
  socialLinks?: SocialLink[];
}

// Memoized Social Links Section
const MobileSocialLinks = memo(({ links }: { links: SocialLink[] }) => (
  <div className="border-t bg-muted/50 backdrop-blur-sm">
    <div className="px-4 py-4">
      <div className="mb-3 text-xs font-medium text-muted-foreground">
        Síguenos en redes sociales
      </div>
      <SocialLinks links={links} />
    </div>
  </div>
));

MobileSocialLinks.displayName = "MobileSocialLinks";

// Main Component
export default function Navbar({
  socialLinks,
}: NavbarProps): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Memoized handlers
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleMenuClose();
      }
    },
    [handleMenuClose],
  );

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      onKeyDown={handleKeyPress}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left section - Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <Image
              src="/vestazoomin.jpeg"
              alt="Vesta Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Center section - Navigation */}
        <nav className="hidden gap-6 lg:flex" aria-label="Main navigation">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Inicio"
          >
            Inicio
          </Link>
          <Link
            href="/precios"
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Precios"
          >
            Precios
          </Link>
          <Link
            href="/empresa/nosotros"
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Nosotros"
          >
            Nosotros
          </Link>
          <Link
            href="/changelog"
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Novedades"
          >
            Novedades
          </Link>
          <Link
            href="/academia"
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Academia"
          >
            Academia
          </Link>
        </nav>

        {/* Right section - Auth Buttons, Social Links and Mobile Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {socialLinks && socialLinks.length > 0 && (
              <SocialLinks links={socialLinks} />
            )}
            <Link
              href="/auth/signin"
              className="text-sm font-medium transition-colors hover:text-primary"
              aria-label="Iniciar Sesión"
            >
              Iniciar Sesión
            </Link>
            <Button asChild size="sm" className="hidden lg:inline-flex">
              <Link href="/auth/signup" aria-label="Registrarse">
                Registrarse
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={handleMenuToggle}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-300 ease-in-out lg:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleMenuClose}
        aria-hidden={!isMenuOpen}
      />

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed right-0 top-16 h-[calc(100vh-4rem)] w-[280px] border-l bg-background shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out lg:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex h-full flex-col">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-4 py-6">
              {/* Auth Section */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Button asChild className="w-full" size="sm">
                    <Link href="/auth/signup" onClick={handleMenuClose}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Registrarse
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Link href="/auth/signin" onClick={handleMenuClose}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleMenuClose}
                >
                  <Building className="h-4 w-4" />
                  Inicio
                </Link>
                <Link
                  href="/precios"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleMenuClose}
                >
                  <DollarSign className="h-4 w-4" />
                  Precios
                </Link>
                <Link
                  href="/empresa/nosotros"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleMenuClose}
                >
                  <Info className="h-4 w-4" />
                  Nosotros
                </Link>
                <Link
                  href="/changelog"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleMenuClose}
                >
                  <FileText className="h-4 w-4" />
                  Novedades
                </Link>
                <Link
                  href="/academia"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleMenuClose}
                >
                  <GraduationCap className="h-4 w-4" />
                  Academia
                </Link>
              </div>
            </div>
          </div>

          {/* Social Links Footer */}
          {socialLinks && socialLinks.length > 0 && (
            <MobileSocialLinks links={socialLinks} />
          )}
        </div>
      </div>
    </header>
  );
}
