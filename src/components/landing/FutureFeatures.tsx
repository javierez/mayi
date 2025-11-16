import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  MessageSquare,
  Shield,
  CreditCard,
  Home,
  Bot,
  Zap,
} from "lucide-react";

const futureFeatures = [
  {
    title: "Integración con Twilio",
    description:
      "Gestiona conversaciones de WhatsApp y SMS directamente desde tu CRM. Mantén un historial completo de todas las comunicaciones con clientes.",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-100",
    timeline: "Q2 2025",
  },
  {
    title: "Sistema de Autenticación",
    description:
      "Seguridad empresarial con autenticación multi-factor, roles personalizados y acceso granular para equipos de cualquier tamaño.",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    timeline: "Q1 2025",
  },
  {
    title: "Pasarela de Pagos",
    description:
      "Procesa pagos de señas, comisiones y alquileres directamente en la plataforma. Integración completa con bancos españoles.",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    timeline: "Q3 2025",
  },
  {
    title: "Asistente de Alquiler",
    description:
      "Automatiza la gestión de alquileres: contratos, renovaciones, recordatorios de pago y mantenimiento de propiedades.",
    icon: Home,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    timeline: "Q2 2025",
  },
  {
    title: "Agente Conversacional",
    description:
      "IA avanzada que responde preguntas sobre propiedades, programa visitas y cualifica leads automáticamente 24/7.",
    icon: Bot,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    timeline: "Q4 2025",
  },
  {
    title: "Análisis Predictivo",
    description:
      "Insights impulsados por IA para predecir tendencias del mercado, valorar propiedades y optimizar estrategias de venta.",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    timeline: "Q3 2025",
  },
];

export function FutureFeatures() {
  return (
    <section
      id="future"
      className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 sm:mb-4">
            Próximamente
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            El futuro del sector inmobiliario
          </h2>
          <p className="mx-auto mt-3 max-w-2xl px-4 text-base text-gray-600 sm:mt-4 sm:px-0 sm:text-lg">
            Estamos trabajando en funciones revolucionarias que transformarán tu
            manera de hacer negocios. Comprometidos con nuestra política 0bug para garantizar la máxima calidad.
          </p>
        </div>

        {/* Mobile: Compact List View */}
        <div className="mt-6 space-y-3 sm:hidden">
          {futureFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group overflow-hidden border-2 border-dashed transition-all hover:border-solid hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${feature.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold leading-tight text-gray-900">
                          {feature.title}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {feature.timeline}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tablet/Desktop: Card Grid */}
        <div className="mt-12 hidden grid-cols-2 gap-8 sm:grid lg:mt-16 lg:grid-cols-3">
          {futureFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-2 border-dashed transition-all hover:border-solid hover:shadow-lg"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`inline-flex rounded-lg ${feature.bgColor} p-3`}
                    >
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {feature.timeline}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 text-center sm:mt-12 sm:p-8 lg:mt-16">
          <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
            ¿Tienes una idea para una nueva función?
          </h3>
          <p className="mt-3 px-2 text-base text-gray-600 sm:mt-4 sm:px-0 sm:text-lg">
            Construimos Vesta con feedback de profesionales del sector
            inmobiliario. Tu opinión da forma al futuro de la plataforma.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:justify-center sm:gap-4 lg:gap-6">
            <Badge variant="outline" className="w-full break-words px-3 py-2 text-center text-xs sm:w-auto sm:px-4 sm:text-sm">
              📧 Solicitudes de funciones: ideas@vesta.com
            </Badge>
            <Badge variant="outline" className="w-full break-words px-3 py-2 text-center text-xs sm:w-auto sm:px-4 sm:text-sm">
              💬 Programa Beta: Acceso anticipado disponible
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
