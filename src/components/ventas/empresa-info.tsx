import { Mail, MapPin, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EmpresaInfoProps {
    empresa: {
        nombre_fiscal?: string | null
        razon_social?: string | null
        nombre_comercial?: string | null
        cif: string
        email?: string | null
        direccion?: string | null
        ciudad?: string | null
        codigo_postal?: string | null
    }
}

export function EmpresaInfo({ empresa }: EmpresaInfoProps) {
    const nombre = empresa.nombre_fiscal || empresa.razon_social || empresa.nombre_comercial || 'Empresa'

    return (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">🏢</span>
                    Empresa emisora
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {nombre}
                    </p>
                    {empresa.nombre_comercial && empresa.nombre_comercial !== nombre && (
                        <p className="text-sm text-slate-500 break-words">{empresa.nombre_comercial}</p>
                    )}
                </div>

                <div className="grid gap-3">
                    <div className="flex items-center gap-3 text-sm group">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Building2 className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-400 font-medium">CIF: {empresa.cif}</span>
                    </div>

                    {empresa.email && (
                        <div className="flex items-start gap-3 text-sm group">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors mt-0.5">
                                <Mail className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="min-w-0 flex-1 break-all text-slate-600 dark:text-slate-400">{empresa.email}</span>
                        </div>
                    )}

                    {(empresa.direccion || empresa.ciudad || empresa.codigo_postal) && (
                        <div className="flex items-start gap-3 text-sm group">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors mt-0.5">
                                <MapPin className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-400">
                                {[empresa.direccion, empresa.codigo_postal, empresa.ciudad].filter(Boolean).join(', ') || '-'}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
