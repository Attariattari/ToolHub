import '@/app/globals.css'
import Link from 'next/link'
import { ToastContainer } from 'react-toastify'
import { Suspense } from 'react'
import Image from 'next/image'

export default function AuthLayout({ children }) {
  return (
    <main>
      <Link href="/" className="fixed top-4 left-4 inline-flex items-center space-x-2">
        <Image
          src="/logo.png"
          alt="PDFDex Logo"
          height={35}
          width={130}
        />
      </Link>

      {/* Wrap children inside Suspense */}
      <Suspense fallback={<div></div>}>
        {children}
      </Suspense>

      <ToastContainer />
    </main>
  )
}


// import '@/app/globals.css'
// import Link from 'next/link'
// import { ToastContainer } from 'react-toastify'

// export default function AuthLayout({ children }) {
//   return (
//     <main>
//       <Link href="/" className="fixed top-4 left-4 inline-flex items-center space-x-2">
//         <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
//           <svg
//             width="28"
//             height="28"
//             viewBox="0 0 24 24"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//             className="text-white"
//           >
//             <path
//               d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//             <polyline
//               points="14,2 14,8 20,8"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//             <line
//               x1="16"
//               y1="13"
//               x2="8"
//               y2="13"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//             <line
//               x1="16"
//               y1="17"
//               x2="8"
//               y2="17"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//           </svg>
//         </div>
//         <span className="text-2xl font-bold text-gray-900">PDFDEX</span>
//       </Link>
//       {children}
//       <ToastContainer />
//     </main>
//   )
// }
