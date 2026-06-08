export const progressMessages = {
  "/merge-pdf": {
    title: "Merging PDFs...",
    subtitle: "Please wait while we combine your files",
  },
  "/split-pdf": {
    title: "Splitting PDF...",
    subtitle: "Please wait while we extract the selected pages",
  },
  "/compress-pdf": {
    title: "Compressing PDFs...",
    subtitle: "Please wait while we reduce the file sizes",
  },
  "/pdf-to-word": {
    title: "Converting PDFs to Word...",
    subtitle: "Please wait while we convert your files to editable documents",
  },
  "/pdf-to-powerpoint": {
    title: "Converting PDFs to PowerPoint...",
    subtitle: "Please wait while we convert your files into presentations",
  },
  "/pdf-to-excel": {
    title: "Converting PDFs to Excel...",
    subtitle: "Please wait while we extract tables from your files",
  },
  "/word-to-pdf": {
    title: "Converting Word to PDF...",
    subtitle: "Please wait while we convert your documents to PDF format",
  },
  "/powerpoint-to-pdf": {
    title: "Converting PowerPoint to PDF...",
    subtitle: "Please wait while we convert your presentations to PDF",
  },
  "/excel-to-pdf": {
    title: "Converting Excel to PDF...",
    subtitle: "Please wait while we convert your spreadsheets to PDF",
  },
  "/edit-pdf": {
    title: "Editing PDF...",
    subtitle: "Please wait while we apply your changes",
  },
  "/pdf-to-jpg": {
    title: "Converting PDF to JPG...",
    subtitle: "Please wait while we extract images from your file",
  },
  "/jpg-to-pdf": {
    title: "Converting JPG to PDF...",
    subtitle: "Please wait while we generate your PDF file",
  },
  "/sign-pdf": {
    title: "Signing PDF...",
    subtitle: "Please wait while we apply your signature",
  },
  "/add-watermark": {
    title: "Applying Watermark...",
    subtitle: "Please wait while we add watermark to your PDF",
  },
  "/rotate-pdf": {
    title: "Rotating PDF...",
    subtitle: "Please wait while we adjust page orientation",
  },
  "/html-to-pdf": {
    title: "Converting HTML to PDF...",
    subtitle: "Please wait while we convert your webpage to PDF",
  },
  "/unlock-pdf": {
    title: "Unlocking PDF...",
    subtitle: "Please wait while we remove password protection",
  },
  "/protect-pdf": {
    title: "Protecting PDF...",
    subtitle: "Please wait while we encrypt your file",
  },
  "/organize-pdf": {
    title: "Organizing PDF...",
    subtitle: "Please wait while we rearrange your document pages",
  },
  "/pdf-to-pdfa": {
    title: "Converting to PDF/A...",
    subtitle: "Please wait while we archive your PDF in standard format",
  },
  "/repair-pdf": {
    title: "Repairing PDF...",
    subtitle: "Please wait while we fix your damaged file",
  },
  "/add-pdf-page-number": {
    title: "Adding Page Numbers...",
    subtitle: "Please wait while we insert numbers into your document",
  },
  "/scan-to-pdf": {
    title: "Scanning to PDF...",
    subtitle: "Please wait while we capture your document",
  },
  "/ocr-pdf": {
    title: "Running OCR on PDF...",
    subtitle: "Please wait while we extract text from your scanned file",
  },
  "/compare-pdf": {
    title: "Comparing PDFs...",
    subtitle: "Please wait while we analyze the differences",
  },
  "/redact-pdf": {
    title: "Redacting PDF...",
    subtitle: "Please wait while we remove sensitive content",
  },
  "/crop-pdf": {
    title: "Cropping PDF...",
    subtitle: "Please wait while we adjust your document layout",
  },
};

export function getProgressMessage(url) {
  return progressMessages[url] || {
    title: "Processing...",
    subtitle: "Please wait while we handle your request",
  };
}
