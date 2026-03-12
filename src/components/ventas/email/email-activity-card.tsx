import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

import { EmailFactura } from '@/types/ventas'

interface EmailActivityCardProps {
    historial: EmailFactura[]
}

export function EmailActivityCard({ historial }: EmailActivityCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Historial de actividad</CardTitle>
            </CardHeader>
            <CardContent>
                {historial.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No hay actividad de emails registrada.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {historial.map((email) => (
                            <div key={email.id} className="flex gap-3 items-start">
                                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${email.estado === 'enviado' ? 'bg-green-100 text-green-600' :
                                        email.estado === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {email.estado === 'enviado' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                        email.estado === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {email.estado === 'enviado' ? 'Email enviado' : 'Error en envío'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Para: {email.para.join(', ')}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
