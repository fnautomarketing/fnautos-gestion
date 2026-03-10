export default function ValidPlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 sm:px-6">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400"
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="12" x2="12" y1="8" y2="16" />
                    <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Módulo en Construcción
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                    Esta sección (RFC-003) estará disponible próximamente con funcionalidades avanzadas.
                </p>
            </div>
        </div>
    )
}
