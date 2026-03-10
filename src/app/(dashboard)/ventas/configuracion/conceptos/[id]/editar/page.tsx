import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ConceptoForm } from '@/components/conceptos/concepto-form'

export default async function EditarConceptoPage({ params }: { params: { id: string } }) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: concepto } = await supabase
        .from('conceptos_catalogo')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!concepto) notFound()

    return (
        <div className="w-full py-8 px-4">
            <ConceptoForm initialData={concepto} isEditing />
        </div>
    )
}
