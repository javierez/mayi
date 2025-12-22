"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="mb-4 text-xl font-semibold">Algo ha salido mal</h2>
          <button
            onClick={() => reset()}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
