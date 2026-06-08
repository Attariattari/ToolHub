"use client"

const steps = [
  {
    step: "01",
    title: "Select Your Tool",
    description: "Choose from our wide range of PDFDEX based on what you need to accomplish.",
    icon: "🎯",
  },
  {
    step: "02",
    title: "Upload Your File",
    description: "Drag and drop your PDF file or click to browse and select from your device.",
    icon: "📁",
  },
  {
    step: "03",
    title: "Process & Download",
    description: "Our tools will process your file instantly. Download the result when ready.",
    icon: "⬇️",
  },
]

export default function HowItWorks() {
  return (
    <section id="howitwork" className="py-20 bg-white">
      <div className="container">
        <div
          // initial={{ opacity: 0, y: 30 }}
          // whileInView={{ opacity: 1, y: 0 }}
          // transition={{ duration: 0.8 }}
          // viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Using our PDFDEX is simple and straightforward. Follow these three easy steps to get started.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 transform -translate-y-1/2"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                // initial={{ opacity: 0, y: 30 }}
                // whileInView={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6, delay: index * 0.2 }}
                // viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="relative z-10 w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          // initial={{ opacity: 0, y: 30 }}
          // whileInView={{ opacity: 1, y: 0 }}
          // transition={{ duration: 0.8, delay: 0.4 }}
          // viewport={{ once: true }}
          className="mt-20 text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join millions of users who trust our PDFDEX for their document processing needs.
          </p>
          <a
            href="#tools"
            // whiletap={{ scale: 0.95 }}
            className="bg-white text-blue-600 px-8 py-2.5 rounded-full text-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
          >
            Start Using Tools
          </a>
        </div>
      </div>
    </section>
  )
}


// "use client"

// import { motion } from "framer-motion"

// const steps = [
//   {
//     step: "01",
//     title: "Select Your Tool",
//     description: "Choose from our wide range of PDFDEX based on what you need to accomplish.",
//     icon: "🎯",
//   },
//   {
//     step: "02",
//     title: "Upload Your File",
//     description: "Drag and drop your PDF file or click to browse and select from your device.",
//     icon: "📁",
//   },
//   {
//     step: "03",
//     title: "Process & Download",
//     description: "Our tools will process your file instantly. Download the result when ready.",
//     icon: "⬇️",
//   },
// ]

// export default function HowItWorks() {
//   return (
//     <section id="howitwork" className="py-20 bg-white">
//       <div className="container">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//           viewport={{ once: true }}
//           className="text-center mb-16"
//         >
//           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             Using our PDFDEX is simple and straightforward. Follow these three easy steps to get started.
//           </p>
//         </motion.div>

//         <div className="relative">
//           {/* Connection line */}
//           <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-blue-200 transform -translate-y-1/2"></div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
//             {steps.map((step, index) => (
//               <motion.div
//                 key={step.step}
//                 initial={{ opacity: 0, y: 30 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: index * 0.2 }}
//                 viewport={{ once: true }}
//                 className="relative text-center"
//               >
//                 {/* Step number */}
//                 <div className="relative z-10 w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
//                   <span className="text-white font-bold text-lg">{step.step}</span>
//                 </div>

//                 {/* Icon */}
//                 <div className="text-4xl mb-4">{step.icon}</div>

//                 {/* Content */}
//                 <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
//                 <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>

//         {/* CTA Section */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.4 }}
//           viewport={{ once: true }}
//           className="mt-20 text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12"
//         >
//           <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h3>
//           <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
//             Join millions of users who trust our PDFDEX for their document processing needs.
//           </p>
//           <motion.a
//             href="#tools"
//             whiletap={{ scale: 0.95 }}
//             className="bg-white text-blue-600 px-8 py-2.5 rounded-full text-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
//           >
//             Start Using Tools
//           </motion.a>
//         </motion.div>
//       </div>
//     </section>
//   )
// }
