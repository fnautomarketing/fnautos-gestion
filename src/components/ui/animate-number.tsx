'use client'

import { useEffect, useState } from 'react'

export function AnimateNumber({ value, formatter = (v: number) => String(v), duration = 1000 }: { value: number, formatter?: (v: number) => string, duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let startTimestamp: number | null = null
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            setDisplayValue(progress * value)
            if (progress < 1) {
                window.requestAnimationFrame(step)
            } else {
                setDisplayValue(value)
            }
        }
        window.requestAnimationFrame(step)
    }, [value, duration])

    return <>{formatter(displayValue)}</>
}
