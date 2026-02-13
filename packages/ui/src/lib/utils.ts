import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging tailwind classes with clsx logic.
 * Essential for building composable shadcn-style components.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
