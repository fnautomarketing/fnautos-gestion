'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MoreHorizontal, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { enviarRecordatorioAction, registrarLlamadaAction } from '@/app/actions/recordatorios'

interface VencidasTablaProps {
    facturas: any[]
    nivel: string
}

export function VencidasTabla({ facturas, nivel: _nivel }: VencidasTablaProps) {
    const router = useRouter()
    const [selectedFacturas, setSelectedFacturas] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const [openEmailModal, setOpenEmailModal] = useState(false)
    const [openCallModal, setOpenCallModal] = useState(false)
    const [currentFactura, setCurrentFactura] = useState<any>(null)

    // Estados para formularios
    const [emailAsunto, setEmailAsunto] = useState('Recordatorio de Pago Factura Vencida')
    const [emailContenido, setEmailContenido] = useState(
        'Estimado {cliente_nombre},\n\nLe recordamos que la factura {factura_numero} por importe de {importe} venció hace {dias_vencido} días.\n\nPor favor, proceda al pago lo antes posible.\n\nAtentamente,\nEl equipo de administración.'
    )

    const [callNotas, setCallNotas] = useState('')
    const [callResultado, setCallResultado] = useState('compromiso_pago')
    const [callPersona, setCallPersona] = useState('')
    const [callCompromiso, setCallCompromiso] = useState('')

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select those with emails
            setSelectedFacturas(facturas.filter(f => f.cliente_email).map(f => f.id))
        } else {
            setSelectedFacturas([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedFacturas([...selectedFacturas, id])
        } else {
            setSelectedFacturas(selectedFacturas.filter(fid => fid !== id))
        }
    }

    const handleEnviarRecordatorio = async () => {
        if (!currentFactura && selectedFacturas.length === 0) return

        setIsSending(true)
        const formData = new FormData()

        if (currentFactura) {
            formData.append('factura_id', currentFactura.id)
            formData.append('email_destinatario', currentFactura.cliente_email)
        } else {
            formData.append('factura_id', JSON.stringify(selectedFacturas))
        }

        formData.append('tipo', 'email')
        formData.append('asunto', emailAsunto)
        formData.append('contenido', emailContenido)
        formData.append('adjuntar_factura', 'true')

        const result = await enviarRecordatorioAction(formData)

        if (result.success) {
            toast.success(currentFactura ? 'Recordatorio enviado' : 'Recordatorios enviados correctamente')
            setOpenEmailModal(false)
            setSelectedFacturas([])
            setCurrentFactura(null)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsSending(false)
    }

    const handleRegistrarLlamada = async () => {
        if (!currentFactura) return

        setIsSending(true)
        const formData = new FormData()
        formData.append('factura_id', currentFactura.id)
        formData.append('tipo', 'llamada')
        formData.append('notas', callNotas)
        formData.append('resultado_llamada', callResultado)
        formData.append('persona_contactada', callPersona)
        if (callCompromiso) formData.append('fecha_compromiso_pago', callCompromiso)

        const result = await registrarLlamadaAction(formData)

        if (result.success) {
            toast.success('Llamada registrada correctamente')
            setOpenCallModal(false)
            setCurrentFactura(null)
            setCallNotas('')
            setCallPersona('')
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsSending(false)
    }

    const openEmailDialog = (factura: any) => {
        setCurrentFactura(factura)
        setEmailAsunto(`Recordatorio Factura ${factura.serie}-${factura.numero} - VENCIDA`)
        setOpenEmailModal(true)
    }

    const openCallDialog = (factura: any) => {
        setCurrentFactura(factura)
        setCallPersona(factura.cliente_nombre?.split(' ')[0] || '')
        setOpenCallModal(true)
    }

    const getCriticidadBadge = (nivel: string) => {
        switch (nivel) {
            case 'critico': return <Badge variant="destructive">Crítico (+60d)</Badge>
            case 'urgente': return <Badge className="bg-orange-500 hover:bg-orange-600">Urgente (30-60d)</Badge>
            case 'atencion': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Atención (0-30d)</Badge>
            default: return <Badge variant="secondary">Normal</Badge>
        }
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {selectedFacturas.length > 0 && (
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                    setCurrentFactura(null)
                                    setEmailAsunto('Recordatorio de Pagos Pendientes')
                                    setOpenEmailModal(true)
                                }}
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Enviar email a ({selectedFacturas.length}) seleccionados
                            </Button>
                        )}
                    </div>
                    <div className="text-sm text-slate-500">
                        Mostrando {facturas.length} facturas vencidas
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedFacturas.length === facturas.length && facturas.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead>Factura</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead className="text-right">Pendiente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Gestión</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {facturas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                                    No hay facturas vencidas en este nivel.
                                </TableCell>
                            </TableRow>
                        ) : (
                            facturas.map((factura) => (
                                <TableRow key={factura.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedFacturas.includes(factura.id)}
                                            onCheckedChange={(checked) => handleSelectOne(factura.id, !!checked)}
                                            disabled={!factura.cliente_email}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Link href={`/ventas/facturas/${factura.id}`} className="hover:underline text-primary flex items-center gap-2">
                                            {factura.serie}-{factura.numero}
                                            {factura.fecha_ultimo_recordatorio && (
                                                <span className="text-xs text-slate-400" title={`Último envío: ${new Date(factura.fecha_ultimo_recordatorio).toLocaleDateString()}`}>
                                                    📧
                                                </span>
                                            )}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{factura.cliente_nombre}</span>
                                            <span className="text-xs text-slate-500">{factura.cliente_email || 'Sin email'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-red-600 dark:text-red-400">
                                                {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy')}
                                            </span>
                                            <span className="text-xs text-slate-500">hace {factura.dias_vencido} días</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{factura.total.toFixed(2)}€</TableCell>
                                    <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                        {factura.pendiente.toFixed(2)}€
                                    </TableCell>
                                    <TableCell>{getCriticidadBadge(factura.nivel_criticidad)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => openEmailDialog(factura)} disabled={!factura.cliente_email}>
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openCallDialog(factura)}>
                                                <Phone className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/ventas/facturas/${factura.id}`)}>
                                                    Ver Factura
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/ventas/pagos/registrar?factura_id=${factura.id}`)}>
                                                    Registrar Cobro
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">
                                                    Ver Historial Cobros
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Modal Email */}
            <Dialog open={openEmailModal} onOpenChange={setOpenEmailModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Enviar Recordatorio de Pago</DialogTitle>
                        <DialogDescription>
                            {currentFactura
                                ? `Enviando recordatorio a ${currentFactura.cliente_nombre}`
                                : `Enviando recordatorio masivo a ${selectedFacturas.length} clientes`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="asunto" className="text-right">
                                Asunto
                            </Label>
                            <Input
                                id="asunto"
                                value={emailAsunto}
                                onChange={(e) => setEmailAsunto(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mensaje" className="text-right">
                                Mensaje
                            </Label>
                            <Textarea
                                id="mensaje"
                                value={emailContenido}
                                onChange={(e) => setEmailContenido(e.target.value)}
                                className="col-span-3 h-[200px]"
                            />
                        </div>
                        <div className="text-xs text-slate-500 ml-[25%] px-4">
                            Variables disponibles: {'{cliente_nombre}, {factura_numero}, {importe}, {dias_vencido}'}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEmailModal(false)}>Cancelar</Button>
                        <Button onClick={handleEnviarRecordatorio} disabled={isSending}>
                            {isSending ? 'Enviando...' : 'Enviar Recordatorio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Llamada */}
            <Dialog open={openCallModal} onOpenChange={setOpenCallModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Llamada de Cobro</DialogTitle>
                        <DialogDescription>
                            Cliente: {currentFactura?.cliente_nombre} - Tel: {currentFactura?.cliente_telefono}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Resultado de la llamada</Label>
                            <div className="flex flex-wrap gap-2">
                                {['compromiso_pago', 'solicita_tiempo', 'disputa', 'no_contesto', 'mensaje'].map(res => (
                                    <Badge
                                        key={res}
                                        variant={callResultado === res ? 'default' : 'outline'}
                                        className="cursor-pointer capitalize"
                                        onClick={() => setCallResultado(res)}
                                    >
                                        {res.replace('_', ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="persona" className="text-right">
                                Hablado con
                            </Label>
                            <Input
                                id="persona"
                                value={callPersona}
                                onChange={(e) => setCallPersona(e.target.value)}
                                className="col-span-3"
                                placeholder="Nombre de la persona"
                            />
                        </div>
                        {callResultado === 'compromiso_pago' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="compromiso" className="text-right">
                                    Fecha Pago
                                </Label>
                                <Input
                                    id="compromiso"
                                    type="date"
                                    value={callCompromiso}
                                    onChange={(e) => setCallCompromiso(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notas" className="text-right">
                                Notas
                            </Label>
                            <Textarea
                                id="notas"
                                value={callNotas}
                                onChange={(e) => setCallNotas(e.target.value)}
                                className="col-span-3"
                                placeholder="Detalles de la conversación..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenCallModal(false)}>Cancelar</Button>
                        <Button onClick={handleRegistrarLlamada} disabled={isSending}>
                            {isSending ? 'Guardando...' : 'Registrar Llamada'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
