import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { obtenerContratoPorTokenAction } from '@/app/actions/contratos'
import { FirmaPublica } from '@/components/contratos/firma-publica'

export const metadata: Metadata = {
    title: 'Firma de Contrato | FN Autos',
    description: 'Firma digital de contrato de compraventa de vehículo',
    robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function FirmaContratoPage({
    params
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params

    if (!token) {
        notFound()
    }

    const { data: contrato, error } = await obtenerContratoPorTokenAction(token)

    if (error === 'already_signed') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4 animate-in zoom-in duration-500">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-full mx-auto w-24 h-24 flex items-center justify-center shadow-emerald-500/20 shadow-xl">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-6">¡Contrato Firmado!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        El documento ya ha sido firmado correctamente. Puedes acceder al contrato desde el PDF adjunto en tu correo electrónico.
                    </p>
                </div>
            </div>
        )
    }

    if (error || !contrato) {
        // Podría ser un error de token expirado o inválido, 
        // pasaremos el error al cliente o mostraremos una pantalla genérica.
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mx-auto w-16 h-16 flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enlace Inválido o Expirado</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {error === 'expired_token' 
                            ? 'El enlace de firma ha expirado. Solicita uno nuevo al concesionario.'
                            : 'El enlace de firma no es válido. Verifica el enlace enviado.'}
                    </p>
                </div>
            </div>
        )
    }

    if (contrato.estado === 'anulado') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contrato Anulado</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Este contrato ha sido anulado por el concesionario y ya no es válido para su firma.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <FirmaPublica contrato={contrato} token={token} />
        </main>
    )
}
