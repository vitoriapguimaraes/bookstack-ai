import Analytics from '../../components/Analytics'

export default function AnalyticsView({ books }) {
  // Ref not needed for window scroll
  return (
    <div className="animate-fade-in w-full">
      <Analytics books={books} />
    </div>
  )
}
