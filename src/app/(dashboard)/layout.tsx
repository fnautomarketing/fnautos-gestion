import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/dashboard/navbar'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar Desktop - Fixed */}
            <Sidebar className="hidden lg:flex" userEmail={user.email} />

            {/* Main Content Area */}
            <div className="lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
                {/* Navbar */}
                <Navbar user={user} />

                {/* Dynamic Page Content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-6 xl:px-8 py-4 md:py-8 lg:py-10 w-full max-w-[min(100%,1600px)] mx-auto pb-24 md:pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </main>
            </div>
        </div>
    )
}
