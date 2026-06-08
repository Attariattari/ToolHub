"use client"

import { useState, useRef, useEffect } from "react"
import { FiX, FiTrash2, FiUpload } from "react-icons/fi"
import { BiPen } from "react-icons/bi"
import { MdOutlineTextFields } from "react-icons/md"
import { HiOutlineDocumentText } from "react-icons/hi2"
import { Type, Edit3, Upload } from "lucide-react"

// Mock SignatureCanvas component
const SignatureCanvas = ({ ref, canvasProps, onEnd }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (ref) {
      ref.current = {
        clear: () => {
          const canvas = canvasRef.current
          const ctx = canvas.getContext("2d")
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        },
        toDataURL: () => {
          return canvasRef.current.toDataURL()
        },
      }
    }
  }, [ref])

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    return {
      x: Math.max(0, Math.min(canvasRef.current.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvasRef.current.height, (e.clientY - rect.top) * scaleY)),
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const pos = getMousePos(e)
    setLastPosition(pos)
  }

  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const currentPosition = getMousePos(e)

    ctx.strokeStyle = canvasProps?.penColor || "#ef4444"
    ctx.lineWidth = 1.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    ctx.moveTo(lastPosition.x, lastPosition.y)
    ctx.lineTo(currentPosition.x, currentPosition.y)
    ctx.stroke()

    setLastPosition(currentPosition)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      if (onEnd) onEnd()
    }
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e) => draw(e)
    const handleGlobalMouseUp = () => stopDrawing()

    if (isDrawing) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDrawing, lastPosition])

  return (
    <canvas
      ref={canvasRef}
      width={canvasProps?.width || 600}
      height={canvasProps?.height || 400}
      className="w-full h-full border-2 border-dashed border-gray-300 cursor-crosshair hover:border-blue-400 transition-colors duration-200 bg-white rounded-lg"
      onMouseDown={startDrawing}
      onMouseMove={draw}
    />
  )
}

const SignatureModal = ({ isOpen, onClose, onSave, fieldType, initialData }) => {
  const [activeTab, setActiveTab] = useState("signature")
  const [activeLeftTab, setActiveLeftTab] = useState("text")
  const [fullName, setFullName] = useState(initialData?.name || "PdfDex")
  const [initials, setInitials] = useState("PD")
  const [selectedInitialStyle, setSelectedInitialStyle] = useState(0)
  const [selectedSignatureStyle, setSelectedSignatureStyle] = useState(0)
  const [signatureColor, setSignatureColor] = useState("#ef4444")
  const [companyStamp, setCompanyStamp] = useState(initialData?.companyStamp || null)
  const [drawnSignature, setDrawnSignature] = useState(initialData?.signature || null)
  const [drawnInitials, setDrawnInitials] = useState(initialData?.initials || null)
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false)

  const signatureCanvasRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && initialData) {
      setFullName(initialData.name || "PdfDex")
      setCompanyStamp(initialData.companyStamp || null)

      if (initialData.signature) {
        if (typeof initialData.signature === "string") {
          setDrawnSignature(initialData.signature)
        } else if (initialData.signature.text) {
          setSelectedSignatureStyle(initialData.signature.style || 0)
          setSignatureColor(initialData.signature.color || "#ef4444")
        }
      }

      if (initialData.initials) {
        if (typeof initialData.initials === "string") {
          setDrawnInitials(initialData.initials)
        } else if (initialData.initials.text) {
          setSelectedInitialStyle(initialData.initials.style || 0)
          setSignatureColor(initialData.initials.color || "#ef4444")
        }
      }
    }
  }, [isOpen, initialData])

  useEffect(() => {
    if (activeLeftTab === "signature" && signatureCanvasRef.current) {
      setTimeout(() => {
        const canvas = signatureCanvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let imageToLoad = null
        if (activeTab === "signature" && drawnSignature && typeof drawnSignature === "string") {
          imageToLoad = drawnSignature
        } else if (activeTab === "initials" && drawnInitials && typeof drawnInitials === "string") {
          imageToLoad = drawnInitials
        }

        if (imageToLoad) {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
          img.src = imageToLoad
        }
      }, 100)
    }
  }, [activeTab, activeLeftTab, drawnSignature, drawnInitials, isOpen])

  useEffect(() => {
    if (fieldType) {
      if (fieldType === "signature") {
        setActiveTab("signature")
      } else if (fieldType === "initials") {
        setActiveTab("initials")
      } else if (fieldType === "company") {
        setActiveTab("stamp")
      } else {
        setActiveTab("signature")
      }
    }
  }, [fieldType])

  // Auto generate initials from full name
  useEffect(() => {
    const words = fullName
      .trim()
      .split(" ")
      .filter((word) => word.length > 0)
    const generatedInitials = words.map((word) => word.charAt(0).toUpperCase()).join("")
    setInitials(generatedInitials)
  }, [fullName])

  const signatureStyles = [
    { id: 0, text: fullName, style: "font-dancing", name: "Dancing Script" },
    { id: 1, text: fullName, style: "font-cursive", name: "Cursive" },
    { id: 2, text: fullName, style: "font-serif", name: "Serif" },
    { id: 3, text: fullName, style: "font-mono", name: "Monospace" },
    { id: 4, text: fullName, style: "font-signature1", name: "Elegant Script" },
    { id: 5, text: fullName, style: "font-signature2", name: "Formal Signature" },
    { id: 6, text: fullName, style: "font-signature3", name: "Bold Signature" },
    { id: 7, text: fullName, style: "font-signature4", name: "Classic Script" },
    { id: 8, text: fullName, style: "font-signature5", name: "Modern Signature" },
    { id: 9, text: fullName, style: "font-signature6", name: "Stylish Script" },
  ]

  const initialStyles = [
    { id: 0, text: initials, style: "font-dancing", name: "Dancing Script" },
    { id: 1, text: initials, style: "font-cursive", name: "Cursive" },
    { id: 2, text: initials, style: "font-serif", name: "Serif" },
    { id: 3, text: initials, style: "font-mono", name: "Monospace" },
    { id: 4, text: initials, style: "font-signature1", name: "Elegant Script" },
    { id: 5, text: initials, style: "font-signature2", name: "Formal Signature" },
    { id: 6, text: initials, style: "font-signature3", name: "Bold Signature" },
    { id: 7, text: initials, style: "font-signature4", name: "Classic Script" },
    { id: 8, text: initials, style: "font-signature5", name: "Modern Signature" },
    { id: 9, text: initials, style: "font-signature6", name: "Stylish Script" },
  ]

  const colors = [
    "#000000", // Black
    "#ef4444", // Red
    "#3b82f6", // Blue
    "#10b981", // Green
  ]

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear()
      if (activeTab === "signature") {
        setDrawnSignature(null)
      } else if (activeTab === "initials") {
        setDrawnInitials(null)
      }
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/svg+xml")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCompanyStamp(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignatureEnd = () => {
    if (signatureCanvasRef.current) {
      const dataURL = signatureCanvasRef.current.toDataURL()
      if (activeTab === "signature") {
        setDrawnSignature(dataURL)
      } else if (activeTab === "initials") {
        setDrawnInitials(dataURL)
      }
    }
  }

  const removeCompanyStamp = () => {
    setCompanyStamp(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = () => {
    const saveData = {
      name: fullName,
      signature:
        activeLeftTab === "signature"
          ? drawnSignature
          : activeLeftTab === "text"
            ? {
              text: fullName,
              style: selectedSignatureStyle,
              color: signatureColor,
            }
            : null,
      initials: drawnInitials
        ? drawnInitials
        : activeLeftTab === "text"
          ? {
            text: initials,
            style: selectedInitialStyle,
            color: signatureColor,
          }
          : {
            text: initials,
            style: selectedInitialStyle,
            color: signatureColor,
          },
      companyStamp: companyStamp,
    }

    onSave(saveData)
  }

  const renderSignatureContent = () => {
    if (activeLeftTab === "text") {
      return (
        <div className="space-y-4">
          <div className="max-h-[250px] sm:max-h-[280px] border overflow-y-auto custom-scrollbar space-y-2 p-2 bg-gray-50 rounded-lg">
            {signatureStyles.map((style) => (
              <div
                key={style.id}
                className="border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 hover:border-blue-300 transition-colors duration-200 bg-white"
              >
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="signatureStyle"
                    checked={selectedSignatureStyle === style.id}
                    onChange={() => setSelectedSignatureStyle(style.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2 accent-blue-600"
                  />
                  <span
                    className={`text-lg sm:text-xl ${style.style === "font-dancing"
                        ? "font-bold italic"
                        : style.style === "font-cursive"
                          ? "italic"
                          : style.style === "font-serif"
                            ? "font-serif"
                            : style.style === "font-mono"
                              ? "font-mono"
                              : style.style === "font-signature1"
                                ? "font-bold italic tracking-wide"
                                : style.style === "font-signature2"
                                  ? "italic font-serif tracking-wider"
                                  : style.style === "font-signature3"
                                    ? "font-bold tracking-widest"
                                    : style.style === "font-signature4"
                                      ? "italic font-sans tracking-wide"
                                      : style.style === "font-signature5"
                                        ? "font-bold italic"
                                        : style.style === "font-signature6"
                                          ? "italic font-serif"
                                          : ""
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
      )
    } else if (activeLeftTab === "signature") {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Draw your signature:</h3>
          <div
            className="relative w-full max-w-full overflow-hidden"
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => setIsHoveringCanvas(false)}
          >
            <div
              className="w-full mx-auto"
              style={{
                maxWidth: window.innerWidth < 640 ? "600px" : "390px",
                aspectRatio: "3/2",
              }}
            >
              <SignatureCanvas
                ref={signatureCanvasRef}
                canvasProps={{
                  width: window.innerWidth < 640 ? 600 : 390, // Mobile: 600px, Desktop: 390px (35% reduction)
                  height: window.innerWidth < 640 ? 400 : 260, // Mobile: 400px, Desktop: 260px (35% reduction)
                  penColor: signatureColor,
                }}
                onEnd={handleSignatureEnd}
              />
            </div>

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
      )
    } else if (activeLeftTab === "upload") {
      return (
        <div className="space-y-4">
          {companyStamp ? (
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
              <img
                src={companyStamp || "/placeholder.svg"}
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                <FiUpload className="w-4 h-4 sm:w-5 sm:h-5" />
                Upload signature image
              </button>
              <p className="text-gray-500 mt-4">or drop file here</p>
              <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
            </div>
          )}
        </div>
      )
    }
  }

  const renderInitialsContent = () => {
    if (activeLeftTab === "text") {
      return (
        <div className="space-y-4">
          <div className="max-h-[250px] sm:max-h-[280px] overflow-y-auto custom-scrollbar space-y-2 border p-2 bg-gray-50 rounded-lg">
            {initialStyles.map((style) => (
              <div
                key={style.id}
                className="border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 hover:border-blue-300 transition-colors duration-200 bg-white"
              >
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="initialStyle"
                    checked={selectedInitialStyle === style.id}
                    onChange={() => setSelectedInitialStyle(style.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2 accent-blue-600"
                  />
                  <span
                    className={`text-lg sm:text-xl ${style.style === "font-dancing"
                        ? "font-bold italic"
                        : style.style === "font-cursive"
                          ? "italic"
                          : style.style === "font-serif"
                            ? "font-serif"
                            : style.style === "font-mono"
                              ? "font-mono"
                              : style.style === "font-signature1"
                                ? "font-bold italic tracking-wide"
                                : style.style === "font-signature2"
                                  ? "italic font-serif tracking-wider"
                                  : style.style === "font-signature3"
                                    ? "font-bold tracking-widest"
                                    : style.style === "font-signature4"
                                      ? "italic font-sans tracking-wide"
                                      : style.style === "font-signature5"
                                        ? "font-bold italic"
                                        : style.style === "font-signature6"
                                          ? "italic font-serif"
                                          : ""
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
      )
    } else if (activeLeftTab === "signature") {
      return (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Draw your initials:</h3>
          <div
            className="relative w-full max-w-full overflow-hidden"
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => setIsHoveringCanvas(false)}
          >
            <div
              className="w-full mx-auto"
              style={{
                maxWidth: window.innerWidth < 640 ? "600px" : "390px",
                aspectRatio: "3/2",
              }}
            >
              <SignatureCanvas
                ref={signatureCanvasRef}
                canvasProps={{
                  width: window.innerWidth < 640 ? 600 : 390, // Mobile: 600px, Desktop: 390px (35% reduction)
                  height: window.innerWidth < 640 ? 400 : 260, // Mobile: 400px, Desktop: 260px (35% reduction)
                  penColor: signatureColor,
                }}
                onEnd={handleSignatureEnd}
              />
            </div>

            {(isHoveringCanvas || drawnInitials) && (
              <button
                onClick={clearSignature}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg z-10"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )
    } else if (activeLeftTab === "upload") {
      return (
        <div className="space-y-4">
          {companyStamp ? (
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
              <img src={companyStamp || "/placeholder.svg"} alt="Initials Upload" className="max-h-32 object-contain" />
              <button
                onClick={removeCompanyStamp}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                <FiUpload className="w-4 h-4" />
                Upload initials image
              </button>
              <p className="text-gray-500 mt-4">or drop file here</p>
              <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
            </div>
          )}
        </div>
      )
    }
  }

  const renderCompanyStampContent = () => {
    return (
      <div className="space-y-6">
        {companyStamp ? (
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
            <img src={companyStamp || "/placeholder.svg"} alt="Company Stamp" className="max-h-32 object-contain" />
            <button
              onClick={removeCompanyStamp}
              className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center hover:border-blue-400 transition-colors duration-200">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              <FiUpload className="w-4 h-4" />
              Upload company stamp
            </button>
            <p className="text-gray-500 mt-4">or drop file here</p>
            <p className="text-sm text-gray-400 mt-2">Accepted formats: PNG, JPG and SVG</p>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Set your signature details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6">
            {/* Name and Initials Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full name:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initials:</label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab("signature")
                  setActiveLeftTab("text")
                }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "signature"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
              >
                <BiPen className="w-4 h-4 sm:w-5 sm:h-5" />
                Signature
              </button>
              <button
                onClick={() => {
                  setActiveTab("initials")
                  setActiveLeftTab("text")
                }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "initials"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
              >
                <MdOutlineTextFields className="w-4 h-4 sm:w-5 sm:h-5" />
                Initials
              </button>
              <button
                onClick={() => setActiveTab("stamp")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${activeTab === "stamp"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
              >
                <HiOutlineDocumentText className="w-4 h-4 sm:w-5 sm:h-5" />
                Company Stamp
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-h-[200px]">
              {/* Left Sidebar - Only for Signature and Initials tabs */}
              {(activeTab === "signature" || activeTab === "initials") && (
                <div className="flex sm:flex-col gap-2 sm:gap-2 px-1">
                  <button
                    onClick={() => setActiveLeftTab("text")}
                    className={`flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === "text"
                        ? "bg-white text-blue-600 shadow-sm border-blue-200"
                        : "text-gray-600 hover:bg-white hover:text-gray-800"
                      }`}
                  >
                    <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setActiveLeftTab("signature")}
                    className={`flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === "signature"
                        ? "bg-white text-blue-600 shadow-sm border-blue-200"
                        : "text-gray-600 hover:bg-white hover:text-gray-800"
                      }`}
                  >
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setActiveLeftTab("upload")}
                    className={`flex items-center justify-center p-2 border rounded-lg transition-colors duration-200 ${activeLeftTab === "upload"
                        ? "bg-white text-blue-600 shadow-sm border-blue-200"
                        : "text-gray-600 hover:bg-white hover:text-gray-800"
                      }`}
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}

              {/* Right Content Area */}
              <div className="flex-1 space-y-4 sm:space-y-6">
                {/* Show content based on active tab */}
                {activeTab === "signature" && renderSignatureContent()}
                {activeTab === "initials" && renderInitialsContent()}
                {activeTab === "stamp" && renderCompanyStampContent()}

                {/* Color Picker */}
                {(activeTab === "signature" || activeTab === "initials") && activeLeftTab !== "upload" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-4 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Color:</span>
                    <div className="flex gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSignatureColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${signatureColor === color ? "border-gray-400 scale-110" : "border-gray-200"
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
        <div className="flex items-center justify-end gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignatureModal
