import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import { clientConfig } from '@/config/clients'

interface PreviewPlantillaPageProps {
    params: Promise<{ id: string }>
}

export default async function PreviewPlantillaPage({ params }: PreviewPlantillaPageProps) {
    const { id } = await params

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id) throw new Error('Usuario sin empresa')

    const { data: plantilla } = await supabase
        .from('plantillas_pdf')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', perfil.empresa_id)
        .single()

    if (!plantilla) notFound()

    // ... (rest of the file until color usage) ...
    // Note: I will just replace the specific lines with color usage if possible, but the file is large. 
    // I can't easily replace disjoint lines with one tool call unless I use multi_replace.
    // I'll use multi_replace.

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Plantillas PDF › {plantilla.nombre} › Vista Previa
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif font-bold">{plantilla.nombre}</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Vista previa completa de la plantilla
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/ventas/configuracion/plantillas">
                        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <Link href={`/ventas/configuracion/plantillas/${id}/editar`}>
                        <Button className="bg-linear-to-r from-slate-700 to-slate-900">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Preview a tamaño completo */}
            <div className="flex justify-center">
                <div className="w-full max-w-[800px] aspect-210/297 bg-white rounded-2xl shadow-2xl overflow-hidden border">
                    <div className="p-12 text-sm">
                        {/* Logo */}
                        {plantilla.logo_url ? (
                            <div className={`mb-8 ${plantilla.logo_posicion === 'centro' ? 'text-center' :
                                plantilla.logo_posicion === 'derecha' ? 'text-right' : 'text-left'
                                }`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={plantilla.logo_url}
                                    alt="Logo"
                                    style={{
                                        width: `${plantilla.logo_ancho}px`,
                                        height: `${plantilla.logo_alto}px`
                                    }}
                                    className="inline-block object-contain"
                                />
                            </div>
                        ) : (
                            <div className={`mb-8 ${plantilla.logo_posicion === 'centro' ? 'text-center' :
                                plantilla.logo_posicion === 'derecha' ? 'text-right' : 'text-left'
                                }`}>
                                <div
                                    className="inline-flex items-center justify-center bg-slate-100 rounded text-slate-400"
                                    style={{
                                        width: `${plantilla.logo_ancho}px`,
                                        height: `${plantilla.logo_alto}px`
                                    }}
                                >
                                    TU LOGO
                                </div>
                            </div>
                        )}

                        {/* Cabecera de factura */}
                        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-200">
                            <div>
                                <p className="text-slate-500 text-sm mb-1">FACTURAR A:</p>
                                <p className="font-bold text-xl text-slate-800">Cliente Example SL</p>
                                <p className="text-slate-600">CIF: B12345678</p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Calle Ejemplo 123<br />
                                    28001 Madrid, España
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-3xl mb-2" style={{ color: (plantilla.color_primario || undefined) as any }}>
                                    FACTURA
                                </p>
                                <p className="text-slate-700 text-lg">Nº FAC-2024-001</p>
                                <p className="text-slate-500 mt-2">
                                    Fecha emisión: 07/02/2024<br />
                                    Fecha vencimiento: 09/03/2024
                                </p>
                            </div>
                        </div>

                        {/* Tabla de conceptos */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr style={{ backgroundColor: (plantilla.color_encabezado_tabla || undefined) as any }} className="text-white text-sm">
                                    <th className="p-3 text-left rounded-tl-lg">Concepto</th>
                                    <th className="p-3 text-center">Cantidad</th>
                                    <th className="p-3 text-right">Precio</th>
                                    <th className="p-3 text-right">Descuento</th>
                                    <th className="p-3 text-right rounded-tr-lg">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600">
                                <tr className={plantilla.alternar_color_filas ? 'bg-slate-50' : ''}>
                                    <td className="p-3">Servicio de Logística Premium</td>
                                    <td className="p-3 text-center">1</td>
                                    <td className="p-3 text-right">850,00€</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right font-semibold">850,00€</td>
                                </tr>
                                <tr className={!plantilla.alternar_color_filas ? '' : ''}>
                                    <td className="p-3">Transporte Especial Internacional</td>
                                    <td className="p-3 text-center">2</td>
                                    <td className="p-3 text-right">150,00€</td>
                                    <td className="p-3 text-right">10%</td>
                                    <td className="p-3 text-right font-semibold">270,00€</td>
                                </tr>
                                <tr className={plantilla.alternar_color_filas ? 'bg-slate-50' : ''}>
                                    <td className="p-3">Embalaje Premium Reforzado</td>
                                    <td className="p-3 text-center">5</td>
                                    <td className="p-3 text-right">10,00€</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right font-semibold">50,00€</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Totales */}
                        <div className="flex justify-end mb-8">
                            <div className="w-1/3 text-right space-y-2">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal:</span>
                                    <span>1.170,00€</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Base Imponible:</span>
                                    <span>1.170,00€</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>IVA (21%):</span>
                                    <span>245,70€</span>
                                </div>
                                <div className="flex justify-between text-lg font-black pt-3 mt-2 border-t-2" style={{ color: (plantilla.color_primario || undefined) as any }}>
                                    <span>TOTAL:</span>
                                    <span>1.415,70€</span>
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        {plantilla.mostrar_notas && (
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                                <p className="font-semibold text-slate-700 mb-1">Notas:</p>
                                <p className="text-slate-500 text-sm">
                                    Gracias por confiar en nuestros servicios de logística.
                                    El pago se realizará por transferencia bancaria.
                                </p>
                            </div>
                        )}

                        {/* Datos bancarios */}
                        {plantilla.mostrar_datos_bancarios && (
                            <div className="p-4 bg-slate-100 rounded-lg" style={{ borderLeft: `4px solid ${plantilla.color_primario || '#000'}` }}>
                                <p className="font-semibold text-slate-700 mb-1">Datos Bancarios:</p>
                                <p className="text-slate-600 text-sm">
                                    Banco: Ejemplo Bank<br />
                                    IBAN: ES12 1234 5678 90 0123456789<br />
                                    Titular: {clientConfig.nombre}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
