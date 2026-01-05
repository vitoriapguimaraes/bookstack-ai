import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function ScrollToTopBottom({ containerRef }) {
    const [isTop, setIsTop] = useState(true)
    const [isBottom, setIsBottom] = useState(false)

    useEffect(() => {
        const getTarget = () => containerRef?.current || window
        const target = getTarget()
        
        const handleScroll = () => {
            let scrollTop, scrollHeight, clientHeight

            if (target === window) {
                scrollTop = window.scrollY
                scrollHeight = document.documentElement.scrollHeight
                clientHeight = window.innerHeight
            } else {
                scrollTop = target.scrollTop
                scrollHeight = target.scrollHeight
                clientHeight = target.clientHeight
            }

            // Check if at top
            setIsTop(scrollTop <= 100)

            // Check if at bottom (allow small margin of error)
            const isScrollable = scrollHeight > clientHeight
            const isAtBottom = !isScrollable || (scrollTop + clientHeight >= scrollHeight - 50)
            setIsBottom(isAtBottom)
        }

        target.addEventListener('scroll', handleScroll)
        // Also listen on document body/html just in case for window
        if (target === window) {
           document.addEventListener('scroll', handleScroll)
        }
        
        // Initial check
        handleScroll()
        
        return () => {
            target.removeEventListener('scroll', handleScroll)
            if (target === window) {
                document.removeEventListener('scroll', handleScroll)
            }
        }
    }, [containerRef])

    const scrollToTop = () => {
        const target = containerRef?.current || window
        target.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const scrollToBottom = () => {
        const target = containerRef?.current || window
        if (target === window) {
             window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
        } else {
            target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' })
        }
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
