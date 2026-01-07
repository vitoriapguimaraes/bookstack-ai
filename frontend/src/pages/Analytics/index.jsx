import Analytics from "../../components/Analytics/index.jsx";

export default function AnalyticsView({ books }) {
  return (
    <div className="animate-fade-in w-full">
      <Analytics books={books} />
    </div>
  );
}
