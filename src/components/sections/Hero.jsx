"use client"

import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-8 lg:py-20">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5"></div>

      {/* Larger blurred circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-red-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"></div>

      {/* Additional decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-red-300/10 rounded-full blur-xl"></div>

      {/* Small floating circles */}
      <div className="absolute top-20 right-[20%] w-3 h-3 bg-red-500/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 left-[15%] w-2 h-2 bg-orange-500/30 rounded-full animate-pulse delay-700"></div>
      <div className="absolute bottom-20 right-[30%] w-4 h-4 bg-red-400/20 rounded-full animate-pulse delay-1000"></div>

      {/* Decorative SVG patterns */}
      <svg className="absolute top-0 right-0 opacity-10" width="400" height="400" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="150" stroke="rgba(220, 38, 38, 0.5)" strokeWidth="2" strokeDasharray="8 8" />
        <circle cx="200" cy="200" r="100" stroke="rgba(220, 38, 38, 0.3)" strokeWidth="2" />
      </svg>

      <svg className="absolute bottom-0 left-0 opacity-10" width="300" height="300" viewBox="0 0 300 300" fill="none">
        <circle cx="150" cy="150" r="100" stroke="rgba(234, 88, 12, 0.5)" strokeWidth="2" strokeDasharray="12 12" />
        <circle cx="150" cy="150" r="50" stroke="rgba(234, 88, 12, 0.3)" strokeWidth="2" />
      </svg>

      {/* Large Background SVG Elements - Similar to Contact Page */}
      <svg
        className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
        width="400"
        height="400"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="200" fill="rgba(220, 38, 38, 0.08)" />
        <circle cx="200" cy="200" r="150" fill="rgba(220, 38, 38, 0.05)" />
        <circle cx="200" cy="200" r="100" fill="rgba(220, 38, 38, 0.03)" />
      </svg>

      <svg
        className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
        width="350"
        height="350"
        viewBox="0 0 350 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="175" cy="175" r="175" fill="rgba(234, 88, 12, 0.08)" />
        <circle cx="175" cy="175" r="120" fill="rgba(234, 88, 12, 0.05)" />
        <circle cx="175" cy="175" r="80" fill="rgba(234, 88, 12, 0.03)" />
      </svg>

      {/* Decorative Dashed Lines */}
      <svg
        className="absolute rotate-12 top-1/4 left-0 right-0 opacity-20"
        width="100%"
        height="2"
        viewBox="0 0 1200 2"
        fill="none"
      >
        <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(220, 38, 38, 0.5)" strokeWidth="2" strokeDasharray="12 8" />
      </svg>

      <svg
        className="absolute rotate-12 bottom-1/3 left-0 right-0 opacity-15"
        width="100%"
        height="2"
        viewBox="0 0 1200 2"
        fill="none"
      >
        <line x1="0" y1="1" x2="1200" y2="1" stroke="rgba(234, 88, 12, 0.9)" strokeWidth="2" strokeDasharray="8 12" />
      </svg>

      <div className="relative container">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 md:mb-6"
            >
              Every PDF tool you need in{" "}
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                one place
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-2xl text-gray-600 mb-4 md:mb-8 max-w-3xl mx-auto lg:mx-0 leading-relaxed"
            >
              Merge, split, compress, and convert your PDF files with our free, fast, and secure online tools. No
              downloads required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
            >
              <motion.a
                href="#tools"
                whileHover={{ boxShadow: "0 10px 30px rgba(220, 38, 38, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-2.5 text-center w-full sm:w-auto rounded-full text-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
              >
                Start Using Tools
              </motion.a>
              <motion.a
                href="#howitwork"
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-300 text-gray-700 px-8 py-2.5 text-center w-full sm:w-auto rounded-full text-lg font-semibold hover:border-red-600 hover:text-red-600 transition-all duration-300"
              >
                Learn More
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 grid grid-cols-3 gap-8 max-w-2xl"
            >
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-red-600">10M+</div>
                <div className="text-gray-600">Files Processed</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-orange-600">100%</div>
                <div className="text-gray-600">Free to Use</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-green-600">Secure</div>
                <div className="text-gray-600">& Private</div>
              </div>
            </motion.div>
          </div>

          {/* PDF Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-2 hidden lg:flex justify-center items-center"
          >
            <div className="relative">
              {/* Main PDF Document */}
              <div className="w-64 h-80 bg-white rounded-lg shadow-xl transform rotate-3 relative z-20 border border-gray-200">
                <div className="h-8 bg-red-600 rounded-t-lg flex items-center px-4">
                  <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-5/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-4/5 mb-4"></div>
                  <div className="h-20 bg-red-100 rounded-lg w-full mb-4 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full w-full mb-4"></div>
                  {/* <div className="h-4 bg-gray-200 rounded-full w-4/6 mb-4"></div> */}
                  {/* <div className="h-4 bg-gray-200 rounded-full w-3/4"></div> */}
                </div>
              </div>

              {/* Background PDF Documents */}
              <div className="w-64 h-80 bg-white rounded-lg shadow-lg absolute top-6 left-6 transform -rotate-6 z-10 border border-gray-200"></div>
              <div className="w-64 h-80 bg-white rounded-lg shadow-lg absolute top-3 left-3 transform rotate-12 z-0 border border-gray-200"></div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold z-30 shadow-lg">
                PDF
              </div>
              <div className="absolute -bottom-2 -left-6 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold z-30 shadow-lg transform rotate-12">
                100%
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
