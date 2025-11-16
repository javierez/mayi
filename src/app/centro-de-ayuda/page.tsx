import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-gradient-to-b from-white to-gray-50">
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
              Centro de ayuda
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ¿Necesitas ayuda con Vesta?
            </h1>
            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Elige la opción que te resulte más cómoda para resolver tus dudas.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <a
                href="/academia"
                className="flex flex-col items-center rounded-xl bg-white p-6 text-left shadow-md transition hover:shadow-lg"
              >
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                  Academia Vesta
                </h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Guías claras y prácticas para aprender Vesta a tu ritmo.
                </p>
              </a>

              <a
                href="mailto:javier@vesta-crm.com"
                className="flex flex-col items-center rounded-xl bg-white p-6 text-left shadow-md transition hover:shadow-lg"
              >
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                  Enviar un email
                </h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Escríbenos a{" "}
                  <span className="font-medium text-gray-900">
                    javier@vesta-crm.com
                  </span>{" "}
                  y te respondemos personalmente.
                </p>
              </a>

              <div className="flex flex-col items-center rounded-xl bg-white p-6 text-left shadow-md">
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                  Llamar por teléfono
                </h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Llámanos al{" "}
                  <a
                    href="tel:+34636036116"
                    className="font-medium text-amber-600 hover:text-amber-700"
                  >
                    +34 636 036 116
                  </a>
                  {" "}y hablamos directamente contigo.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


