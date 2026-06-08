// components/shared/downloadMessages.js

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

export const downloadMessages = {
  "merge-pdf": {
    heading: "PDFs have been merged!",
    description: "Your files have been successfully combined into one document.",
    button: "Download merged PDF",
    shareTitle: "Merged PDF Document",
    shareText: "Check out this merged PDF document",
    recommendedTools: [
      {
        name: "Split PDF",
        description: "Extract specific pages",
        icon: SplitPDFIcon,
        url: "/split-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Add watermark",
        description: "Protect your document",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
    ]
  },
  "split-pdf": {
    heading: "PDF has been split!",
    description: "The selected pages have been successfully extracted into a new document.",
    button: "Download split PDF",
    shareTitle: "Split PDF Document",
    shareText: "Here's your extracted PDF pages",
    recommendedTools: [
      {
        name: "Merge PDF",
        description: "Combine multiple PDFs",
        icon: MergePDFIcon,
        url: "/merge-pdf",
      },
      {
        name: "Organize PDF",
        description: "Rearrange pages",
        icon: OrganizePDFIcon,
        url: "/organize-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "compress-pdf": {
    heading: "PDFs have been compressed!",
    description: "Your files have been compressed while maintaining optimal quality.",
    button: "Download compressed PDF",
    shareTitle: "Compressed PDF",
    shareText: "Download your optimized PDF document",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add password protection",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Add watermark",
        description: "Brand your document",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "PDF to Word",
        description: "Make it editable",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
    ]
  },
  "pdf-to-word": {
    heading: "PDFs converted to Word!",
    description: "Your documents are now editable Word files.",
    button: "Download Word document",
    shareTitle: "Converted Word Document",
    shareText: "Check out this converted Word document from PDF",
    recommendedTools: [
      {
        name: "Word to PDF",
        description: "Convert back to PDF",
        icon: WordToPDFIcon,
        url: "/word-to-pdf",
      },
      {
        name: "PDF to PowerPoint",
        description: "Create presentations",
        icon: PDFtoPowerPointIcon,
        url: "/pdf-to-powerpoint",
      },
      {
        name: "PDF to Excel",
        description: "Extract data tables",
        icon: PDFtoExcelIcon,
        url: "/pdf-to-excel",
      },
    ]
  },
  "pdf-to-powerpoint": {
    heading: "PDFs converted to PowerPoint!",
    description: "Your presentations are ready to be edited.",
    button: "Download PowerPoint file",
    shareTitle: "Converted PowerPoint File",
    shareText: "Check out this converted PowerPoint presentation",
    recommendedTools: [
      {
        name: "PowerPoint to PDF",
        description: "Convert back to PDF",
        icon: PowerPintToPDFIcon,
        url: "/powerpoint-to-pdf",
      },
      {
        name: "PDF to Word",
        description: "Edit as document",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
      {
        name: "Compress PDF",
        description: "Optimize file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "pdf-to-excel": {
    heading: "PDFs converted to Excel!",
    description: "Your tables and data have been successfully extracted.",
    button: "Download Excel file",
    shareTitle: "Converted Excel File",
    shareText: "Here's your extracted Excel file from PDF",
    recommendedTools: [
      {
        name: "Excel to PDF",
        description: "Convert back to PDF",
        icon: ExcelToPDFIcon,
        url: "/excel-to-pdf",
      },
      {
        name: "OCR PDF",
        description: "Make text searchable",
        icon: OcrPDFIcon,
        url: "/ocr-pdf",
      },
      {
        name: "PDF to Word",
        description: "Edit as document",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
    ]
  },
  "word-to-pdf": {
    heading: "Word converted to PDF!",
    description: "Your Word file has been successfully converted to PDF.",
    button: "Download PDF",
    shareTitle: "Converted PDF File",
    shareText: "Here is your new PDF converted from Word",
    recommendedTools: [
      {
        name: "PDF to Word",
        description: "Convert back to Word",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Protect PDF",
        description: "Add password security",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
    ]
  },
  "powerpoint-to-pdf": {
    heading: "PowerPoint converted to PDF!",
    description: "Your presentation has been successfully converted to PDF.",
    button: "Download PDF",
    shareTitle: "Converted PDF File",
    shareText: "Here is your PDF converted from PowerPoint",
    recommendedTools: [
      {
        name: "PDF to PowerPoint",
        description: "Convert back to PPT",
        icon: PDFtoPowerPointIcon,
        url: "/pdf-to-powerpoint",
      },
      {
        name: "Add watermark",
        description: "Brand your presentation",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "PDF to JPG",
        description: "Extract as images",
        icon: PDFToJPGIcon,
        url: "/pdf-to-jpg",
      },
    ]
  },
  "excel-to-pdf": {
    heading: "Excel converted to PDF!",
    description: "Your spreadsheet has been successfully converted to PDF.",
    button: "Download PDF",
    shareTitle: "Converted PDF File",
    shareText: "Here is your PDF converted from Excel",
    recommendedTools: [
      {
        name: "PDF to Excel",
        description: "Convert back to Excel",
        icon: PDFtoExcelIcon,
        url: "/pdf-to-excel",
      },
      {
        name: "Protect PDF",
        description: "Secure your data",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Add page numbers",
        description: "Number your pages",
        icon: PageNumberIcon,
        url: "/add-pdf-page-number",
      },
    ]
  },
  "edit-pdf": {
    heading: "PDF has been edited!",
    description: "Your edited PDF is ready for download.",
    button: "Download edited PDF",
    shareTitle: "Edited PDF Document",
    shareText: "Here is your updated PDF document",
    recommendedTools: [
      {
        name: "Sign PDF",
        description: "Add digital signature",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
      {
        name: "Add watermark",
        description: "Brand your document",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "Protect PDF",
        description: "Add password security",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
    ]
  },
  "pdf-to-jpg": {
    heading: "PDF converted to JPG!",
    description: "Your PDF pages have been successfully converted to images.",
    button: "Download JPGs",
    shareTitle: "Converted JPG Files",
    shareText: "Here are the JPGs converted from your PDF",
    recommendedTools: [
      {
        name: "JPG to PDF",
        description: "Convert back to PDF",
        icon: JPGToPDFIcon,
        url: "/jpg-to-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce original size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Crop PDF",
        description: "Trim unwanted areas",
        icon: CropPDFIcon,
        url: "/crop-pdf",
      },
    ]
  },
  "jpg-to-pdf": {
    heading: "JPGs converted to PDF!",
    description: "Your images have been combined into a PDF.",
    button: "Download PDF",
    shareTitle: "Combined PDF Document",
    shareText: "Here is your PDF created from images",
    recommendedTools: [
      {
        name: "PDF to JPG",
        description: "Extract as images",
        icon: PDFToJPGIcon,
        url: "/pdf-to-jpg",
      },
      {
        name: "Compress PDF",
        description: "Optimize file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "OCR PDF",
        description: "Make text searchable",
        icon: OcrPDFIcon,
        url: "/ocr-pdf",
      },
    ]
  },
  "sign-pdf": {
    heading: "PDF has been signed!",
    description: "Your signature has been added successfully.",
    button: "Download signed PDF",
    shareTitle: "Signed PDF Document",
    shareText: "Download your digitally signed PDF document",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add password security",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Add watermark",
        description: "Add official stamp",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "PDF to PDF/A",
        description: "Archive format",
        icon: PDFToPDFAIcon,
        url: "/pdf-to-pdfa",
      },
    ]
  },
  "watermark": {
    heading: "Watermark added to PDF!",
    description: "Your watermark has been applied successfully.",
    button: "Download watermarked PDF",
    shareTitle: "Watermarked PDF Document",
    shareText: "Here is your PDF with watermark",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add password protection",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Sign PDF",
        description: "Add digital signature",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
      {
        name: "Compress PDF",
        description: "Optimize file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "rotate-pdf": {
    heading: "PDF has been rotated!",
    description: "Your pages have been rotated as requested.",
    button: "Download rotated PDF",
    shareTitle: "Rotated PDF Document",
    shareText: "Here is your rotated PDF",
    recommendedTools: [
      {
        name: "Crop PDF",
        description: "Trim margins",
        icon: CropPDFIcon,
        url: "/crop-pdf",
      },
      {
        name: "Organize PDF",
        description: "Rearrange pages",
        icon: OrganizePDFIcon,
        url: "/organize-pdf",
      },
      {
        name: "Add page numbers",
        description: "Number your pages",
        icon: PageNumberIcon,
        url: "/add-pdf-page-number",
      },
    ]
  },
  "html-to-pdf": {
    heading: "Webpage converted to PDF!",
    description: "The HTML content has been saved as a PDF.",
    button: "Download PDF",
    shareTitle: "Webpage PDF",
    shareText: "Download this PDF version of your webpage",
    recommendedTools: [
      {
        name: "PDF to Word",
        description: "Make it editable",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
      {
        name: "Add watermark",
        description: "Brand the document",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "unlock-pdf": {
    heading: "PDF has been unlocked!",
    description: "Password protection has been removed.",
    button: "Download unlocked PDF",
    shareTitle: "Unlocked PDF",
    shareText: "Here is your password-free PDF",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add new password",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Edit PDF",
        description: "Modify content",
        icon: EditPDFIcon,
        url: "/edit-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "protect-pdf": {
    heading: "PDF has been protected!",
    description: "Your file is now password-protected.",
    button: "Download protected PDF",
    shareTitle: "Protected PDF",
    shareText: "Here is your encrypted and secured PDF",
    recommendedTools: [
      {
        name: "Sign PDF",
        description: "Add digital signature",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
      {
        name: "Add watermark",
        description: "Add ownership mark",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "Redact PDF",
        description: "Remove sensitive info",
        icon: RedactPDFIcon,
        url: "/redact-pdf",
      },
    ]
  },
  "organize-pdf": {
    heading: "PDF pages organized!",
    description: "Your document pages have been rearranged.",
    button: "Download organized PDF",
    shareTitle: "Organized PDF",
    shareText: "Here is your rearranged PDF document",
    recommendedTools: [
      {
        name: "Add page numbers",
        description: "Number the pages",
        icon: PageNumberIcon,
        url: "/add-pdf-page-number",
      },
      {
        name: "Split PDF",
        description: "Extract specific pages",
        icon: SplitPDFIcon,
        url: "/split-pdf",
      },
      {
        name: "Merge PDF",
        description: "Combine with others",
        icon: MergePDFIcon,
        url: "/merge-pdf",
      },
    ]
  },
  "pdf-to-pdfa": {
    heading: "PDF converted to PDF/A!",
    description: "Your document is now suitable for long-term archiving.",
    button: "Download PDF/A",
    shareTitle: "PDF/A Document",
    shareText: "Here is your archived PDF (PDF/A)",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add security layer",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Sign PDF",
        description: "Authenticate document",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
      {
        name: "Add watermark",
        description: "Mark as official",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
    ]
  },
  "repair-pdf": {
    heading: "PDF has been repaired!",
    description: "Your damaged PDF has been fixed.",
    button: "Download repaired PDF",
    shareTitle: "Repaired PDF",
    shareText: "Download your recovered PDF document",
    recommendedTools: [
      {
        name: "OCR PDF",
        description: "Make text searchable",
        icon: OcrPDFIcon,
        url: "/ocr-pdf",
      },
      {
        name: "Compress PDF",
        description: "Optimize performance",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Protect PDF",
        description: "Secure the document",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
    ]
  },
  "add-page-numbers": {
    heading: "Page numbers added!",
    description: "Your file now includes page numbers.",
    button: "Download numbered PDF",
    shareTitle: "Numbered PDF",
    shareText: "Here is your PDF with page numbers",
    recommendedTools: [
      {
        name: "Add watermark",
        description: "Brand your document",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
      {
        name: "Organize PDF",
        description: "Rearrange pages",
        icon: OrganizePDFIcon,
        url: "/organize-pdf",
      },
      {
        name: "Protect PDF",
        description: "Add password security",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
    ]
  },
  "scan-to-pdf": {
    heading: "Scans saved to PDF!",
    description: "Your scanned pages have been combined into a PDF.",
    button: "Download scanned PDF",
    shareTitle: "Scanned PDF",
    shareText: "Download your scanned document as PDF",
    recommendedTools: [
      {
        name: "OCR PDF",
        description: "Make text searchable",
        icon: OcrPDFIcon,
        url: "/ocr-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Crop PDF",
        description: "Remove margins",
        icon: CropPDFIcon,
        url: "/crop-pdf",
      },
    ]
  },
  "ocr-pdf": {
    heading: "PDF has been OCR processed!",
    description: "Your PDF is now searchable and selectable.",
    button: "Download OCR PDF",
    shareTitle: "Searchable PDF",
    shareText: "Here is your OCR-processed PDF",
    recommendedTools: [
      {
        name: "PDF to Word",
        description: "Edit the text",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
      {
        name: "PDF to Excel",
        description: "Extract data tables",
        icon: PDFtoExcelIcon,
        url: "/pdf-to-excel",
      },
      {
        name: "Compress PDF",
        description: "Optimize file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
    ]
  },
  "compare-pdf": {
    heading: "PDF comparison complete!",
    description: "The differences between your files have been highlighted.",
    button: "Download comparison PDF",
    shareTitle: "Compared PDF",
    shareText: "Here is your comparison result PDF",
    recommendedTools: [
      {
        name: "Merge PDF",
        description: "Combine documents",
        icon: MergePDFIcon,
        url: "/merge-pdf",
      },
      {
        name: "Redact PDF",
        description: "Remove sensitive info",
        icon: RedactPDFIcon,
        url: "/redact-pdf",
      },
      {
        name: "Sign PDF",
        description: "Approve changes",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
    ]
  },
  "redact-pdf": {
    heading: "PDF has been redacted!",
    description: "Sensitive information has been successfully removed.",
    button: "Download redacted PDF",
    shareTitle: "Redacted PDF",
    shareText: "Here is your secure redacted PDF",
    recommendedTools: [
      {
        name: "Protect PDF",
        description: "Add password security",
        icon: ProtectPDFIcon,
        url: "/protect-pdf",
      },
      {
        name: "Sign PDF",
        description: "Authenticate document",
        icon: SignPDFIcon,
        url: "/sign-pdf",
      },
      {
        name: "Add watermark",
        description: "Mark as confidential",
        icon: WatermarkIcon,
        url: "/add-watermark",
      },
    ]
  },
  "crop-pdf": {
    heading: "PDF has been cropped!",
    description: "Margins and areas have been trimmed successfully.",
    button: "Download cropped PDF",
    shareTitle: "Cropped PDF",
    shareText: "Here is your neatly cropped PDF document",
    recommendedTools: [
      {
        name: "Rotate PDF",
        description: "Fix orientation",
        icon: RotatePDFIcon,
        url: "/rotate-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "Add page numbers",
        description: "Number your pages",
        icon: PageNumberIcon,
        url: "/add-pdf-page-number",
      },
    ]
  },
};

export function getDownloadMessage(toolType) {
  return downloadMessages[toolType] || {
    heading: "Download Ready!",
    description: "Your document is ready to be downloaded.",
    button: "Download file",
    shareTitle: "PDF Tool Result",
    shareText: "Check out this file generated using our PDF tool.",
    recommendedTools: [
      {
        name: "Merge PDF",
        description: "Combine multiple PDFs",
        icon: MergePDFIcon,
        url: "/merge-pdf",
      },
      {
        name: "Compress PDF",
        description: "Reduce file size",
        icon: CompressPDFIcon,
        url: "/compress-pdf",
      },
      {
        name: "PDF to Word",
        description: "Make it editable",
        icon: PDFToWordIcon,
        url: "/pdf-to-word",
      },
    ]
  };
}

// // components/shared/downloadMessages.js

// export const downloadMessages = {
//   "merge-pdf": {
//     heading: "PDFs have been merged!",
//     description: "Your files have been successfully combined into one document.",
//     button: "Download merged PDF",
//     shareTitle: "Merged PDF Document",
//     shareText: "Check out this merged PDF document",
//   },
//   "split-pdf": {
//     heading: "PDF has been split!",
//     description: "The selected pages have been successfully extracted into a new document.",
//     button: "Download split PDF",
//     shareTitle: "Split PDF Document",
//     shareText: "Here's your extracted PDF pages",
//   },
//   "compress-pdf": {
//     heading: "PDFs have been compressed!",
//     description: "Your files have been compressed while maintaining optimal quality.",
//     button: "Download compressed PDF",
//     shareTitle: "Compressed PDF",
//     shareText: "Download your optimized PDF document",
//   },
//   "pdf-to-word": {
//     heading: "PDFs converted to Word!",
//     description: "Your documents are now editable Word files.",
//     button: "Download Word document",
//     shareTitle: "Converted Word Document",
//     shareText: "Check out this converted Word document from PDF",
//   },
//   "pdf-to-powerpoint": {
//     heading: "PDFs converted to PowerPoint!",
//     description: "Your presentations are ready to be edited.",
//     button: "Download PowerPoint file",
//     shareTitle: "Converted PowerPoint File",
//     shareText: "Check out this converted PowerPoint presentation",
//   },
//   "pdf-to-excel": {
//     heading: "PDFs converted to Excel!",
//     description: "Your tables and data have been successfully extracted.",
//     button: "Download Excel file",
//     shareTitle: "Converted Excel File",
//     shareText: "Here's your extracted Excel file from PDF",
//   },
//   "word-to-pdf": {
//     heading: "Word converted to PDF!",
//     description: "Your Word file has been successfully converted to PDF.",
//     button: "Download PDF",
//     shareTitle: "Converted PDF File",
//     shareText: "Here is your new PDF converted from Word",
//   },
//   "powerpoint-to-pdf": {
//     heading: "PowerPoint converted to PDF!",
//     description: "Your presentation has been successfully converted to PDF.",
//     button: "Download PDF",
//     shareTitle: "Converted PDF File",
//     shareText: "Here is your PDF converted from PowerPoint",
//   },
//   "excel-to-pdf": {
//     heading: "Excel converted to PDF!",
//     description: "Your spreadsheet has been successfully converted to PDF.",
//     button: "Download PDF",
//     shareTitle: "Converted PDF File",
//     shareText: "Here is your PDF converted from Excel",
//   },
//   "edit-pdf": {
//     heading: "PDF has been edited!",
//     description: "Your edited PDF is ready for download.",
//     button: "Download edited PDF",
//     shareTitle: "Edited PDF Document",
//     shareText: "Here is your updated PDF document",
//   },
//   "pdf-to-jpg": {
//     heading: "PDF converted to JPG!",
//     description: "Your PDF pages have been successfully converted to images.",
//     button: "Download JPGs",
//     shareTitle: "Converted JPG Files",
//     shareText: "Here are the JPGs converted from your PDF",
//   },
//   "jpg-to-pdf": {
//     heading: "JPGs converted to PDF!",
//     description: "Your images have been combined into a PDF.",
//     button: "Download PDF",
//     shareTitle: "Combined PDF Document",
//     shareText: "Here is your PDF created from images",
//   },
//   "sign-pdf": {
//     heading: "PDF has been signed!",
//     description: "Your signature has been added successfully.",
//     button: "Download signed PDF",
//     shareTitle: "Signed PDF Document",
//     shareText: "Download your digitally signed PDF document",
//   },
//   "watermark": {
//     heading: "Watermark added to PDF!",
//     description: "Your watermark has been applied successfully.",
//     button: "Download watermarked PDF",
//     shareTitle: "Watermarked PDF Document",
//     shareText: "Here is your PDF with watermark",
//   },
//   "rotate-pdf": {
//     heading: "PDF has been rotated!",
//     description: "Your pages have been rotated as requested.",
//     button: "Download rotated PDF",
//     shareTitle: "Rotated PDF Document",
//     shareText: "Here is your rotated PDF",
//   },
//   "html-to-pdf": {
//     heading: "Webpage converted to PDF!",
//     description: "The HTML content has been saved as a PDF.",
//     button: "Download PDF",
//     shareTitle: "Webpage PDF",
//     shareText: "Download this PDF version of your webpage",
//   },
//   "unlock-pdf": {
//     heading: "PDF has been unlocked!",
//     description: "Password protection has been removed.",
//     button: "Download unlocked PDF",
//     shareTitle: "Unlocked PDF",
//     shareText: "Here is your password-free PDF",
//   },
//   "protect-pdf": {
//     heading: "PDF has been protected!",
//     description: "Your file is now password-protected.",
//     button: "Download protected PDF",
//     shareTitle: "Protected PDF",
//     shareText: "Here is your encrypted and secured PDF",
//   },
//   "organize-pdf": {
//     heading: "PDF pages organized!",
//     description: "Your document pages have been rearranged.",
//     button: "Download organized PDF",
//     shareTitle: "Organized PDF",
//     shareText: "Here is your rearranged PDF document",
//   },
//   "pdf-to-pdfa": {
//     heading: "PDF converted to PDF/A!",
//     description: "Your document is now suitable for long-term archiving.",
//     button: "Download PDF/A",
//     shareTitle: "PDF/A Document",
//     shareText: "Here is your archived PDF (PDF/A)",
//   },
//   "repair-pdf": {
//     heading: "PDF has been repaired!",
//     description: "Your damaged PDF has been fixed.",
//     button: "Download repaired PDF",
//     shareTitle: "Repaired PDF",
//     shareText: "Download your recovered PDF document",
//   },
//   "add-page-numbers": {
//     heading: "Page numbers added!",
//     description: "Your file now includes page numbers.",
//     button: "Download numbered PDF",
//     shareTitle: "Numbered PDF",
//     shareText: "Here is your PDF with page numbers",
//   },
//   "scan-to-pdf": {
//     heading: "Scans saved to PDF!",
//     description: "Your scanned pages have been combined into a PDF.",
//     button: "Download scanned PDF",
//     shareTitle: "Scanned PDF",
//     shareText: "Download your scanned document as PDF",
//   },
//   "ocr-pdf": {
//     heading: "PDF has been OCR processed!",
//     description: "Your PDF is now searchable and selectable.",
//     button: "Download OCR PDF",
//     shareTitle: "Searchable PDF",
//     shareText: "Here is your OCR-processed PDF",
//   },
//   "compare-pdf": {
//     heading: "PDF comparison complete!",
//     description: "The differences between your files have been highlighted.",
//     button: "Download comparison PDF",
//     shareTitle: "Compared PDF",
//     shareText: "Here is your comparison result PDF",
//   },
//   "redact-pdf": {
//     heading: "PDF has been redacted!",
//     description: "Sensitive information has been successfully removed.",
//     button: "Download redacted PDF",
//     shareTitle: "Redacted PDF",
//     shareText: "Here is your secure redacted PDF",
//   },
//   "crop-pdf": {
//     heading: "PDF has been cropped!",
//     description: "Margins and areas have been trimmed successfully.",
//     button: "Download cropped PDF",
//     shareTitle: "Cropped PDF",
//     shareText: "Here is your neatly cropped PDF document",
//   },
// };

// export function getDownloadMessage(toolType) {
//   return downloadMessages[toolType] || {
//     heading: "Download Ready!",
//     description: "Your document is ready to be downloaded.",
//     button: "Download file",
//     shareTitle: "PDF Tool Result",
//     shareText: "Check out this file generated using our PDF tool.",
//   };
// }
