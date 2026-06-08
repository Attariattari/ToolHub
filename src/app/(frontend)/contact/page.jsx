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
  FiCheckCircle,
} from "react-icons/fi"
import { toast } from "react-toastify"
import Api from "@/utils/Api"

export default function ContactPage() {
  const [activeAccordion, setActiveAccordion] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters"
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await Api.post("/inquiries/submit", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })

      if (response.data.success) {
        setIsSubmitted(true)
        toast.success("Message sent successfully! We'll get back to you soon.")

        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false)
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            subject: "",
            message: "",
          })
        }, 5000)
      }
    } catch (error) {
      console.error("Error submitting form:", error)

      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.status === 400) {
        toast.error("Please check all required fields")
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.")
      } else {
        toast.error("Failed to send message. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
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
        "Yes, all our PDFDEX are fully responsive and work on desktop, tablet, and mobile devices. You can access and use our tools from any modern browser on any device with an internet connection.",
    },
    {
      question: "Do I need to create an account to use your tools?",
      answer:
        "No, you can use our basic PDFDEX without creating an account. However, creating a free account allows you to access your processing history, save preferences, and unlock additional features.",
    },
    {
      question: "How do I report issues or bugs?",
      answer:
        "If you encounter any issues or bugs while using our tools, please contact our support team through the contact form on this page or email us directly at support@pdfdex.com. Please include details about the issue, the tool you were using, and your device/browser information.",
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
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
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
            <h1
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Get in Touch
            </h1>
            <p
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
            >
              Have questions about our PDFDEX? Need support or want to share feedback? We're here to help and would
              love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div
              // initial={{ opacity: 0, x: -30 }}
              // whileInView={{ opacity: 1, x: 0 }}
              // transition={{ duration: 0.6 }}
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
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FiMail className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600 mb-1">support@pdfdex.com</p>
                    <p className="text-gray-600">info@pdfdex.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
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
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
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
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <FiTwitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <FiFacebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <FiInstagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div
              // initial={{ opacity: 0, x: 30 }}
              // whileInView={{ opacity: 1, x: 0 }}
              // transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>

              {/* Success State */}
              {isSubmitted ? (
                <div
                  // initial={{ opacity: 0, scale: 0.8 }}
                  // animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out to us. We've received your message and will get back to you within 24 hours.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                    <p className="text-green-700 text-sm">
                      ✓ Your inquiry has been logged<br />
                      ✓ Confirmation email sent<br />
                      ✓ Our team will respond soon
                    </p>
                  </div>
                </div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black transition-colors ${errors.firstName
                            ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-blue-600">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black transition-colors ${errors.lastName
                            ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-blue-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black transition-colors ${errors.email
                          ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-blue-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black transition-colors ${errors.subject
                          ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      placeholder="How can we help you?"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-blue-600">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black transition-colors resize-none ${errors.message
                          ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-blue-600">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
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
          <div
            // initial={{ opacity: 0, y: 30 }}
            // whileInView={{ opacity: 1, y: 0 }}
            // transition={{ duration: 0.6 }}
            // viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our PDFDEX and services.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  // initial={{ opacity: 0, y: 20 }}
                  // whileInView={{ opacity: 1, y: 0 }}
                  // transition={{ duration: 0.5, delay: index * 0.1 }}
                  // viewport={{ once: true }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="flex justify-between items-center w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <div className="flex-shrink-0">
                      {activeAccordion === index ? (
                        <FiMinus className="w-5 h-5 text-blue-600" />
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import { motion } from "framer-motion"
// import {
//   FiMail,
//   FiPhone,
//   FiMapPin,
//   FiPlus,
//   FiMinus,
//   FiSend,
//   FiTwitter,
//   FiFacebook,
//   FiLinkedin,
//   FiInstagram,
// } from "react-icons/fi"

// export default function ContactPage() {
//   const [activeAccordion, setActiveAccordion] = useState(null)

//   const toggleAccordion = (index) => {
//     setActiveAccordion(activeAccordion === index ? null : index)
//   }

//   const faqs = [
//     {
//       question: "How secure are my PDF files on your platform?",
//       answer:
//         "Your privacy and security are our top priorities. All files uploaded to our platform are processed in your browser and are not stored on our servers permanently. We use secure HTTPS connections to ensure your data remains protected during transmission. Files are automatically deleted after processing or when you close your browser session.",
//     },
//     {
//       question: "Are there any file size limitations?",
//       answer:
//         "Our free plan allows you to process PDF files up to 100MB in size. For larger files or batch processing, we offer premium plans with increased limits and additional features. The file size limitations are in place to ensure optimal performance for all users.",
//     },
//     {
//       question: "Can I use your tools on mobile devices?",
//       answer:
//         "Yes, all our PDFDEX are fully responsive and work on desktop, tablet, and mobile devices. You can access and use our tools from any modern browser on any device with an internet connection.",
//     },
//     {
//       question: "Do I need to create an account to use your tools?",
//       answer:
//         "No, you can use our basic PDFDEX without creating an account. However, creating a free account allows you to access your processing history, save preferences, and unlock additional features.",
//     },
//     {
//       question: "How do I report issues or bugs?",
//       answer:
//         "If you encounter any issues or bugs while using our tools, please contact our support team through the contact form on this page or email us directly at support@pdfdex.com. Please include details about the issue, the tool you were using, and your device/browser information.",
//     },
//     {
//       question: "What file formats do you support?",
//       answer:
//         "We support PDF files as our primary format, along with common image formats (JPG, PNG), Microsoft Office documents (Word, Excel, PowerPoint), and various other document formats for conversion purposes.",
//     },
//   ]

//   return (
//     <div className="bg-white min-h-screen">
//       {/* Hero Section with SVG Background */}
//       <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
//         {/* Background SVG Elements */}
//         <div className="absolute inset-0">
//           {/* Top Right Circle */}
//           <svg
//             className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
//             width="400"
//             height="400"
//             viewBox="0 0 400 400"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
//             <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
//             <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
//           </svg>

//           {/* Bottom Left Circle */}
//           <svg
//             className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
//             width="300"
//             height="300"
//             viewBox="0 0 300 300"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
//             <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
//           </svg>

//           {/* Floating Elements */}
//           <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
//           <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
//           <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
//         </div>

//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//           <div className="text-center">
//             <motion.h1
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6 }}
//               className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
//             >
//               Get in Touch
//             </motion.h1>
//             <motion.p
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: 0.2 }}
//               className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
//             >
//               Have questions about our PDFDEX? Need support or want to share feedback? We're here to help and would
//               love to hear from you.
//             </motion.p>
//           </div>
//         </div>
//       </section>

     

//       {/* Contact Section */}
//       <section className="py-20 bg-gray-50">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
//             {/* Contact Information */}
//             <motion.div
//               initial={{ opacity: 0, x: -30 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
//               <p className="text-gray-600 mb-8 text-lg">
//                 Reach out to us through any of the following channels. We're committed to providing you with the best
//                 support possible.
//               </p>

//               <div className="space-y-8">
//                 <div className="flex items-start">
//                   <div className="flex-shrink-0">
//                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
//                       <FiMail className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
//                     <p className="text-gray-600 mb-1">support@pdfdex.com</p>
//                     <p className="text-gray-600">info@pdfdex.com</p>
//                   </div>
//                 </div>

//                 <div className="flex items-start">
//                   <div className="flex-shrink-0">
//                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
//                       <FiPhone className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
//                     <p className="text-gray-600 mb-1">+1 (234) 567-890</p>
//                     <p className="text-gray-600">Monday - Friday, 9AM - 5PM EST</p>
//                   </div>
//                 </div>

//                 <div className="flex items-start">
//                   <div className="flex-shrink-0">
//                     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
//                       <FiMapPin className="w-6 h-6 text-white" />
//                     </div>
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Us</h3>
//                     <p className="text-gray-600 mb-1">123 PDF Street</p>
//                     <p className="text-gray-600">Tech City, TC 12345</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Social Media */}
//               <div className="mt-12">
//                 <h3 className="text-xl font-semibold text-gray-900 mb-4">Follow Us</h3>
//                 <div className="flex space-x-4">
//                   <a
//                     href="#"
//                     className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
//                   >
//                     <FiTwitter className="w-5 h-5" />
//                   </a>
//                   <a
//                     href="#"
//                     className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
//                   >
//                     <FiFacebook className="w-5 h-5" />
//                   </a>
//                   <a
//                     href="#"
//                     className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
//                   >
//                     <FiLinkedin className="w-5 h-5" />
//                 </a>
//                   <a
//                     href="#"
//                     className="w-10 h-10 bg-gray-200 rounded-full flex items-center text-blue-400 border border-blue-300 justify-center hover:bg-blue-600 hover:text-white transition-colors"
//                   >
//                     <FiInstagram className="w-5 h-5" />
//                   </a>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Contact Form */}
//             <motion.div
//               initial={{ opacity: 0, x: 30 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.6 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
//               <form className="space-y-6">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                   <div>
//                     <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
//                       First Name
//                     </label>
//                     <input
//                       type="text"
//                       id="firstName"
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                       placeholder="John"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
//                       Last Name
//                     </label>
//                     <input
//                       type="text"
//                       id="lastName"
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                       placeholder="Doe"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                     Email Address
//                   </label>
//                   <input
//                     type="email"
//                     id="email"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                     placeholder="john@example.com"
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
//                     Subject
//                   </label>
//                   <input
//                     type="text"
//                     id="subject"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                     placeholder="How can we help you?"
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
//                     Message
//                   </label>
//                   <textarea
//                     id="message"
//                     rows={6}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-[1px] bg-gray-200 text-black focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
//                     placeholder="Tell us more about your inquiry..."
//                   ></textarea>
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center hover:shadow-lg transition-all duration-300"
//                 >
//                   <FiSend className="mr-2" />
//                   Send Message
//                 </button>
//               </form>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Map Section */}
//       <section className="py-0">
//         <div className="w-full h-96 bg-gray-200 relative overflow-hidden">
//           {/* Full-size Google Map iframe */}
//           <iframe
//             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14162494.598794846!2d58.366986590469985!3d29.932256453933938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38db52d2f8fd751f%3A0x46b7a1f7e614925c!2sPakistan!5e0!3m2!1sen!2s!4v1748790043169!5m2!1sen!2s"
//             className="absolute inset-0 w-full h-full"
//             allowFullScreen=""
//             loading="lazy"
//             referrerPolicy="no-referrer-when-downgrade"
//           ></iframe>
//         </div>
//       </section>

//       {/* FAQ Section */}
//       <section className="py-20 bg-white">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
//             <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//               Find answers to common questions about our PDFDEX and services.
//             </p>
//           </motion.div>

//           <div className="max-w-3xl mx-auto">
//             <div className="space-y-4">
//               {faqs.map((faq, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5, delay: index * 0.1 }}
//                   viewport={{ once: true }}
//                   className="border border-gray-200 rounded-lg overflow-hidden"
//                 >
//                   <button
//                     className="flex justify-between items-center w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
//                     onClick={() => toggleAccordion(index)}
//                   >
//                     <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
//                     <div className="flex-shrink-0">
//                       {activeAccordion === index ? (
//                         <FiMinus className="w-5 h-5 text-blue-600" />
//                       ) : (
//                         <FiPlus className="w-5 h-5 text-gray-400" />
//                       )}
//                     </div>
//                   </button>

//                   <motion.div
//                     initial={false}
//                     animate={{
//                       height: activeAccordion === index ? "auto" : 0,
//                       opacity: activeAccordion === index ? 1 : 0,
//                     }}
//                     transition={{ duration: 0.3 }}
//                     className="overflow-hidden"
//                   >
//                     <div className="px-6 py-4 text-gray-600 border-t border-gray-200 bg-gray-50">
//                       <p className="leading-relaxed">{faq.answer}</p>
//                     </div>
//                   </motion.div>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }
