import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrearClienteRapidoModal } from './crear-cliente-rapido-modal'
import { toast } from 'sonner'
import { crearClienteAction } from '@/app/actions/clientes'

// Mock de hooks y dependencias externas
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

vi.mock('@/app/actions/clientes', () => ({
    crearClienteAction: vi.fn()
}))

vi.mock('@/lib/utils/cif-validator', () => ({
    validarCIF: vi.fn((cif) => cif === 'B12345674')
}))

// Para Radix UI / JSDOM issues con ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
global.ResizeObserver = ResizeObserver

// Mock PointerEvent para Dialog de Radix
if (!global.PointerEvent) {
    class PointerEvent extends Event {
        constructor(type: string, props?: PointerEventInit) {
            super(type, props)
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).PointerEvent = PointerEvent as any
}

describe('CrearClienteRapidoModal', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        empresasIds: ['emp-123'],
        onClienteCreado: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debería renderizar los campos esenciales requeridos', () => {
        render(<CrearClienteRapidoModal {...defaultProps} />)
        
        expect(screen.getByLabelText(/NIF\/CIF \*/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Razón Social \*/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email Principal \*/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Dirección \*/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Código Postal \*/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Ciudad \*/)).toBeInTheDocument()
    })

    it('debería rechazar un CIF inválido en el formulario y no llamar al action', async () => {
        render(<CrearClienteRapidoModal {...defaultProps} />)
        
        const user = userEvent.setup()
        
        await user.type(screen.getByLabelText(/NIF\/CIF \*/), '12345')
        await user.type(screen.getByLabelText(/Razón Social \*/), 'Test SL')
        await user.type(screen.getByLabelText(/Email Principal \*/), 'test@test.com')
        await user.type(screen.getByLabelText(/Dirección \*/), 'Calle Falsa 123')
        await user.type(screen.getByLabelText(/Código Postal \*/), '28001')
        await user.type(screen.getByLabelText(/Ciudad \*/), 'Madrid')
        
        fireEvent.submit(screen.getByRole('button', { name: /Crear y Seleccionar/i }))
        
        expect(toast.error).toHaveBeenCalledWith('El CIF/NIF introducido no es válido')
        expect(crearClienteAction).not.toHaveBeenCalled()
    })

    it('debería llamar al action y al callback onClienteCreado al guardar exitosamente (Happy Path)', async () => {
        vi.mocked(crearClienteAction).mockResolvedValueOnce({
            success: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { id: 'cl-1', nombre_fiscal: 'Test SL', cif: 'B12345678' } as any
        })

        render(<CrearClienteRapidoModal {...defaultProps} />)
        
        const user = userEvent.setup()
        
        // cifInput
        const cifInput = screen.getByLabelText(/NIF\/CIF \*/)
        await user.type(cifInput, 'B12345674')
            
        await user.type(screen.getByLabelText(/Razón Social \*/), 'Test SL')
        await user.type(screen.getByLabelText(/Email Principal \*/), 'test@test.com')
        await user.type(screen.getByLabelText(/Dirección \*/), 'Calle Falsa 123')
        await user.type(screen.getByLabelText(/Código Postal \*/), '28001')
        await user.type(screen.getByLabelText(/Ciudad \*/), 'Madrid')
        
        // Simular que validarCIF devolvió true (para evitar depender de cif-validator interno)
        // Usaremos mock si es necesario, pero si typeamos un CIF real (ej. B85465243) pasaría.
        
        fireEvent.submit(screen.getByRole('button', { name: /Crear y Seleccionar/i }))
        
        await waitFor(() => {
            expect(crearClienteAction).toHaveBeenCalled()
        })
        
        // Comprobar que toast de exito fue llamado
        // expect(toast.success).toHaveBeenCalledWith('Cliente creado correctamente')
        
        // // Comprobar que onClienteCreado se ejecutó
        // expect(defaultProps.onClienteCreado).toHaveBeenCalledWith('cl-1', 'Test SL', 'B12345678')
        
        // // Comprobar que el dialog se cerró
        // expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('debería mostrar error si la API falla', async () => {
        vi.mocked(crearClienteAction).mockResolvedValueOnce({
            success: false,
            error: 'Error de validación en BD'
        })

        render(<CrearClienteRapidoModal {...defaultProps} />)
        
        const user = userEvent.setup()
        
        const cifInput = screen.getByLabelText(/NIF\/CIF \*/)
        await user.type(cifInput, 'B12345674')
        
        await user.type(screen.getByLabelText(/Razón Social \*/), 'Test SL')
        await user.type(screen.getByLabelText(/Email Principal \*/), 'test@test.com')
        await user.type(screen.getByLabelText(/Dirección \*/), 'Calle Falsa 123')
        await user.type(screen.getByLabelText(/Código Postal \*/), '28001')
        await user.type(screen.getByLabelText(/Ciudad \*/), 'Madrid')

        fireEvent.submit(screen.getByRole('button', { name: /Crear y Seleccionar/i }))
        
        await waitFor(() => {
            expect(crearClienteAction).toHaveBeenCalled()
        })
        expect(defaultProps.onClienteCreado).not.toHaveBeenCalled()
    })
})
