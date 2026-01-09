export default function FaqPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">FAQ</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">How long does shipping take?</h2>
          <p className="text-gray-600">Most orders ship within 2-3 business days.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Can I return an item?</h2>
          <p className="text-gray-600">Yes, we offer a 30-day return window on unused items.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Do you offer support?</h2>
          <p className="text-gray-600">Our support team is available during business hours.</p>
        </div>
      </div>
    </div>
  );
}
