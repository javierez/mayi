export const metadata = {
  title: "MayI - Nuestros Recuerdos",
  description: "Calendario de recuerdos para parejas",
};

export default function MemoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication disabled for development
  return <>{children}</>;
}
