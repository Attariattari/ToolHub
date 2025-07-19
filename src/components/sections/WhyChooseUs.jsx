"use client"

import { motion } from "framer-motion"

const features = [
  {
    icon: "🆓",
    title: "Completely Free",
    description: "All our PDF tools are 100% free to use with no hidden charges or subscriptions required.",
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Process your PDF files in seconds with our optimized algorithms and powerful servers.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    description: "Your files are automatically deleted after processing. We never store or share your documents.",
  },
  {
    icon: "🌐",
    title: "Browser-Based",
    description: "No software installation required. Works directly in your browser on any device.",
  },
  {
    icon: "📱",
    title: "Mobile Friendly",
    description: "Fully responsive design that works perfectly on desktop, tablet, and mobile devices.",
  },
  {
    icon: "🎯",
    title: "Easy to Use",
    description: "Simple, intuitive interface that anyone can use without technical knowledge.",
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Our PDF Tools?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We've built the most user-friendly and powerful PDF tools on the web. Here's what makes us different.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-sm border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.a
            whileTap={{ scale: 0.95 }}
            href="#tools"
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-2.5 rounded-full text-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
          >
            Try Our Tools Now
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
