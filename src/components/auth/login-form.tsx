'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { loginAction } from '@/app/actions/auth'

const loginSchema = z.object({
    email: z.string().email('Por favor, introduce un email válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isError, setIsError] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setIsError(false)

        const formData = new FormData()
        formData.append('email', data.email)
        formData.append('password', data.password)

        const result = await loginAction(formData)

        if (result.success) {
            toast.success('¡Bienvenido!')
            // Retraso intencional para evitar conflictos de renderizado (flushSync) y mostrar el toast
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 500)
        } else {
            toast.error(result.error || 'Error al iniciar sesión')
            setIsLoading(false)
            setIsError(true)
            setTimeout(() => setIsError(false), 500)
        }
    }

    return (
        <div className="relative group/card perspective-1000 w-full min-w-0 max-w-full">
            {/* Dynamic Glow Behind Card */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-50 transition-all duration-700 pointer-events-none ${isError ? 'opacity-100 from-red-500/50 to-red-600/50' : ''}`} />

            <Card className={`relative border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] hover:border-primary/30 z-10 w-full min-w-0 ${isError ? 'animate-shake border-red-500/50' : ''}`}>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <CardHeader className="space-y-1 pb-6 relative z-10">
                    <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                        Bienvenido
                    </CardTitle>
                    <CardDescription className="text-center text-slate-500 dark:text-slate-400 font-medium">
                        Ingresa tus credenciales para continuar
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="relative z-10">
                    <CardContent className="space-y-6">
                        {/* Email Field with Premium Glassmorphism */}
                        <div className="space-y-2 group/input relative">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1 group-focus-within/input:text-primary transition-colors duration-300 flex items-center gap-2">
                                Email Corporativo
                                <span className="h-px w-0 bg-gradient-to-r from-primary to-transparent group-focus-within/input:w-16 transition-all duration-700 ease-out" />
                            </Label>

                            <div className="relative group/field">
                                {/* Animated Golden Neon Glow - Only visible on focus-within or hover - STATIC NO PULSE */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover/field:opacity-50 group-focus-within/input:opacity-100" />

                                {/* Glass Container */}
                                <div className="relative flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl overflow-hidden transition-all duration-500 group-focus-within/input:bg-white dark:group-focus-within/input:bg-slate-950">

                                    {/* Icon Section */}
                                    <div className="w-14 h-14 flex items-center justify-center border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 group-focus-within/input:bg-primary/5 transition-colors duration-500">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-0 group-focus-within/input:scale-150 transition-transform duration-500" />
                                            <Mail className="login-form-icon relative h-5 w-5 group-focus-within/input:scale-110 transition-all duration-500" />
                                        </div>
                                    </div>

                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@stvlogistics.com"
                                        className="h-14 border-0 focus-visible:ring-0 bg-transparent pl-4 pr-12 text-base font-medium placeholder:text-slate-400/50 dark:placeholder:text-slate-600 tracking-wide text-slate-900 dark:text-slate-100"
                                        disabled={isLoading}
                                        {...register('email')}
                                    />

                                    {/* Status Indicator */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-0 group-focus-within/input:opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-200 dark:bg-slate-700 group-focus-within/input:bg-primary transition-colors duration-500 delay-100" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {errors.email && (
                                <p className="text-[11px] font-bold text-destructive uppercase tracking-wide ml-1 animate-in slide-in-from-left-2 fade-in duration-300">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field with Premium Glassmorphism */}
                        <div className="space-y-2 group/input relative">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within/input:text-primary transition-colors duration-300 flex items-center gap-2">
                                    Contraseña
                                    <span className="h-px w-0 bg-gradient-to-r from-primary to-transparent group-focus-within/input:w-16 transition-all duration-700 ease-out" />
                                </Label>
                            </div>

                            <div className="relative group/field">
                                {/* Animated Golden Neon Glow - Only visible on focus-within or hover - STATIC NO PULSE */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover/field:opacity-50 group-focus-within/input:opacity-100" />

                                {/* Glass Container */}
                                <div className="relative flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl overflow-hidden transition-all duration-500 group-focus-within/input:bg-white dark:group-focus-within/input:bg-slate-950">

                                    {/* Icon Section */}
                                    <div className="w-14 h-14 flex items-center justify-center border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 group-focus-within/input:bg-primary/5 transition-colors duration-500">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-0 group-focus-within/input:scale-150 transition-transform duration-500" />
                                            <Lock className="login-form-icon relative h-5 w-5 group-focus-within/input:scale-110 transition-all duration-500" />
                                        </div>
                                    </div>

                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="h-14 border-0 focus-visible:ring-0 bg-transparent pl-4 pr-12 text-base font-medium placeholder:text-slate-400/50 dark:placeholder:text-slate-600 tracking-widest text-slate-900 dark:text-slate-100"
                                        disabled={isLoading}
                                        {...register('password')}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors z-20 group/eye border-l border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="login-form-icon h-5 w-5 transition-colors cursor-pointer" />
                                        ) : (
                                            <Eye className="login-form-icon h-5 w-5 transition-colors cursor-pointer" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-bold text-destructive uppercase tracking-wide ml-1 animate-in slide-in-from-left-2 fade-in duration-300">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                    </CardContent>

                    <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
                        <Button
                            type="submit"
                            className="group/btn relative w-full min-h-[44px] h-14 text-sm font-bold uppercase tracking-widest rounded-xl overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            <div className="absolute inset-0 w-0 bg-primary transition-all duration-[250ms] ease-out group-hover/btn:w-full opacity-100" />
                            <div className="relative flex items-center justify-center gap-2 group-hover/btn:text-slate-900 transition-colors">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Iniciando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Acceder al Portal</span>
                                        <div className="w-1 h-1 bg-current rounded-full opacity-50" />
                                        <span className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300">→</span>
                                    </>
                                )}
                            </div>
                        </Button>

                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                ¿No tienes credenciales?{' '}
                                <button
                                    type="button"
                                    className="text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary font-bold transition-colors ml-1"
                                    onClick={() => toast.info('Registro corporativo', {
                                        description: 'Contacta a RRHH para solicitar tu acceso.',
                                    })}
                                >
                                    Solicitar Acceso
                                </button>
                            </p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
