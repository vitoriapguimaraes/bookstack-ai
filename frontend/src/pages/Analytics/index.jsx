import { useRef } from 'react'
import Analytics from '../../components/Analytics'
import ScrollToTopBottom from '../../components/ScrollToTopBottom'

export default function AnalyticsView({ books }) {
  const scrollContainerRef = useRef(null)

  return (
    <div ref={scrollContainerRef} className="animate-fade-in h-[calc(100vh-4rem)] overflow-y-auto">
      <Analytics books={books} />
      <ScrollToTopBottom containerRef={scrollContainerRef} />
    </div>
  )
}
