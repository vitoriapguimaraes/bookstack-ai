import Analytics from '../components/Analytics'

export default function AnalyticsView({ books }) {
  return (
    <div className="pb-20 animate-fade-in">
      <Analytics books={books} />
    </div>
  )
}
