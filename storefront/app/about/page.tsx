export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <p className="text-amber-500 font-semibold mb-2">About Dawon</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Mobility designed with care, engineered for confidence.
          </h1>
          <p className="text-gray-600 mb-4">
            We build and curate premium rollators, walkers, and smart mobility tools that help people
            move freely and live independently. Our products will be field-tested with real users and
            refined with clinical partners.
          </p>
          <p className="text-gray-600">
            From lightweight frames to digital safety features, every detail is selected to make daily
            movement feel secure and dignified.
          </p>
        </div>
        <div className="relative">
          <img
            src="/dawon-mission.png"
            alt="Dawon mission"
            className="w-full rounded-2xl shadow-lg"
          />
          <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-500">Trusted by</p>
            <p className="text-xl font-bold text-gray-900">aim to serve 120+ families</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {[
          {
            title: "Our Mission",
            body: "Build mobility solutions that blend safety, comfort, and modern design.",
          },
          {
            title: "Our Promise",
            body: "Every product is inspected, tested, and supported by a real human team.",
          },
          {
            title: "Our Impact",
            body: "We partner with clinics and caregivers to keep people moving confidently.",
          },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-600">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
        <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-100">
          <video
            controls
            autoPlay
            muted
            playsInline
            poster="/videos/lab_rollator_poster.png"
            className="w-full h-full"
          >
            <source src="/videos/lab_rollator.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div>
          <p className="text-amber-500 font-semibold mb-2">Design Lab</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Planning to Build with real-world testing from imagination & specs.
          </h2>
          <p className="text-gray-600 mb-4">
            Our engineers and clinical advisors will test every model for stability, turning radius,
            brake responsiveness, and long-term comfort.
          </p>
          <p className="text-gray-600">
            The planning process is a lineup of mobility products that feel effortless on day one and reliable
            for years.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Our Work</h2>
          <p className="text-gray-500">From concept to community</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <img src="/dawon-products.jpg" alt="Dawon products" className="rounded-2xl shadow" />
          <img src="/rol.jpg" alt="Rollator in use" className="rounded-2xl shadow" />
          <img src="/upcoming-cophyfit.jpg" alt="Upcoming innovations" className="rounded-2xl shadow" />
        </div>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Meet the Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            
            { name: "Prof. Anita Hökelman", role: "Main Advisor", image: "/team-anita.jpg" },
            { name: "Prof. Edelmann", role: "Advisor", image: "/team-edelmann.jpg" },
            { name: "Ph.D. Niharika Bandaru", role: "Lead", image: "/team-niharika.jpg" },
            { name: "M.Sc. Janardhanreddy", role: "Employee", image: "/team-janardhan.jpg" },
          ].map((member) => (
            <div key={member.name} className="bg-white rounded-2xl shadow p-4">
              <img src={member.image} alt={member.name} className="w-full h-56 object-cover rounded-xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
