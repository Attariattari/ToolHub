"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiPlus,
  FiMinus,
  FiSend,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiInstagram,
} from "react-icons/fi"

export default function ContactPage() {
  const [activeAccordion, setActiveAccordion] = useState(null)

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const faqs = [
    {
      question: "How secure are my PDF files on your platform?",
      answer:
        "Your privacy and security are our top priorities. All files uploaded to our platform are processed in your browser and are not stored on our servers permanently. We use secure HTTPS connections to ensure your data remains protected during transmission. Files are automatically deleted after processing or when you close your browser session.",
    },
    {
      question: "Are there any file size limitations?",
      answer:
        "Our free plan allows you to process PDF files up to 100MB in size. For larger files or batch processing, we offer premium plans with increased limits and additional features. The file size limitations are in place to ensure optimal performance for all users.",
    },
    {
      question: "Can I use your tools on mobile devices?",
      answer:
        "Yes, all our PDF tools are fully responsive and work on desktop, tablet, and mobile devices. You can access and use our tools from any modern browser on any device with an internet connection.",
    },
    {
      question: "Do I need to create an account to use your tools?",
      answer:
        "No, you can use our basic PDF tools without creating an account. However, creating a free account allows you to access your processing history, save preferences, and unlock additional features.",
    },
    {
      question: "How do I report issues or bugs?",
      answer:
        "If you encounter any issues or bugs while using our tools, please contact our support team through the contact form on this page or email us directly at support@pdftoolshub.com. Please include details about the issue, the tool you were using, and your device/browser information.",
    },
    {
      question: "What file formats do you support?",
      answer:
        "We support PDF files as our primary format, along with common image formats (JPG, PNG), Microsoft Office documents (Word, Excel, PowerPoint), and various other document formats for conversion purposes.",
    },
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section with SVG Background */}
      <section className="relative py-20 bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden">
        {/* Background SVG Elements */}
        <div className="absolute inset-0">
          {/* Top Right Circle */}
          <svg
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
            <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
            <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
          </svg>

          {/* Bottom Left Circle */}
          <svg
            className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
            width="300"
            height="300"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
            <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
          </svg>

          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Get in Touch
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
            >
              Have questions about our PDF tools? Need support or want to share feedback? We're here to help and would
              love to hear from you.
            </motion.p>
          </div>
        </div>
      </section>

     

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Reach out to us through any of the following channels. We're committed to providing you with the best
                support possible.
              </p>

              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <FiMail className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600 mb-1">support@pdftoolshub.com</p>
                    <p className="text-gray-600">info@pdftoolshub.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <FiPhone className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
                    <p className="text-gray-600 mb-1">+1 (234) 567-890</p>
                    <p className="text-gray-600">Monday - Friday, 9AM - 5PM EST</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <FiMapPin className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Us</h3>
                    <p className="text-gray-600 mb-1">123 PDF Street</p>
                    <p className="text-gray-600">Tech City, TC 12345</p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-red-400 border border-red-300 justify-center hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <FiTwitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-red-400 border border-red-300 justify-center hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <FiFacebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-red-400 border border-red-300 justify-center hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <FiLinkedin className="w-5 h-5" />
                </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-red-400 border border-red-300 justify-center hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <FiInstagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center hover:shadow-lg transition-all duration-300"
                >
                  <FiSend className="mr-2" />
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-0">
        <div className="w-full h-96 bg-gray-200 relative overflow-hidden">
          {/* Full-size Google Map iframe */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14162494.598794846!2d58.366986590469985!3d29.932256453933938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38db52d2f8fd751f%3A0x46b7a1f7e614925c!2sPakistan!5e0!3m2!1sen!2s!4v1748790043169!5m2!1sen!2s"
            className="absolute inset-0 w-full h-full"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our PDF tools and services.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="flex justify-between items-center w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <div className="flex-shrink-0">
                      {activeAccordion === index ? (
                        <FiMinus className="w-5 h-5 text-red-600" />
                      ) : (
                        <FiPlus className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: activeAccordion === index ? "auto" : 0,
                      opacity: activeAccordion === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 text-gray-600 border-t border-gray-200 bg-gray-50">
                      <p className="leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
