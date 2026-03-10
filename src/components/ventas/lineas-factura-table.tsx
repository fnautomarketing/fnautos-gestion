import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Linea {
    concepto: string
    descripcion: string | null
    cantidad: number
    precio_unitario: number
    descuento_porcentaje: number | null
    iva_porcentaje: number
    subtotal: number
}

interface LineasFacturaTableProps {
    lineas: Linea[]
}

export function LineasFacturaTable({ lineas }: LineasFacturaTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    const subtotalTotal = lineas.reduce((sum, linea) => sum + (Number(linea.subtotal) || 0), 0)
    // Total por línea = base (subtotal) + IVA aplicado
    const totalConIva = (linea: Linea) =>
        (Number(linea.subtotal) || 0) * (1 + (linea.iva_porcentaje ?? 21) / 100)
    const totalGeneral = lineas.reduce((sum, linea) => sum + totalConIva(linea), 0)

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400">📋</span>
                    Líneas de Factura
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 p-0 sm:p-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                                <TableHead className="font-semibold text-slate-600">Concepto</TableHead>
                                <TableHead className="text-center w-20 font-semibold text-slate-600">Cant.</TableHead>
                                <TableHead className="text-right w-28 font-semibold text-slate-600">Precio U.</TableHead>
                                <TableHead className="text-center w-20 font-semibold text-slate-600">DTO%</TableHead>
                                <TableHead className="text-center w-20 font-semibold text-slate-600">IVA%</TableHead>
                                <TableHead className="text-right w-28 font-semibold text-slate-600">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineas.map((linea, index) => (
                                <TableRow key={index} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-slate-900">{linea.concepto}</p>
                                            {linea.descripcion && (
                                                <p className="text-xs text-slate-500 mt-0.5">{linea.descripcion}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-slate-700">{linea.cantidad}</TableCell>
                                    <TableCell className="text-right text-slate-700">{formatCurrency(linea.precio_unitario)}</TableCell>
                                    <TableCell className="text-center text-slate-500">{linea.descuento_porcentaje ?? '-'}%</TableCell>
                                    <TableCell className="text-center text-slate-500">{linea.iva_porcentaje}%</TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900">
                                        {formatCurrency(totalConIva(linea))}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 font-medium">
                                <TableCell colSpan={5} className="text-right text-slate-600">
                                    Base imponible
                                </TableCell>
                                <TableCell className="text-right text-slate-600">
                                    {formatCurrency(subtotalTotal)}
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 font-medium">
                                <TableCell colSpan={5} className="text-right text-slate-600">
                                    TOTAL
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-900">
                                    {formatCurrency(totalGeneral)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
