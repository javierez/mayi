import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              Vesta
            </span>
            <span className="text-sm text-gray-500">
              © {currentYear} Todos los derechos reservados
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <Link href="/privacidad" className="hover:text-gray-700">
              Privacidad
            </Link>
            <Link href="/condiciones-servicio" className="hover:text-gray-700">
              Términos
            </Link>
            <Link href="/cookies" className="hover:text-gray-700">
              Cookies
            </Link>
            <Link href="/aviso-legal" className="hover:text-gray-700">
              Aviso Legal
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
