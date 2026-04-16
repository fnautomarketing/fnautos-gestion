import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'
import { clientConfig } from '@/config/clients'
import * as LucideIcons from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    return (
        <main className="flex min-h-screen">
            {/* Left Column: Premium Content (Hidden on Mobile) */}
            <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 group/hero">
                {/* Background: gradient (hero-login.png no existe; evita 404 en prod) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-black via-primary/30 to-[#020202] opacity-95 transition-transform duration-[2000ms] ease-out group-hover/hero:scale-105"
                    aria-hidden
                />

                {/* Overlay Gradients - Animated */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent transition-opacity duration-1000 group-hover/hero:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />

                {/* Animated Particles/Dust (CSS only implementation idea) */}
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-soft-light" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center p-16 w-full h-full text-center">
                    <div className="transform transition-all duration-700 group-hover/hero:translate-y-2 flex flex-col items-center">
                        <div className="relative mb-8">
                            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent rounded-full blur-2xl animate-pulse-slow" />
                            <div className="w-56 h-56 relative group-hover/hero:scale-105 transition-transform duration-1000">
                                <Image src={clientConfig.logoPath} alt={`${clientConfig.nombre} Logo`} fill className="object-contain drop-shadow-[0_0_40px_rgba(var(--primary),0.8)]" />
                            </div>
                        </div>
                        <span className="text-4xl font-serif font-black text-white tracking-[0.2em] uppercase drop-shadow-lg mb-8">{clientConfig.nombre}</span>

                        <div className="space-y-6 max-w-xl flex flex-col items-center">
                            <h2 className="text-6xl font-serif font-extrabold text-white leading-tight drop-shadow-2xl">
                                {clientConfig.tagline.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40 animate-gradient-x italic">{clientConfig.tagline.split(' ')[1]}</span> {clientConfig.tagline.split(' ').slice(2).join(' ')}
                            </h2>
                            <p className="text-xl text-slate-200 font-medium leading-relaxed max-w-md backdrop-blur-md bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/10 text-center mx-auto">
                                {clientConfig.loginDescription}
                                <span className="block mt-6 h-1.5 w-32 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full mx-auto" />
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 border-t border-primary/20 pt-12 backdrop-blur-md bg-white/5 rounded-2xl p-6 transform transition-all duration-500 hover:bg-white/10 hover:border-primary/30 hover:shadow-2xl">
                        {clientConfig.features.map((item, id) => {
                            const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle
                            return (
                                <div key={id} className="flex flex-col items-center text-center space-y-2 group/item cursor-default">
                                    <div className="login-feature-icon-bg w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/40 transition-all duration-300 group-hover/item:scale-110">
                                        <IconComponent className="login-feature-icon w-5 h-5 transition-colors duration-300 text-primary" />
                                    </div>
                                    <h3 className="login-feature-title text-sm font-bold text-white uppercase tracking-wider transition-colors">{item.label}</h3>
                                    <p className="login-feature-desc text-xs text-slate-300 font-medium transition-colors">{item.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Right Column: Login Form */}
            <section className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-16 relative bg-background overflow-hidden">
                {/* Dynamic Animated Background */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[128px] animate-pulse pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-50" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-slate-400/20 blur-[96px] animate-pulse pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-50 animation-delay-2000" />

                {/* Subtle mesh pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('/noise.svg')] bg-repeat brightness-100 contrast-150" />

                <div className="w-full max-w-[440px] px-2 sm:px-4 space-y-8 sm:space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out">
                    {/* Logo & Header - Always Centered */}
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative group cursor-default">
                            {/* Logo Glow Effect */}
                            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-50 group-hover:scale-100" />

                            <div className="relative w-28 h-28 lg:w-32 lg:h-32 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:rotate-3">
                                <Image
                                    src={clientConfig.logoPath}
                                    alt={clientConfig.nombreCorto}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-4xl lg:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-primary to-slate-900 dark:from-white dark:via-primary dark:to-slate-200 tracking-tight">
                                {clientConfig.nombreCorto}
                            </h1>
                            <div className="flex items-center justify-center gap-3 opacity-80">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                                    Acceso Corporativo
                                </p>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
                            </div>
                        </div>
                    </div>

                    <LoginForm />

                    <div className="text-center space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity">
                            {clientConfig.copyright}
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}

