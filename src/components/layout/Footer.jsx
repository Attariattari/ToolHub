"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiTwitter,
  FiLinkedin,
  FiGithub,
  FiFacebook,
} from "react-icons/fi"
import { CompressPDFIcon, MergePDFIcon, PDFToWordIcon, SplitPDFIcon, WordToPDFIcon } from "../icons/pdfIcons"

const popularTools = [
  { name: "Merge PDF", icon: MergePDFIcon, url: "/merge-pdf" },
  { name: "Split PDF", icon: SplitPDFIcon, url: "/split-pdf" },
  { name: "Compress PDF", icon: CompressPDFIcon, url: "/compress-pdf" },
  { name: "PDF to Word", icon: PDFToWordIcon, url: "/pdf-to-word" },
  { name: "Word to PDF", icon: WordToPDFIcon, url: "/word-to-pdf" },
  // { name: "PDF to JPG", icon: FiImage, url: "/pdf-to-jpg" },
  // { name: "Edit PDF", icon: FiEdit3, url: "/edit-pdf" },
  // { name: "Rotate PDF", icon: FiRotateCw, url: "/rotate-pdf" },
]

const companyLinks = [
  // { name: "About Us", url: "/about" },
  { name: "Blogs", url: "/blogs" },
  { name: "Contact Us", url: "/contact" },
  { name: "Privacy Policy", url: "/privacy" },
  { name: "Terms of Service", url: "/terms" },
  // { name: "Support", url: "/support" },
  // { name: "FAQ", url: "/faq" },
  // { name: "Careers", url: "/careers" },
]

export default function Footer() {
  return (
    <footer id="contact" className="bg-white border-t border-gray-200 py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="17"
                    x2="8"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="10,9 9,9 8,9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">PDF ToolsHub</span>
            </Link>
            <p className="text-gray-600 leading-relaxed max-w-md mb-6">
              The most comprehensive collection of PDF tools on the web. Free, fast, and secure. Process your documents
              with confidence and ease.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <FiTwitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <FiFacebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <FiLinkedin className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="#"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <FiGithub className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Popular Tools */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tools</h3>
            <ul className="space-y-3">
              {popularTools.map((tool) => (
                <li key={tool.name}>
                  <Link
                    href={tool.url}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <tool.icon className="w-4 h-4" />
                    <span className="text-sm">{tool.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.url} className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiMail className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href="mailto:support@pdftoolshub.com" className="text-sm text-gray-900 hover:text-red-600">
                    support@pdftoolshub.com
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiPhone className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href="tel:+1234567890" className="text-sm text-gray-900 hover:text-red-600">
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiMapPin className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm text-gray-900">123 PDF Street, Tech City, TC 12345</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-600 text-sm">© 2024 PDF ToolsHub. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
              Terms
            </Link>
            {/* <Link href="/cookies" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
              Cookies
            </Link>
            <Link href="/sitemap" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
              Sitemap
            </Link> */}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
