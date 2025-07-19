import FileViewer from 'react-file-viewer';
import { FileText } from 'lucide-react';
import { Document, Page } from 'react-pdf';

// Custom Error Component for react-file-viewer
const CustomErrorComponent = ({ errorType, ...otherProps }) => {
  return (
    <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
      <FileText className="w-16 h-16 text-red-400" />
      <div className="absolute bottom-2 left-2 text-xs text-red-600 font-semibold">
        Error loading file
      </div>
    </div>
  );
};

// Function to get file extension from file name or mime type
const getFileExtension = (file) => {
  if (file.name) {
    return file.name.split('.').pop().toLowerCase();
  }

  // Fallback: derive extension from mime type
  const mimeTypeMap = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/csv': 'csv',
    'application/json': 'json',
    'text/xml': 'xml',
    'application/xml': 'xml'
  };

  return mimeTypeMap[file.type] || 'unknown';
};

// Error handler for react-file-viewer
const onError = (e) => {
  console.log('File viewer error:', e);
};

const renderFilePreview = (file) => {
  const rotation = fileRotations[file.id] || 0;
  const fileExtension = getFileExtension(file);

  // Special handling for PDFs with existing functionality
  if (file.type === "application/pdf") {
    return (
      <div className="w-full h-full relative">
        <Document
          file={file.file}
          onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
          loading={
            <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
              <FileText className="w-12 h-12 text-red-400 animate-pulse" />
            </div>
          }
          error={
            <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
              <FileText className="w-12 h-12 text-red-400" />
              <div className="absolute bottom-2 left-2 text-xs text-red-600 font-semibold">PDF</div>
            </div>
          }
        >
          <Page
            pageNumber={1}
            scale={0.8}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="pdf-preview-page"
            style={{
              transform: `rotate(${rotation}deg)`,
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </Document>
        {pdfPages[file.id] && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {pdfPages[file.id]} pages
          </div>
        )}
      </div>
    );
  }

  // For images, keep existing functionality for rotation
  else if (file.type.startsWith("image/")) {
    return (
      <img
        src={file.preview || "/placeholder.svg"}
        alt={file.name}
        className="w-full h-full object-cover rounded-lg"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    );
  }

  // For all other file types, use react-file-viewer
  else {
    return (
      <div
        className="w-full h-full relative"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <FileViewer
          fileType={fileExtension}
          filePath={file.preview || URL.createObjectURL(file.file)}
          errorComponent={CustomErrorComponent}
          onError={onError}
          width="100%"
          height="100%"
        />
      </div>
    );
  }
};

export default renderFilePreview;