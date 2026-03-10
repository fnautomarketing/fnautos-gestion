'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface EmailTemplatesPanelProps {
    onTemplateChange: (template: string) => void
    incluirLogo: boolean
    onLogoChange: (checked: boolean) => void
}

export function EmailTemplatesPanel({ onTemplateChange, incluirLogo, onLogoChange }: EmailTemplatesPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Personalización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs">Plantilla de email</Label>
                    <Select defaultValue="estandar" onValueChange={onTemplateChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="estandar">Corporativa Estándar</SelectItem>
                            <SelectItem value="informal">Cercana / Informal</SelectItem>
                            <SelectItem value="recordatorio">Recordatorio de Pago</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">Incluir logo</span>
                        <span className="text-[10px] text-slate-500">Visible en el cuerpo del email</span>
                    </Label>
                    <Switch checked={incluirLogo} onCheckedChange={onLogoChange} />
                </div>
            </CardContent>
        </Card>
    )
}
