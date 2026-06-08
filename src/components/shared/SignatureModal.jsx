import React, { useState, useRef, useEffect } from 'react';
import { FiSettings, FiX, FiTrash2, FiUpload } from 'react-icons/fi';
import { BiPen } from 'react-icons/bi';
import { MdOutlineTextFields } from 'react-icons/md';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import { Type, Edit3, Upload } from 'lucide-react';

// Mock SignatureCanvas component
const SignatureCanvas = ({ ref, canvasProps, onEnd }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (ref) {
      ref.current = {
        clear: () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        toDataURL: () => {
          return canvasRef.current.toDataURL();
        }
      };
    }
  }, [ref]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvasRef.current.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(canvasRef.current.height, e.clientY - rect.top))
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    setLastPosition(pos);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPosition = getMousePos(e);

    ctx.strokeStyle = canvasProps?.penColor || '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.stroke();

    setLastPosition(currentPosition);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onEnd) onEnd();
    }
  };

  // Add global mouse events to handle drawing outside canvas
  useEffect(() => {
    const handleGlobalMouseMove = (e) => draw(e);
    const handleGlobalMouseUp = () => stopDrawing();

    if (isDrawing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing, lastPosition]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasProps?.width || 700}
      height={canvasProps?.height || 200}
      className="border-2 border-dashed border-gray-300 cursor-crosshair hover:border-blue-400 transition-colors duration-200 bg-white"
      onMouseDown={startDrawing}
      onMouseMove={draw}
    />
  );
};

const SignatureModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('signature');
  const [activeLeftTab, setActiveLeftTab] = useState('text');
  const [fullName, setFullName] = useState('PdfDex');
  const [initials, setInitials] = useState('PD');
  const [selectedInitialStyle, setSelectedInitialStyle] = useState(0);
  const [selectedSignatureStyle, setSelectedSignatureStyle] = useState(0);
  const [signatureColor, setSignatureColor] = useState('#ef4444');
  const [companyStamp, setCompanyStamp] = useState(null);
  const [drawnSignature, setDrawnSignature] = useState(null);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  const signatureCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto generate initials from full name
  useEffect(() => {
    const words = fullName.trim().split(' ').filter(word => word.length > 0);
    const generatedInitials = words.map(word => word.charAt(0).toUpperCase()).join('');
    setInitials(generatedInitials);
  }, [fullName]);

  // Signature style options
  const signatureStyles = [
    { id: 0, text: fullName, style: 'font-dancing' },
    { id: 1, text: fullName, style: 'font-cursive' },
    { id: 2, text: fullName, style: 'font-serif' },
    { id: 3, text: fullName, style: 'font-mono' }
  ];

  // Initial style options
  const initialStyles = [
    { id: 0, text: initials, style: 'font-dancing' },
    { id: 1, text: initials, style: 'font-cursive' },
    { id: 2, text: initials, style: 'font-serif' },
    { id: 3, text: initials, style: 'font-mono' }
  ];

  const colors = [
    '#000000', // Black
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981'  // Green
  ];

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      setDrawnSignature(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/svg+xml')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyStamp(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureEnd = () => {
    if (signatureCanvasRef.current) {
      const dataURL = signatureCanvasRef.current.toDataURL();
      setDrawnSignature(dataURL);
    }
  };

  const removeCompanyStamp = () => {
    setCompanyStamp(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderSignatureContent = () => {
    if (activeLeftTab === 'text') {
      return (
        <div className="space-y-4">
          {/* Scrollable text options container */}
          <div className="max-h-[330px] border overflow-y-auto custom-scrollbar space-y-2 p-2">
            {signatureStyles.map((style) => (
              <div key={style.id} className="border-2 border-gray-200 rounded-lg px-4 py-2 hover:border-blue-300 transition-colors duration-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="signatureStyle"
                    checked={selectedSignatureStyle === style.id}
                    onChange={() => setSelectedSignatureStyle(style.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-xl ${style.style === 'font-dancing' ? 'font-bold italic' :
                      style.style === 'font-cursive' ? 'italic' :
                        style.style === 'font-serif' ? 'font-serif' :
                          'font-mono'
                      }`}
                    style={{ color: signatureColor }}
                  >
                    {style.text}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (activeLeftTab === 'signature') {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Draw your signature:</h3>
          <div
            className="relative w-full"
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => setIsHoveringCanvas(false)}
          >
            <SignatureCanvas
              ref={signatureCanvasRef}
              canvasProps={{
                width: 785,
                height: 250,
                penColor: signatureColor
              }}
              onEnd={handleSignatureEnd}
            />

            {(isHoveringCanvas || drawnSignature) && (
              <button
                onClick={clearSignature}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg z-10"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeLeftTab === 'upload') {
      return (
        <div className="space-y-4">
          {companyStamp ? (
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
              <img
                src={companyStamp}
                alt="Signature Upload"
                className="max-h-32 object-contain"
              />
              <button
                onClick={removeCompanyStamp}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                <FiUpload className="w-4 h-4" />
                Upload signature image
              </button>
              <p className="text-gray-500 mt-4">or drop file here</p>
              <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
            </div>
          )}
        </div>
      );
    }
  };

  const renderInitialsContent = () => {
    if (activeLeftTab === 'text') {
      return (
        <div className="space-y-4">
          {/* Scrollable text options container */}
          <div className="max-h-[330px] overflow-y-auto custom-scrollbar custom-scrollbar space-y-2 border p-2">
            {initialStyles.map((style) => (
              <div key={style.id} className="border-2 border-gray-200 rounded-lg px-4 py-2 hover:border-blue-300 transition-colors duration-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="initialStyle"
                    checked={selectedInitialStyle === style.id}
                    onChange={() => setSelectedInitialStyle(style.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-xl ${style.style === 'font-dancing' ? 'font-bold italic' :
                      style.style === 'font-cursive' ? 'italic' :
                        style.style === 'font-serif' ? 'font-serif' :
                          'font-mono'
                      }`}
                    style={{ color: signatureColor }}
                  >
                    {style.text}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (activeLeftTab === 'signature') {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Draw your initials:</h3>
          <div
            className="relative w-full"
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => setIsHoveringCanvas(false)}
          >
            <SignatureCanvas
              ref={signatureCanvasRef}
              canvasProps={{
                width: 785,
                height: 200,
                penColor: signatureColor
              }}
              onEnd={handleSignatureEnd}
            />

            {(isHoveringCanvas || drawnSignature) && (
              <button
                onClick={clearSignature}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg z-10"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeLeftTab === 'upload') {
      return (
        <div className="space-y-4">
          {companyStamp ? (
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
              <img
                src={companyStamp}
                alt="Initials Upload"
                className="max-h-32 object-contain"
              />
              <button
                onClick={removeCompanyStamp}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                <FiUpload className="w-4 h-4" />
                Upload initials image
              </button>
              <p className="text-gray-500 mt-4">or drop file here</p>
              <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
            </div>
          )}
        </div>
      );
    }
  };

  const renderCompanyStampContent = () => {
    return (
      <div className="space-y-6">
        {companyStamp ? (
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
            <img
              src={companyStamp}
              alt="Company Stamp"
              className="max-h-32 object-contain"
            />
            <button
              onClick={removeCompanyStamp}
              className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              <FiUpload className="w-4 h-4" />
              Upload company stamp
            </button>
            <p className="text-gray-500 mt-4">or drop file here</p>
            <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <FiSettings className="w-4 h-4" />
        Signature Settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Set your signature details</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6">
            {/* Name and Initials Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full name:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initials:
                </label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => {
                  setActiveTab('signature');
                  setActiveLeftTab('text'); // Reset to text when switching tabs
                }}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'signature'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                <BiPen className="w-4 h-4" />
                Signature
              </button>
              <button
                onClick={() => {
                  setActiveTab('initials');
                  setActiveLeftTab('text'); // Reset to text when switching tabs
                }}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'initials'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                <MdOutlineTextFields className="w-4 h-4" />
                Initials
              </button>
              <button
                onClick={() => setActiveTab('stamp')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === 'stamp'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                <HiOutlineDocumentText className="w-4 h-4" />
                Company Stamp
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-2 min-h-[200px]">
              {/* Left Sidebar - Only for Signature and Initials tabs */}
              {(activeTab === 'signature' || activeTab === 'initials') && (
                <div className="rounded-lg px-1 space-y-2">
                  <button
                    onClick={() => setActiveLeftTab('text')}
                    className={`w-fit flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === 'text'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                  >
                    <Type className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('signature')}
                    className={`w-fit flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === 'signature'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('upload')}
                    className={`w-fit flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Right Content Area */}
              <div className="flex-1 space-y-6">
                {/* Show content based on active tab */}
                {activeTab === 'signature' && renderSignatureContent()}
                {activeTab === 'initials' && renderInitialsContent()}
                {/* For company stamp, hide left sidebar and show only upload */}
                {activeTab === 'stamp' && renderCompanyStampContent()}

                {/* Color Picker - Show only for text and signature tabs, not for upload or company stamp */}
                {(activeTab === 'signature' || activeTab === 'initials') && activeLeftTab !== 'upload' && (
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Color:</span>
                    <div className="flex space-x-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSignatureColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${signatureColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log('Applied signature settings');
              setIsOpen(false);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;