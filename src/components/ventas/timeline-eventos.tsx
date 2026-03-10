import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Mail, FileText, Clock, AlertTriangle, Ban, FileX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Evento {
    id: string
    tipo: string
    descripcion: string | null
    created_at: string | null
}

interface TimelineEventosProps {
    eventos: Evento[]
}

export function TimelineEventos({ eventos }: TimelineEventosProps) {
    const getIcono = (tipo: string) => {
        const iconos: Record<string, React.ReactNode> = {
            pagado: <CheckCircle2 className="h-4 w-4 text-green-600" />,
            enviado: <Mail className="h-4 w-4 text-blue-600" />,
            emitido: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
            creado: <FileText className="h-4 w-4 text-slate-600" />,
            borrador: <FileText className="h-4 w-4 text-slate-400" />,
            vencido: <AlertTriangle className="h-4 w-4 text-red-500" />,
            anulado: <Ban className="h-4 w-4 text-red-600" />,
            modificado: <FileText className="h-4 w-4 text-slate-500" />,
            rectificada: <FileX className="h-4 w-4 text-orange-600" />,
        }
        return iconos[tipo] || <Clock className="h-4 w-4 text-slate-400" />
    }

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <span className="text-slate-400">⏱️</span>
                    Timeline de Eventos
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-0">
                    {eventos.map((evento, index) => (
                        <div key={evento.id} className="flex gap-4 group">
                            <div className="relative flex flex-col items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm z-10 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                                    {getIcono(evento.tipo)}
                                </div>
                                {index < eventos.length - 1 && (
                                    <div className="h-full w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors my-1" />
                                )}
                            </div>
                            <div className="flex-1 pb-6">
                                <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {evento.descripcion}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {evento.created_at ? format(new Date(evento.created_at), 'dd MMM yyyy - HH:mm', { locale: es }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {eventos.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No hay eventos registrados</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
