"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { SubscribeInfoModal } from "~/components/landing/SubscribeInfoModal";
import { ContactInfoModal } from "~/components/landing/ContactInfoModal";

const navigation = {
  producto: [
    { name: "Características", href: "/#features" },
    { name: "Integraciones", href: "#" },
    { name: "Próximamente", href: "/#future" },
    { name: "Precios", href: "/precios" },
  ],
  empresa: [
    { name: "Sobre nosotros", href: "/empresa/nosotros" },
    { name: "Contacto", href: "#" },
    { name: "Blog", href: "/academia" },
  ],
  soporte: [
    { name: "Centro de ayuda", href: "/centro-de-ayuda" },
    { name: "Academia", href: "/academia" },
  ],
  legal: [
    { name: "Aviso Legal", href: "/aviso-legal" },
    { name: "Privacidad", href: "/privacidad" },
    { name: "Cookies", href: "/cookies" },
    { name: "Condiciones", href: "/condiciones-servicio" },
  ],
};

export function Footer() {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleProductClick = (itemName: string, event: MouseEvent) => {
    if (itemName === "Integraciones") {
      event.preventDefault();
      setIsSubscribeModalOpen(true);
    }
  };

  const handleCompanyClick = (itemName: string, event: MouseEvent) => {
    if (itemName === "Contacto") {
      event.preventDefault();
      setIsContactModalOpen(true);
    }
  };

  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <SubscribeInfoModal
          open={isSubscribeModalOpen}
          onOpenChange={setIsSubscribeModalOpen}
        />
        <ContactInfoModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
        />
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center gap-2">
              <Link href="/" aria-label="Inicio Vesta CRM">
                <Image
                  src="/vestazoomin.jpeg"
                  alt="Vesta CRM"
                  width={180}
                  height={52}
                  className="h-10 w-auto rounded-md object-contain"
                />
              </Link>
            </div>
            <p className="text-base text-gray-300">
              El CRM más completo para profesionales inmobiliarios en España.
              Automatiza, optimiza y haz crecer tu negocio con inteligencia
              artificial.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <span>javier@vesta-crm.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+34 636 036 116</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Calle Aviador Zorita 6, 28020, Madrid</span>
              </div>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-base font-medium text-white">Producto</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.producto.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 transition-colors hover:text-white"
                        onClick={(event) => handleProductClick(item.name, event)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-base font-medium text-white">Empresa</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.empresa.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 transition-colors hover:text-white"
                        onClick={(event) => handleCompanyClick(item.name, event)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-base font-medium text-white">Soporte</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.soporte.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-base font-medium text-white">Legal</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-base text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
            <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link
                href="https://x.com/javierez_98"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com/in/javierezgarcia/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
            <p className="mt-8 text-base text-gray-400 md:order-1 md:mt-0">
              &copy; 2025 Vesta CRM. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
