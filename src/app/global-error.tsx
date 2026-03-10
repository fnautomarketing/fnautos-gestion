'use client'

/**
 * Captura errores no manejados en la app (incl. "Failed to fetch" de Server Actions).
 * Reemplaza el layout raíz cuando se activa, por eso incluye html/body.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const isFetchError =
        error?.message?.includes('fetch') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError')

    return (
        <html lang="es">
            <body className="font-sans antialiased min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg text-center">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {isFetchError ? 'Error de conexión' : 'Algo ha fallado'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {isFetchError
                            ? 'Comprueba tu conexión a internet e intenta de nuevo.'
                            : 'Ha ocurrido un error inesperado. Intenta recargar la página.'}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    )
}
