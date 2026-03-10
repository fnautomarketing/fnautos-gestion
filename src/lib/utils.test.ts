import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
        expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('should handle tailwind merge conflicts', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8') // tailwind-merge should sustain last one
    })
})
