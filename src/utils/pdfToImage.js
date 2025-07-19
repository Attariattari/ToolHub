import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const renderPdfPageAsImage = async (file) => {
  return new Promise(async (resolve) => {
    try {
      const timeout = setTimeout(() => {
        console.warn("PDF render timeout");
        resolve(null);
      }, 8000); // 8 sec timeout

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const scale = 1.0;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      clearTimeout(timeout);

      const imageData = canvas.toDataURL();
      resolve(imageData);
    } catch (error) {
      console.error("PDF render error", error);
      resolve(null);
    }
  });
};

