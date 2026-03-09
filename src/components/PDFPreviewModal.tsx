'use client';

interface PDFPreviewModalProps {
  isOpen: boolean;
  previewBase64: string | null;
  onDownload: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  isGenerating: boolean;
}

export function PDFPreviewModal({
  isOpen,
  previewBase64,
  onDownload,
  onRegenerate,
  onClose,
  isGenerating,
}: PDFPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            PDF Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-auto max-h-[60vh] bg-gray-100 dark:bg-gray-900">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Generating preview...</p>
            </div>
          ) : previewBase64 ? (
            <img
              src={`data:image/png;base64,${previewBase64}`}
              alt="PDF Preview"
              className="w-full shadow-lg rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Preview not available</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Regenerate
          </button>
          <button
            onClick={onDownload}
            disabled={isGenerating || !previewBase64}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download PDF
          </button>
        </div>

        {/* Info text */}
        <p className="px-6 pb-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Preview shows first page. Full PDF will be downloaded.
        </p>
      </div>
    </div>
  );
}
