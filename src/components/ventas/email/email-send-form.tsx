'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, FileText, Loader2 } from 'lucide-react'
import { sendFacturaEmailAction } from '@/app/actions/email'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { clientConfig } from '@/config/clients'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(str: string): string[] {
    return str.split(',').map(e => e.trim()).filter(Boolean)
}

function validateEmails(emails: string[]): string | null {
    for (const e of emails) {
        if (!EMAIL_REGEX.test(e)) return `Email no válido: ${e}`
    }
    return null
}

import type { Factura, Cliente } from '@/types/ventas'

interface EmailSendFormProps {
    factura: Factura
    cliente: Cliente
    empresaNombre?: string
    messageTemplate: string
    incluirLogo: boolean
    plantilla?: string
}

export function EmailSendForm({ factura, cliente, empresaNombre = clientConfig.nombre, messageTemplate, incluirLogo, plantilla = 'estandar' }: EmailSendFormProps) {
    const router = useRouter()
    const clienteEmailPrincipal = cliente?.email_principal || ''
    const clienteEmailSecundario = cliente?.email_secundario || ''
    const defaultTo = clienteEmailPrincipal || clienteEmailSecundario || ''
    const [sending, setSending] = useState(false)
    const [to, setTo] = useState(defaultTo)
    const [cc, setCC] = useState('')
    const [subject, setSubject] = useState(`Factura ${factura.serie}-${factura.numero} - ${empresaNombre}`)
    const [message, setMessage] = useState(messageTemplate)
    const [sendCopy, setSendCopy] = useState(true)

    // Update message when template changes (if simple implementation)
    // In a real app, use useEffect with care to not overwrite user edits

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const toList = parseEmails(to)
        const ccList = parseEmails(cc)
        const emailErr = validateEmails([...toList, ...ccList])
        if (toList.length === 0) {
            toast.error('Introduce al menos un destinatario')
            return
        }
        if (emailErr) {
            toast.error(emailErr)
            return
        }
        setSending(true)

        const formData = new FormData()
        formData.append('facturaId', factura.id)
        formData.append('to', toList.join(','))
        formData.append('cc', ccList.join(','))
        formData.append('subject', subject)
        formData.append('message', message)
        formData.append('incluirLogo', incluirLogo ? '1' : '0')
        formData.append('plantilla', plantilla)
        if (sendCopy) formData.append('sendCopy', 'on')

        try {
            const result = await sendFacturaEmailAction(formData)

            if (result.success) {
                toast.success('Factura enviada correctamente')
                router.refresh()
                router.push(`/ventas/facturas/${factura.id}`)
            } else {
                toast.error('Error al enviar el email: ' + result.error)
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error)
            toast.error('Ocurrió un error inesperado')
        } finally {
            setSending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
            <Card className="border-white/20 dark:border-white/10 shadow-xl backdrop-blur-md bg-white/50 dark:bg-slate-900/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Send className="h-5 w-5 text-primary" />
                        </div>
                        Detalles del Envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold tracking-tight">Destinatario</Label>
                        <div className="flex flex-wrap gap-2">
                            {clienteEmailPrincipal && (
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1.5 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer transition-all active:scale-95 text-xs font-bold"
                                    onClick={() => setTo(clienteEmailPrincipal)}
                                >
                                    {clienteEmailPrincipal}
                                    <span className="ml-2 text-[8px] px-1 bg-primary text-white rounded">P</span>
                                </Badge>
                            )}
                            {clienteEmailSecundario && clienteEmailSecundario !== clienteEmailPrincipal && (
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 cursor-pointer transition-all active:scale-95 text-xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    onClick={() => setTo(clienteEmailSecundario)}
                                >
                                    {clienteEmailSecundario}
                                    <span className="ml-2 text-[8px] px-1 bg-slate-500 text-white rounded font-bold">S</span>
                                </Badge>
                            )}
                        </div>
                        <Input
                            value={to}
                            type="email"
                            multiple
                            inputMode="email"
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="ej. cliente@empresa.com, otro@empresa.com"
                            className="h-12 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all text-base"
                        />
                        <p className="text-[10px] text-slate-400 italic">Separa múltiples correos con una coma (,)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Copia (CC)</Label>
                            <Input
                                value={cc}
                                type="email"
                                inputMode="email"
                                onChange={(e) => setCC(e.target.value)}
                                placeholder="Copia a..."
                                className="h-10 border-slate-200/50 dark:border-slate-800/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asunto</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-10 border-slate-200/50 dark:border-slate-800/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold tracking-tight">Cuerpo del Mensaje</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe un mensaje personalizado..."
                            className="min-h-[160px] md:min-h-[220px] border-slate-200 dark:border-slate-800 resize-none leading-relaxed text-base"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-white/20 dark:border-white/10 shadow-lg bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
                <CardHeader className="py-3 px-4 bg-white/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-500">
                        <FileText className="h-4 w-4" />
                        ADJUNTOS (1)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all cursor-default">
                        <div className="w-12 h-12 bg-red-500/10 text-red-600 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-inner border border-red-500/20">
                            PDF
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">Factura {factura.serie}-{factura.numero}.pdf</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Badge className="h-2 w-2 p-0 bg-green-500" /> Generado con Plantilla {plantilla.toUpperCase()}
                            </p>
                        </div>
                        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-bold tracking-widest bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            AUTO
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/20 dark:border-white/10 w-full md:w-auto">
                    <Checkbox
                        id="sendCopy"
                        checked={sendCopy}
                        onCheckedChange={(c) => setSendCopy(!!c)}
                        className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="grid gap-0.5">
                        <label
                            htmlFor="sendCopy"
                            className="text-xs font-bold leading-none cursor-pointer"
                        >
                            Copia a mi correo
                        </label>
                        <p className="text-[10px] text-muted-foreground italic">
                            ({clientConfig.email.admin})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1 md:flex-none text-slate-500">
                        Volver
                    </Button>
                    <Button type="submit" disabled={sending} className="flex-1 md:flex-none min-w-[180px] h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/20">
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ENVIANDO...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                ENVIAR AHORA
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
