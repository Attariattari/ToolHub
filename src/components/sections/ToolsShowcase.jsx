"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  ScanPDFIcon,
  SignPDFIcon,
  SplitPDFIcon,
  UnlockPDFIcon,
  WatermarkIcon,
  WordToPDFIcon,
} from "../icons/pdfIcons";

const tools = [
  {
    name: "Merge PDF",
    description:
      "Combine PDFs in the order you want with the easiest PDF merger available.",
    icon: MergePDFIcon,
    color: "from-red-500 to-red-600",
    url: "/merge-pdf",
  },
  {
    name: "Split PDF",
    description:
      "Separate one page or a whole set for easy conversion into independent PDF files.",
    icon: SplitPDFIcon,
    color: "from-orange-500 to-orange-600",
    url: "/split-pdf",
  },
  {
    name: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
    icon: CompressPDFIcon,
    color: "from-green-500 to-green-600",
    url: "/compress-pdf",
  },
  {
    name: "PDF to Word",
    description:
      "Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.",
    icon: PDFToWordIcon,
    color: "from-blue-500 to-blue-600",
    url: "/pdf-to-word",
  },
  {
    name: "PDF to PowerPoint",
    description:
      "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
    icon: PDFtoPowerPointIcon,
    color: "from-purple-500 to-purple-600",
    url: "/pdf-to-powerpoint",
  },
  {
    name: "PDF to Excel",
    description:
      "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
    icon: PDFtoExcelIcon,
    color: "from-emerald-500 to-emerald-600",
    url: "/pdf-to-excel",
  },
  {
    name: "Word to PDF",
    description:
      "Make DOC and DOCX files easy to read by converting them to PDF.",
    icon: WordToPDFIcon,
    color: "from-indigo-500 to-indigo-600",
    url: "/word-to-pdf",
  },
  {
    name: "PowerPoint to PDF",
    description:
      "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
    icon: PowerPintToPDFIcon,
    color: "from-pink-500 to-pink-600",
    url: "/powerpoint-to-pdf",
  },
  {
    name: "Excel to PDF",
    description:
      "Make EXCEL spreadsheets easy to read by converting them to PDF.",
    icon: ExcelToPDFIcon,
    color: "from-teal-500 to-teal-600",
    url: "/excel-to-pdf",
  },
  {
    name: "Edit PDF",
    description:
      "Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content.",
    icon: EditPDFIcon,
    color: "from-violet-500 to-violet-600",
    url: "/edit-pdf",
    isNew: true,
  },
  {
    name: "PDF to JPG",
    description:
      "Convert each PDF page into a JPG or extract all images contained in a PDF.",
    icon: PDFToJPGIcon,
    color: "from-yellow-500 to-yellow-600",
    url: "/pdf-to-jpg",
  },
  {
    name: "JPG to PDF",
    description:
      "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
    icon: JPGToPDFIcon,
    color: "from-cyan-500 to-cyan-600",
    url: "/jpg-to-pdf",
  },
  {
    name: "Sign PDF",
    description: "Sign yourself or request electronic signatures from others.",
    icon: SignPDFIcon,
    color: "from-red-500 to-pink-600",
    url: "/sign-pdf",
  },
  {
    name: "Watermark",
    description:
      "Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.",
    icon: WatermarkIcon,
    color: "from-blue-500 to-cyan-600",
    url: "/add-watermark",
  },
  {
    name: "Rotate PDF",
    description:
      "Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!",
    icon: RotatePDFIcon,
    color: "from-green-500 to-teal-600",
    url: "/rotate-pdf",
  },
  {
    name: "HTML to PDF",
    description:
      "Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it to PDF with a click.",
    icon: HTMLToPDFIcon,
    color: "from-orange-500 to-red-600",
    url: "/html-to-pdf",
  },
  {
    name: "Unlock PDF",
    description:
      "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
    icon: UnlockPDFIcon,
    color: "from-emerald-500 to-green-600",
    url: "/unlock-pdf",
  },
  {
    name: "Protect PDF",
    description:
      "Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.",
    icon: ProtectPDFIcon,
    color: "from-red-500 to-orange-600",
    url: "/protect-pdf",
  },
  {
    name: "Organize PDF",
    description:
      "Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.",
    icon: OrganizePDFIcon,
    color: "from-purple-500 to-pink-600",
    url: "/organize-pdf",
  },
  {
    name: "PDF to PDF/A",
    description:
      "Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving.",
    icon: PDFToPDFAIcon,
    color: "from-indigo-500 to-purple-600",
    url: "/pdf-to-pdfa",
  },
  {
    name: "Repair PDF",
    description:
      "Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool.",
    icon: RepairPDFIcon,
    color: "from-yellow-500 to-orange-600",
    url: "/repair-pdf",
  },
  {
    name: "Page numbers",
    description:
      "Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.",
    icon: PageNumberIcon,
    color: "from-teal-500 to-cyan-600",
    url: "/page-numbers",
  },
  {
    name: "Scan to PDF",
    description:
      "Capture document scans from your mobile device and send them instantly to your browser.",
    icon: ScanPDFIcon,
    color: "from-green-500 to-emerald-600",
    url: "/scan-to-pdf",
  },
  {
    name: "OCR PDF",
    description:
      "Easily convert scanned PDF into searchable and selectable documents.",
    icon: OcrPDFIcon,
    color: "from-blue-500 to-indigo-600",
    url: "/ocr-pdf",
  },
  {
    name: "Compare PDF",
    description:
      "Show a side-by-side document comparison and easily spot changes between different file versions.",
    icon: ComparePDFIcon,
    color: "from-violet-500 to-purple-600",
    url: "/compare-pdf",
    isNew: true,
  },
  {
    name: "Redact PDF",
    description:
      "Redact text and graphics to permanently remove sensitive information from a PDF.",
    icon: RedactPDFIcon,
    color: "from-red-500 to-pink-600",
    url: "/redact-pdf",
    isNew: true,
  },
  {
    name: "Crop PDF",
    description:
      "Crop margins of PDF documents or select specific areas, then apply the changes to one page or the whole document.",
    icon: CropPDFIcon,
    color: "from-orange-500 to-yellow-600",
    url: "/crop-pdf",
    isNew: true,
  },
];

export default function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All PDF Tools You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive collection of PDF tools. All tools are
            free, fast, and work directly in your browser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <Link href={tool.url} className="block h-full">
                <div className="bg-white rounded-sm p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 h-full relative">
                  {tool.isNew && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New!
                    </div>
                  )}
                  <div className="mb-4 flex justify-center h-10 w-10">
                    <tool.icon className="group-hover:scale-125 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
