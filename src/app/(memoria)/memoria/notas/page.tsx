import { Suspense } from "react";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { MemoriaLocationMap } from "~/components/memoria/MemoriaLocationMap";

function MapSkeleton() {
  return (
    <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-2xl bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  );
}

export default function MapaPage() {
  return (
    <MemoriaLayout>
      <div className="px-2 py-3">
        <Suspense fallback={<MapSkeleton />}>
          <MemoriaLocationMap />
        </Suspense>
      </div>
    </MemoriaLayout>
  );
}
