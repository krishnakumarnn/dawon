export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
      <p className="text-gray-600 mb-6">
        Have a question or need help with an order? Reach out and our team will respond quickly.
      </p>
      <div className="bg-white rounded-lg shadow p-6 max-w-xl">
        <p className="text-gray-700 mb-2"><span className="font-semibold">Email:</span> info@dawstore.com</p>
        <p className="text-gray-700 mb-2"><span className="font-semibold">Phone:</span> (555) 123-4567</p>
        <p className="text-gray-700"><span className="font-semibold">Hours:</span> Monday - Friday, 9AM - 6PM</p>
      </div>
    </div>
  );
}
