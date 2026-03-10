import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

import { EventoFactura } from '@/types/ventas'

interface HistorialCambiosCardProps {
    cambios: EventoFactura[]
}

export function HistorialCambiosCard({ cambios }: HistorialCambiosCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Historial de Cambios
                </CardTitle>
            </CardHeader>
            <CardContent>
                {cambios.length > 0 ? (
                    <div className="space-y-3">
                        {cambios.map((cambio) => (
                            <div key={cambio.id} className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                    {cambio.descripcion}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {cambio.created_at ? format(new Date(cambio.created_at), 'dd MMM yyyy - HH:mm', { locale: es }) : '-'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No hay cambios registrados
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
