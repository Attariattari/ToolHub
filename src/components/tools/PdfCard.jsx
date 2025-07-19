import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';

import { Viewer } from '@react-pdf-viewer/core';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';

const thumbnailPluginInstance = thumbnailPlugin();
const { Cover } = thumbnailPluginInstance;

function PdfCard({ fileUrl }) {
  return (
    <div className="card-preview">
      <Cover fileUrl={fileUrl} width={200} />
    </div>
  );
}

export default PdfCard

