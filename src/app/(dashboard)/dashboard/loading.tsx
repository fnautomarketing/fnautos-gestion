import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
    return (
        <div className="space-y-8 pb-8">
            {/* Page Header Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 sm:h-10 w-48 sm:w-56" />
                    <Skeleton className="h-4 w-64 sm:w-80" />
                    <div className="flex gap-2 pt-1">
                        <Skeleton className="h-6 w-40 rounded-full" />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Skeleton className="h-10 w-full sm:w-24 rounded-lg" />
                    <Skeleton className="h-10 w-full sm:w-[200px] rounded-lg" />
                    <Skeleton className="h-12 w-full sm:w-40 rounded-lg min-h-[44px]" />
                </div>
            </div>

            {/* KPI Cards Skeleton - 4 cards como en la página real */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border border-slate-200/60 dark:border-slate-700/60 shadow-md overflow-hidden">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-28 mb-2" />
                            <Skeleton className="h-7 sm:h-8 w-24 mb-3" />
                            <Skeleton className="h-8 w-full rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráficos Skeleton - Evolución + Pie como en la página real */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-64 mt-1" />
                    </CardHeader>
                    <CardContent className="pl-6">
                        <div className="h-[260px]">
                            <Skeleton className="h-full w-full rounded" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-48 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px]">
                            <Skeleton className="h-full w-full rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Estados + Vencimientos Skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border border-slate-200/60 dark:border-slate-700/60 shadow-md">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-4 w-36" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex justify-between py-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                        ))}
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 border border-slate-200/60 dark:border-slate-700/60 shadow-md">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-4 w-52" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
