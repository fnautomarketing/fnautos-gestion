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
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Send className="h-5 w-5 text-slate-500" />
                        Datos del envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Para</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {clienteEmailPrincipal && (
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                                    onClick={() => setTo(clienteEmailPrincipal)}
                                >
                                    {clienteEmailPrincipal}
                                    <span className="ml-2 text-[10px] font-bold opacity-60">PRINCIPAL</span>
                                </Badge>
                            )}
                            {clienteEmailSecundario && clienteEmailSecundario !== clienteEmailPrincipal && (
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    onClick={() => setTo(clienteEmailSecundario)}
                                >
                                    {clienteEmailSecundario}
                                    <span className="ml-2 text-[10px] font-bold opacity-60">SECUNDARIO</span>
                                </Badge>
                            )}
                        </div>
                        <Input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="ej. cliente@empresa.com, contabilidad@empresa.com"
                        />
                        <p className="text-[10px] text-slate-400">Separa múltiples direcciones con comas</p>
                    </div>

                    <div className="space-y-2">
                        <Label>CC</Label>
                        <Input
                            value={cc}
                            onChange={(e) => setCC(e.target.value)}
                            placeholder="Copia a..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Asunto</Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Mensaje</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[200px] font-sans"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card key={messageTemplate}> {/* Force re-render if needed, but managing state is better */}
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-500" />
                        Adjuntos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold text-xs uppercase">PDF</div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Factura {factura.serie}-{factura.numero}.pdf</p>
                            <p className="text-xs text-slate-500">Generado automáticamente</p>
                        </div>
                        <Badge variant="outline" className="text-slate-500 bg-white">Incluido</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-2 space-y-0">
                        <Checkbox
                            id="sendCopy"
                            checked={sendCopy}
                            onCheckedChange={(c) => setSendCopy(!!c)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="sendCopy"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Enviar copia a mi correo
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Recibirás una copia exacta del email enviado.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={sending} className="min-w-[150px]">
                    {sending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Email
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
