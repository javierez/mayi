import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Solución para Equipos de Ventas - Vesta",
  description:
    "Optimiza tu proceso de ventas inmobiliarias. CRM completo, seguimiento de leads, y herramientas de productividad.",
};

export default function EquiposVentasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Solución para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Equipos de Ventas
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Cierra más ventas con herramientas diseñadas para agentes
              inmobiliarios. Gestión de leads, seguimiento automatizado y
              análisis de rendimiento.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/dashboard">
                  Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
