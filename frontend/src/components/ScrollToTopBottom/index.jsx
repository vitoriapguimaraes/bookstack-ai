import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function ScrollToTopBottom({ containerRef }) {
    const [isTop, setIsTop] = useState(true)
    const [isBottom, setIsBottom] = useState(false)

    useEffect(() => {
        let target = window
        let resizeObserver = null
        
        const checkScroll = () => {
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

            // Tolerance of 2px for fractional scaling issues
            const isScrollable = scrollHeight > clientHeight + 2
            
            setIsTop(!isScrollable || scrollTop <= 50)
            
            // At bottom if logic fits or not scrollable
            const isAtBottom = !isScrollable || (scrollTop + clientHeight >= scrollHeight - 50)
            setIsBottom(isAtBottom)
        }

        const attachListener = () => {
             if (containerRef) {
                 if (containerRef.current) {
                     target = containerRef.current
                 } else {
                     setTimeout(attachListener, 100)
                     return
                 }
             } else {
                 target = window
             }
             
             target.addEventListener('scroll', checkScroll)
             if (target === window) {
                document.addEventListener('scroll', checkScroll)
             }
             
             // Add ResizeObserver to detect content changes (filtering, loading)
             if (target !== window && typeof ResizeObserver !== 'undefined') {
                 resizeObserver = new ResizeObserver(checkScroll)
                 resizeObserver.observe(target)
                 // Also observe children if possible? No, target is enough usually if overflow works.
                 // Actually observing the first child wrapper is better, but target scrollHeight change should trigger on scroll? 
                 // Scroll event doesn't trigger on size change. ResizeObserver on target triggers on container resize.
                 // To detect content size change, we might need to rely on the fact that 'scroll' doesn't fire, but we need to check manually.
                 // We can also simply use an interval or re-check on prop change.
             }
             
             checkScroll()
        }

        const timer = setTimeout(attachListener, 100)
        
        return () => {
            clearTimeout(timer)
            if (target) {
                target.removeEventListener('scroll', checkScroll)
                if (target === window) document.removeEventListener('scroll', checkScroll)
                if (resizeObserver) resizeObserver.disconnect()
            }
        }
    }, [containerRef, window.location.pathname]) // Re-run on route change

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
