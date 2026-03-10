import { Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClienteInfoProps {
    cliente: {
        nombre_fiscal?: string | null
        nombre_comercial?: string | null
        cif: string
        email?: string | null
        telefono?: string | null
        direccion?: string | null
        ciudad?: string | null
        codigo_postal?: string | null
    }
}

export function ClienteInfo({ cliente }: ClienteInfoProps) {
    return (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">👤</span>
                    Cliente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {cliente.nombre_fiscal ?? 'Cliente'}
                    </p>
                    {cliente.nombre_comercial && cliente.nombre_comercial !== cliente.nombre_fiscal && (
                        <p className="text-sm text-slate-500 break-words">{cliente.nombre_comercial}</p>
                    )}
                </div>

                <div className="grid gap-3">
                    <div className="flex items-center gap-3 text-sm group">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Building2 className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-400 font-medium">CIF: {cliente.cif}</span>
                    </div>

                    {cliente.email && (
                        <div className="flex items-start gap-3 text-sm group">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors mt-0.5">
                                <Mail className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="min-w-0 flex-1 break-all text-slate-600 dark:text-slate-400">{cliente.email}</span>
                        </div>
                    )}

                    {cliente.telefono && (
                        <div className="flex items-center gap-3 text-sm group">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Phone className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-400">{cliente.telefono}</span>
                        </div>
                    )}

                    {cliente.direccion && (
                        <div className="flex items-start gap-3 text-sm group">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors mt-0.5">
                                <MapPin className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-400">
                                {cliente.direccion}
                                {cliente.codigo_postal && `, ${cliente.codigo_postal}`}
                                {cliente.ciudad && ` ${cliente.ciudad}`}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
