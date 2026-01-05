import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function ScrollToTopBottom() {
    const [isTop, setIsTop] = useState(true)
    const [isBottom, setIsBottom] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const scrollHeight = document.documentElement.scrollHeight
            const clientHeight = document.documentElement.clientHeight

            // Check if at top
            setIsTop(scrollTop <= 20)

            // Check if at bottom (allow small margin of error)
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 20)
        }

        window.addEventListener('scroll', handleScroll)
        // Initial check
        handleScroll()
        
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }

    return (
        <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
            <button
                onClick={scrollToTop}
                disabled={isTop}
                className={`p-3 rounded-full shadow-lg transition-all ${
                    isTop 
                    ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-50' 
                    : 'bg-slate-800 dark:bg-neutral-700 text-white hover:bg-slate-700 dark:hover:bg-neutral-600 hover:scale-110'
                }`}
                title="Ir para o topo"
            >
                <ArrowUp size={20} />
            </button>
            <button
                onClick={scrollToBottom}
                disabled={isBottom}
                className={`p-3 rounded-full shadow-lg transition-all ${
                    isBottom
                    ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-50' 
                    : 'bg-slate-800 dark:bg-neutral-700 text-white hover:bg-slate-700 dark:hover:bg-neutral-600 hover:scale-110'
                }`}
                title="Ir para o final"
            >
                <ArrowDown size={20} />
            </button>
        </div>
    )
}
