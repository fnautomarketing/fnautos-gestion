'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2, Plus, Pencil, Trash2, Power, PowerOff, X } from 'lucide-react'
import { crearEmpresaAction, actualizarEmpresaGlobalAction, eliminarEmpresaAction, toggleEmpresaActivaAction } from '@/app/actions/empresas-crud'
import type { Empresa } from '@/types/empresa'
import { toast } from 'sonner'

/**
 * Componente cliente para la gestión de empresas con diseño premium y optimización móvil.
 */

interface Props {
    empresas: Empresa[]
}

export function GestionEmpresasClient({ empresas: empresasIniciales }: Props) {
    const router = useRouter()
    const [empresas, setEmpresas] = useState<Empresa[]>(empresasIniciales)

    // Sincronizar estado local con props del servidor cuando hay revalidación
    useEffect(() => {
        setEmpresas(empresasIniciales)
    }, [empresasIniciales])

    const [modalAbierto, setModalAbierto] = useState(false)
    const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null)
    const [empresaAEliminar, setEmpresaAEliminar] = useState<Empresa | null>(null)
    const [loading, setLoading] = useState(false)
    const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false)
    const [invoiceCount, setInvoiceCount] = useState(0)
    const [empresaParaForceDelete, setEmpresaParaForceDelete] = useState<Empresa | null>(null)

    // Handlers para la gestión del estado del modal
    const abrirModalNueva = () => {
        setEmpresaEditando(null)
        setModalAbierto(true)
    }

    const abrirModalEditar = (empresa: Empresa) => {
        setEmpresaEditando(empresa)
        setModalAbierto(true)
    }

    const cerrarModal = () => {
        setModalAbierto(false)
        setEmpresaEditando(null)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            let result
            let empresaId = empresaEditando?.id

            // Operación principal: Crear o Actualizar
            if (empresaEditando) {
                result = await actualizarEmpresaGlobalAction(empresaEditando.id, formData)
            } else {
                result = await crearEmpresaAction(formData)
                if (result.success && result.data) {
                    empresaId = result.data.id
                }
            }

            if (!result.success) {
                toast.error(result.error || 'Error al guardar los datos')
                setLoading(false)
                return
            }

            toast.success(empresaEditando ? 'Datos de la empresa actualizados' : 'Empresa creada con éxito')

            // Actualización Optimista / Local inmediata
            const updatedData = result.data as unknown as Empresa

            if (empresaEditando) {
                setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, ...updatedData } : e))
            } else {
                if (result.data) setEmpresas(prev => [...prev, updatedData])
            }

            cerrarModal()
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Error crítico al guardar la empresa')
        } finally {
            setLoading(false)
        }
    }

    const confirmarEliminar = async (force: boolean = false) => {
        if (!empresaAEliminar) return

        setLoading(true)
        try {
            const result = await eliminarEmpresaAction(empresaAEliminar.id, force)
            if (result.success) {
                toast.success('Empresa eliminada correctamente')
                // Actualización inmediata
                setEmpresas(prev => prev.filter(e => e.id !== empresaAEliminar.id))

                setEmpresaAEliminar(null)
                setShowForceDeleteConfirm(false)
                router.refresh()
            } else if (result.canForceDelete) {
                // Mostrar confirmación secundaria
                setInvoiceCount(result.invoiceCount || 0)
                setEmpresaParaForceDelete(empresaAEliminar) // Guardar empresa para segundo modal
                setShowForceDeleteConfirm(true)
                setEmpresaAEliminar(null) // Cerrar primer modal
            } else {
                toast.error(result.error || 'No se pudo eliminar la empresa')
                setEmpresaAEliminar(null)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al intentar eliminar la empresa')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActivo = async (empresaId: string, activo: boolean) => {
        // Optimistic Update: Cambiar UI inmediatamente
        const nuevoEstado = !activo
        setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, activo: nuevoEstado } : e))

        setLoading(true)
        try {
            const result = await toggleEmpresaActivaAction(empresaId, nuevoEstado)
            if (result.success) {
                toast.success(nuevoEstado ? 'Empresa activada' : 'Empresa desactivada')
                router.refresh()
            } else {
                // Revertir si falla
                setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, activo: activo } : e))
                toast.error(result.error || 'Error al cambiar el estado')
            }
        } catch (error) {
            // Revertir si falla
            setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, activo: activo } : e))
            console.error(error)
            toast.error('Error al procesar el cambio de estado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Cabecera optimizada para móvil */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                        Gestión de Empresas
                    </h1>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
                        Control centralizado de identidades corporativas
                    </p>
                </div>
                <button
                    onClick={abrirModalNueva}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 active:scale-95 touch-manipulation"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Nueva Empresa</span>
                </button>
            </div>

            {/* Contenedor de Tabla con Glassmorphism */}
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Empresa
                                </th>
                                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    CIF
                                </th>
                                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Ciudad
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                            {empresas.map((empresa) => (
                                <tr key={empresa.id} className="group hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-300 hover:scale-[1.005]">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {empresa.logo_url ? (
                                                <Image
                                                    src={empresa.logo_url}
                                                    alt={empresa.razon_social}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-amber-100 dark:border-amber-900/50 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner">
                                                    <Building2 className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                            <div className="max-w-[150px] md:max-w-none truncate">
                                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                                    {empresa.razon_social}
                                                </div>
                                                {empresa.nombre_comercial && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {empresa.nombre_comercial}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                                        {empresa.cif}
                                    </td>
                                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {empresa.ciudad || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${empresa.activo
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
                                            }`}>
                                            {empresa.activo ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                            {/* Los botones usan p-3 o h-11 w-11 para cumplir el área de 44px de Mobile Optimization */}
                                            <button
                                                onClick={() => handleToggleActivo(empresa.id, empresa.activo)}
                                                className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${empresa.activo
                                                    ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800'
                                                    : 'text-slate-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                    }`}
                                                title={empresa.activo ? 'Desactivar empresa' : 'Activar empresa'}
                                                disabled={loading}
                                            >
                                                <div className="relative flex items-center justify-center w-full h-full">
                                                    {empresa.activo ? (
                                                        <Power className="w-5 h-5" />
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 bg-transparent transform rotate-45 border-t-2 border-slate-300 dark:border-slate-600 top-1/2"></div>
                                                            <PowerOff className="w-5 h-5 opacity-50" />
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => abrirModalEditar(empresa)}
                                                className="h-11 w-11 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-all active:scale-90"
                                                title="Editar"
                                                disabled={loading}
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setEmpresaAEliminar(empresa)}
                                                className="h-11 w-11 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-90"
                                                title="Eliminar"
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {empresas.length === 0 && (
                    <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="text-xl font-bold text-slate-400">Sin empresas registradas</p>
                        <p className="text-sm mt-2">Empieza creando una nueva para habilitar la facturación</p>
                    </div>
                )}
            </div>

            {/* Modal de Crear/Editar con Glassmorphism Extremo */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 transition-all">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 flex flex-col scale-in-center">
                        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/5 to-amber-600/5">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                                    {empresaEditando ? 'Refinar Perfil' : 'Alta de Empresa'}
                                </h2>
                                <button onClick={cerrarModal} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                            {/* Campos del Formulario con text-base para Mobile (Evita zoom automático) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-2 block">
                                        Razón Social Oficial *
                                    </label>
                                    <input
                                        type="text"
                                        name="razon_social"
                                        defaultValue={empresaEditando?.razon_social}
                                        required
                                        placeholder="Ej: Antigravity Solutions S.L."
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-base outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-2 block">
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre_comercial"
                                        defaultValue={empresaEditando?.nombre_comercial || ''}
                                        placeholder="Ej: Antigravity ERP"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-base outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-2 block">
                                        Identificación Fiscal (CIF/NIF) *
                                    </label>
                                    <input
                                        type="text"
                                        name="cif"
                                        defaultValue={empresaEditando?.cif}
                                        required
                                        placeholder="B12345678"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-base font-mono outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                                    Localización y Contacto
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-3">
                                        <input
                                            type="text"
                                            name="direccion"
                                            defaultValue={empresaEditando?.direccion || ''}
                                            placeholder="Dirección completa"
                                            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        defaultValue={empresaEditando?.ciudad || ''}
                                        placeholder="Ciudad"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                    />
                                    <input
                                        type="text"
                                        name="provincia"
                                        defaultValue={empresaEditando?.provincia || ''}
                                        placeholder="Provincia"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                    />
                                    <input
                                        type="text"
                                        name="codigo_postal"
                                        defaultValue={empresaEditando?.codigo_postal || ''}
                                        placeholder="C.P."
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input
                                        type="tel"
                                        name="telefono"
                                        defaultValue={empresaEditando?.telefono || ''}
                                        placeholder="Teléfono móvil o fijo"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        defaultValue={empresaEditando?.email || ''}
                                        placeholder="Correo corporativo"
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-base outline-none"
                                    />
                                </div>
                            </div>

                            {/* Footer del Modal */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-inherit pb-2">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="order-2 sm:order-1 flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 touch-manipulation uppercase text-xs tracking-widest"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="order-1 sm:order-2 flex-[2] px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all disabled:opacity-50 touch-manipulation uppercase text-xs tracking-widest"
                                    disabled={loading}
                                >
                                    {loading ? 'Sincronizando...' : (empresaEditando ? 'Guardar Cambios' : 'Confirmar Registro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado con Estilo Glass */}
            {empresaAEliminar && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in zoom-in duration-200">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-red-200/30 dark:border-red-900/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
                                <Trash2 className="w-10 h-10 text-red-600 dark:text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                ¿Deseas eliminar esta empresa?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                Estas a punto de desactivar <span className="text-slate-900 dark:text-white font-black italic">&quot;{empresaAEliminar.razon_social}&quot;</span>.
                                <br />Esta acción restringirá el acceso a nuevas operaciones contables.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setEmpresaAEliminar(null)}
                                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => confirmarEliminar()}
                                    className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
                                    disabled={loading}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación forzada (segundo nivel) */}
            {showForceDeleteConfirm && empresaParaForceDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-amber-200 dark:border-amber-900/50 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-6">
                                <span className="text-4xl">⚠️</span>
                            </div>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-4">
                                Confirmación Requerida
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
                                Esta empresa tiene <strong className="text-amber-600 dark:text-amber-400">{invoiceCount} factura(s)</strong> vinculadas.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
                                Si continúas, la empresa se desactivará pero las facturas se mantendrán en el sistema.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => {
                                        setShowForceDeleteConfirm(false)
                                        setEmpresaParaForceDelete(null)
                                    }}
                                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!empresaParaForceDelete) return
                                        setLoading(true)
                                        try {
                                            const result = await eliminarEmpresaAction(empresaParaForceDelete.id, true)
                                            if (result.success) {
                                                toast.success('Empresa eliminada correctamente')
                                                // Actualización inmediata
                                                setEmpresas(prev => prev.filter(e => e.id !== empresaParaForceDelete.id))

                                                setShowForceDeleteConfirm(false)
                                                setEmpresaParaForceDelete(null)
                                                router.refresh()
                                            } else {
                                                toast.error(result.error || 'No se pudo eliminar la empresa')
                                            }
                                        } catch (error) {
                                            console.error(error)
                                            toast.error('Error al intentar eliminar la empresa')
                                        } finally {
                                            setLoading(false)
                                        }
                                    }}
                                    className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all active:scale-95"
                                    disabled={loading}
                                >
                                    Eliminar de todos modos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
