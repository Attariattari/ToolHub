"use client"

import Link from "next/link"
import {
  ComparePDFIcon,
  CompressPDFIcon,
  CropPDFIcon,
  EditPDFIcon,
  ExcelToPDFIcon,
  HTMLToPDFIcon,
  JPGToPDFIcon,
  MergePDFIcon,
  OcrPDFIcon,
  OrganizePDFIcon,
  PageNumberIcon,
  PDFtoExcelIcon,
  PDFToJPGIcon,
  PDFToPDFAIcon,
  PDFtoPowerPointIcon,
  PDFToWordIcon,
  PowerPintToPDFIcon,
  ProtectPDFIcon,
  RedactPDFIcon,
  RepairPDFIcon,
  RotatePDFIcon,
  SignPDFIcon,
  SplitPDFIcon,
  UnlockPDFIcon,
  WatermarkIcon,
  WordToPDFIcon,
} from "../icons/pdfIcons"

const toolCategories = {
  "ORGANIZE PDF": [
    {
      name: "Merge PDF",
      description: "Quickly merge multiple PDF files into one document while keeping your page order intact.",
      icon: MergePDFIcon,
      url: "/merge-pdf",
    },
    {
      name: "Split PDF",
      description: "Extract specific pages or split large PDFs into smaller, separate files instantly.",
      icon: SplitPDFIcon,
      url: "/split-pdf",
    },
    {
      name: "Organize PDF",
      description: "Rearrange, delete, or add pages in your PDF document with ease and flexibility.",
      icon: OrganizePDFIcon,
      url: "/organize-pdf",
    },
  ],
  "OPTIMIZE PDF": [
    {
      name: "Compress PDF",
      description: "Reduce PDF size without losing quality, perfect for sharing and storing files easily.",
      icon: CompressPDFIcon,
      url: "/compress-pdf",
    },
    {
      name: "Repair PDF",
      description: "Recover data from damaged or corrupted PDF files using advanced repair tools.",
      icon: RepairPDFIcon,
      url: "/repair-pdf",
    },
    {
      name: "OCR PDF",
      description: "Turn scanned PDFs into searchable and editable text using OCR technology.",
      icon: OcrPDFIcon,
      url: "/ocr-pdf",
    },
  ],
  "CONVERT TO PDF": [
    {
      name: "JPG to PDF",
      description: "Combine multiple JPG images into a single PDF with customizable margins and layout.",
      icon: JPGToPDFIcon,
      url: "/jpg-to-pdf",
    },
    {
      name: "Word to PDF",
      description: "Convert DOC or DOCX files to PDF for secure sharing and universal compatibility.",
      icon: WordToPDFIcon,
      url: "/word-to-pdf",
    },
    {
      name: "PowerPoint to PDF",
      description: "Convert PPT and PPTX slideshows to PDF for easy viewing and distribution.",
      icon: PowerPintToPDFIcon,
      url: "/powerpoint-to-pdf",
    },
    {
      name: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF while preserving layouts and formatting.",
      icon: ExcelToPDFIcon,
      url: "/excel-to-pdf",
    },
    {
      name: "HTML to PDF",
      description: "Convert any webpage to PDF by pasting its URL for instant and accurate output.",
      icon: HTMLToPDFIcon,
      url: "/html-to-pdf",
    },
  ],
  "CONVERT FROM PDF": [
    {
      name: "PDF to JPG",
      description: "Convert each PDF page into high-quality JPG images or extract embedded pictures.",
      icon: PDFToJPGIcon,
      url: "/pdf-to-jpg",
    },
    {
      name: "PDF to Word",
      description: "Convert PDFs to editable Word documents with high accuracy and preserved formatting.",
      icon: PDFToWordIcon,
      url: "/pdf-to-word",
    },
    {
      name: "PDF to PowerPoint",
      description: "Transform PDF documents into fully editable PowerPoint presentations quickly.",
      icon: PDFtoPowerPointIcon,
      url: "/pdf-to-powerpoint",
    },
    {
      name: "PDF to Excel",
      description: "Extract tables and data from PDFs directly into Excel spreadsheets in seconds.",
      icon: PDFtoExcelIcon,
      url: "/pdf-to-excel",
    },
    {
      name: "PDF to PDF/A",
      description: "Convert PDFs to PDF/A format for long-term archiving and compliance standards.",
      icon: PDFToPDFAIcon,
      url: "/pdf-to-pdfa",
    },
  ],
  "EDIT PDF": [
    {
      name: "Rotate PDF",
      description: "Rotate single or multiple PDF pages to the desired orientation in seconds.",
      icon: RotatePDFIcon,
      url: "/rotate-pdf",
    },
    {
      name: "Add page numbers",
      description: "Insert custom page numbers in PDFs with options for position, style, and size.",
      icon: PageNumberIcon,
      url: "/add-pdf-page-number",
    },
    {
      name: "Add watermark",
      description: "Add text or image watermarks to PDFs with adjustable position, size, and opacity.",
      icon: WatermarkIcon,
      url: "/add-watermark",
    },
    {
      name: "Crop PDF",
      description: "Crop unwanted margins or adjust visible areas of PDF pages in just a few clicks.",
      icon: CropPDFIcon,
      url: "/crop-pdf",
      isNew: true,
    },
    {
      name: "Edit PDF",
      description: "Add text, images, or annotations to PDFs and customize fonts, colors, and styles easily.",
      icon: EditPDFIcon,
      url: "/edit-pdf",
      isNew: true,
    },
  ],
  "PDF SECURITY": [
    {
      name: "Unlock PDF",
      description: "Remove password restrictions from PDFs and regain full access to your files.",
      icon: UnlockPDFIcon,
      url: "/unlock-pdf",
    },
    {
      name: "Protect PDF",
      description: "Encrypt PDFs with a password to prevent unauthorized viewing or editing.",
      icon: ProtectPDFIcon,
      url: "/protect-pdf",
    },
    {
      name: "Sign PDF",
      description: "Digitally sign PDFs or request secure electronic signatures from others online.",
      icon: SignPDFIcon,
      url: "/sign-pdf",
    },
    {
      name: "Redact PDF",
      description: "Permanently remove sensitive information from PDFs with secure redaction.",
      icon: RedactPDFIcon,
      url: "/redact-pdf",
      isNew: true,
    },
    {
      name: "Compare PDF",
      description: "Compare two PDF files side by side to quickly identify content differences.",
      icon: ComparePDFIcon,
      url: "/compare-pdf",
      isNew: true,
    },
  ],
}

const categoryDescriptions = {
  "ORGANIZE PDF": "Merge, split, and rearrange your PDF documents with powerful organization tools.",
  "OPTIMIZE PDF": "Compress, repair, and enhance your PDFs for better performance and accessibility.",
  "CONVERT TO PDF": "Transform various file formats into professional PDF documents instantly.",
  "CONVERT FROM PDF": "Extract and convert PDF content to editable formats like Word, Excel, and images.",
  "EDIT PDF": "Modify, annotate, and customize your PDF documents with advanced editing features.",
  "PDF SECURITY": "Protect, encrypt, and manage access to your sensitive PDF documents securely.",
}

export default function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 bg-gray-50">
      <div className="container">
        <div
          // initial={{ opacity: 0, y: 30 }}
          // whileInView={{ opacity: 1, y: 0 }}
          // transition={{ duration: 0.8 }}
          // viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">All PDF Tools You Need</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive collection of PDFDEX. All tools are free, fast, and work directly in your
            browser.
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(toolCategories).map(([category, tools], categoryIndex) => (
            <div
              key={category}
              // initial={{ opacity: 0, y: 30 }}
              // whileInView={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              // viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">{category}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">{categoryDescriptions[category]}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool, index) => (
                  <div
                    key={tool.name}
                    // initial={{ opacity: 0, y: 30 }}
                    // whileInView={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.5, delay: index * 0.05 }}
                    // viewport={{ once: true }}
                    className="group cursor-pointer"
                  >
                    <Link href={tool.url} className="block h-full">
                      <div className="bg-white rounded-sm p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 h-full relative flex">
                        {tool.isNew && (
                          <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            New!
                          </div>
                        )}
                        <div className="w-auto flex items-center justify-center mr-4 px-2">
                          <div className="h-12 w-12 flex items-center justify-center">
                            <tool.icon className="group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {tool.name}
                          </h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}



// "use client"

// import { motion } from "framer-motion"
// import Link from "next/link"
// import { ComparePDFIcon, CompressPDFIcon, CropPDFIcon, EditPDFIcon, ExcelToPDFIcon, HTMLToPDFIcon, JPGToPDFIcon, MergePDFIcon, OcrPDFIcon, OrganizePDFIcon, PageNumberIcon, PDFtoExcelIcon, PDFToJPGIcon, PDFToPDFAIcon, PDFtoPowerPointIcon, PDFToWordIcon, PowerPintToPDFIcon, ProtectPDFIcon, RedactPDFIcon, RepairPDFIcon, RotatePDFIcon, ScanPDFIcon, SignPDFIcon, SplitPDFIcon, UnlockPDFIcon, WatermarkIcon, WordToPDFIcon } from "../icons/pdfIcons"

// const tools = [
//   {
//     name: "Merge PDF",
//     description: "Quickly merge multiple PDF files into one document while keeping your page order intact.",
//     icon: MergePDFIcon,
//     color: "from-blue-500 to-blue-600",
//     url: "/merge-pdf",
//   },
//   {
//     name: "Split PDF",
//     description: "Extract specific pages or split large PDFs into smaller, separate files instantly.",
//     icon: SplitPDFIcon,
//     color: "from-orange-500 to-orange-600",
//     url: "/split-pdf",
//   },
//   {
//     name: "Compress PDF",
//     description: "Reduce PDF size without losing quality, perfect for sharing and storing files easily.",
//     icon: CompressPDFIcon,
//     color: "from-green-500 to-green-600",
//     url: "/compress-pdf",
//   },
//   {
//     name: "PDF to Word",
//     description: "Convert PDFs to editable Word documents with high accuracy and preserved formatting.",
//     icon: PDFToWordIcon,
//     color: "from-blue-500 to-blue-600",
//     url: "/pdf-to-word",
//   },
//   {
//     name: "PDF to PowerPoint",
//     description: "Transform PDF documents into fully editable PowerPoint presentations quickly.",
//     icon: PDFtoPowerPointIcon,
//     color: "from-purple-500 to-purple-600",
//     url: "/pdf-to-powerpoint",
//   },
//   {
//     name: "PDF to Excel",
//     description: "Extract tables and data from PDFs directly into Excel spreadsheets in seconds.",
//     icon: PDFtoExcelIcon,
//     color: "from-emerald-500 to-emerald-600",
//     url: "/pdf-to-excel",
//   },
//   {
//     name: "Word to PDF",
//     description: "Convert DOC or DOCX files to PDF for secure sharing and universal compatibility.",
//     icon: WordToPDFIcon,
//     color: "from-indigo-500 to-indigo-600",
//     url: "/word-to-pdf",
//   },
//   {
//     name: "PowerPoint to PDF",
//     description: "Convert PPT and PPTX slideshows to PDF for easy viewing and distribution.",
//     icon: PowerPintToPDFIcon,
//     color: "from-pink-500 to-pink-600",
//     url: "/powerpoint-to-pdf",
//   },
//   {
//     name: "Excel to PDF",
//     description: "Convert Excel spreadsheets to PDF while preserving layouts and formatting.",
//     icon: ExcelToPDFIcon,
//     color: "from-teal-500 to-teal-600",
//     url: "/excel-to-pdf",
//   },
//   {
//     name: "Edit PDF",
//     description: "Add text, images, or annotations to PDFs and customize fonts, colors, and styles easily.",
//     icon: EditPDFIcon,
//     color: "from-violet-500 to-violet-600",
//     url: "/edit-pdf",
//     isNew: true,
//   },
//   {
//     name: "PDF to JPG",
//     description: "Convert each PDF page into high-quality JPG images or extract embedded pictures.",
//     icon: PDFToJPGIcon,
//     color: "from-yellow-500 to-yellow-600",
//     url: "/pdf-to-jpg",
//   },
//   {
//     name: "JPG to PDF",
//     description: "Combine multiple JPG images into a single PDF with customizable margins and layout.",
//     icon: JPGToPDFIcon,
//     color: "from-cyan-500 to-cyan-600",
//     url: "/jpg-to-pdf",
//   },
//   {
//     name: "Sign PDF",
//     description: "Digitally sign PDFs or request secure electronic signatures from others online.",
//     icon: SignPDFIcon,
//     color: "from-blue-500 to-pink-600",
//     url: "/sign-pdf",
//   },
//   {
//     name: "Watermark",
//     description: "Add text or image watermarks to PDFs with adjustable position, size, and opacity.",
//     icon: WatermarkIcon,
//     color: "from-blue-500 to-cyan-600",
//     url: "/add-watermark",
//   },
//   {
//     name: "Rotate PDF",
//     description: "Rotate single or multiple PDF pages to the desired orientation in seconds.",
//     icon: RotatePDFIcon,
//     color: "from-green-500 to-teal-600",
//     url: "/rotate-pdf",
//   },
//   {
//     name: "HTML to PDF",
//     description: "Convert any webpage to PDF by pasting its URL for instant and accurate output.",
//     icon: HTMLToPDFIcon,
//     color: "from-orange-500 to-blue-600",
//     url: "/html-to-pdf",
//   },
//   {
//     name: "Unlock PDF",
//     description: "Remove password restrictions from PDFs and regain full access to your files.",
//     icon: UnlockPDFIcon,
//     color: "from-emerald-500 to-green-600",
//     url: "/unlock-pdf",
//   },
//   {
//     name: "Protect PDF",
//     description: "Encrypt PDFs with a password to prevent unauthorized viewing or editing.",
//     icon: ProtectPDFIcon,
//     color: "from-blue-500 to-orange-600",
//     url: "/protect-pdf",
//   },
//   {
//     name: "Organize PDF",
//     description: "Rearrange, delete, or add pages in your PDF document with ease and flexibility.",
//     icon: OrganizePDFIcon,
//     color: "from-purple-500 to-pink-600",
//     url: "/organize-pdf",
//   },
//   {
//     name: "PDF to PDF/A",
//     description: "Convert PDFs to PDF/A format for long-term archiving and compliance standards.",
//     icon: PDFToPDFAIcon,
//     color: "from-indigo-500 to-purple-600",
//     url: "/pdf-to-pdfa",
//   },
//   {
//     name: "Repair PDF",
//     description: "Recover data from damaged or corrupted PDF files using advanced repair tools.",
//     icon: RepairPDFIcon,
//     color: "from-yellow-500 to-orange-600",
//     url: "/repair-pdf",
//   },
//   {
//     name: "Page numbers",
//     description: "Insert custom page numbers in PDFs with options for position, style, and size.",
//     icon: PageNumberIcon,
//     color: "from-teal-500 to-cyan-600",
//     url: "/add-pdf-page-number",
//   },
//   {
//     name: "Scan to PDF",
//     description: "Scan documents using your phone or device and convert them instantly to PDF.",
//     icon: ScanPDFIcon,
//     color: "from-green-500 to-emerald-600",
//     url: "/scan-to-pdf",
//   },
//   {
//     name: "OCR PDF",
//     description: "Turn scanned PDFs into searchable and editable text using OCR technology.",
//     icon: OcrPDFIcon,
//     color: "from-blue-500 to-indigo-600",
//     url: "/ocr-pdf",
//   },
//   {
//     name: "Compare PDF",
//     description: "Compare two PDF files side by side to quickly identify content differences.",
//     icon: ComparePDFIcon,
//     color: "from-violet-500 to-purple-600",
//     url: "/compare-pdf",
//     isNew: true,
//   },
//   {
//     name: "Redact PDF",
//     description: "Permanently remove sensitive information from PDFs with secure redaction.",
//     icon: RedactPDFIcon,
//     color: "from-blue-500 to-pink-600",
//     url: "/redact-pdf",
//     isNew: true,
//   },
//   {
//     name: "Crop PDF",
//     description: "Crop unwanted margins or adjust visible areas of PDF pages in just a few clicks.",
//     icon: CropPDFIcon,
//     color: "from-orange-500 to-yellow-600",
//     url: "/crop-pdf",
//     isNew: true,
//   },
// ];

// export default function ToolsShowcase() {
//   return (
//     <section id="tools" className="py-20 bg-white">
//       <div className="container">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//           viewport={{ once: true }}
//           className="text-center mb-16"
//         >
//           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">All PDF Tools You Need</h2>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             Choose from our comprehensive collection of PDFDEX. All tools are free, fast, and work directly in your
//             browser.
//           </p>
//         </motion.div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
//           {tools.map((tool, index) => (
//             <motion.div
//               key={tool.name}
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: index * 0.05 }}
//               viewport={{ once: true }}
//               className="group cursor-pointer"
//             >
//               <Link href={tool.url} className="block h-full">
//                 <div className="bg-white rounded-sm p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 h-full relative">
//                   {tool.isNew && (
//                     <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
//                       New!
//                     </div>
//                   )}
//                   <div className="mb-4 flex justify-center h-10 w-10">
//                     <tool.icon className="group-hover:scale-125 transition-transform duration-300" />
//                   </div>
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
//                     {tool.name}
//                   </h3>
//                   <p className="text-gray-600 text-sm leading-relaxed">{tool.description}</p>
//                 </div>
//               </Link>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }
