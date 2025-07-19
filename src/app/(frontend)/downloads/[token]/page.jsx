"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Download,
  ArrowLeft,
  Share2,
  Trash2,
  FileText,
  FileArchiveIcon as Compress,
  Split,
  RotateCw,
  Shield,
  Hash,
  Droplets,
} from "lucide-react"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import { API_URL } from "@/constants/constants"

export default function DownloadPage() {
  const { token } = useParams()
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const [taskDetails, setTaskDetails] = useState(null)
  const [documentUrl, setDocumentUrl] = useState("")

  // Parse token to extract document name and dbTaskId
  useEffect(() => {
    try {
      // Decode the URL encoded token
      const decodedToken = decodeURIComponent(token)
      console.log('Decoded token:', decodedToken)

      // Split the token to get document name and query params
      const [documentPart, queryPart] = decodedToken.split('?')
      const documentName = documentPart.split('=')[1]
      const dbTaskId = queryPart?.split('=')[1]

      if (documentName) {
        setDocumentUrl(`${API_URL}/public/documents/${documentName}`)
        if (dbTaskId) {
          fetchTaskDetails(dbTaskId)
        }
      } else {
        toast.error('Invalid download link')
      }
    } catch (error) {
      console.error('Error parsing token:', error)
      toast.error('Invalid download link')
    }
  }, [token])

  // Fetch task details
  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await Api.get(`/tools/task/${taskId}`)
      if (response.data) {
        setTaskDetails(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
      toast.error('Failed to fetch task details')
    }
  }

  // Auto download on page load
  // useEffect(() => {
  //   if (documentUrl && !isDownloading) {
  //     handleDownload()
  //   }
  // }, [documentUrl])

  const handleDownload = async () => {
    if (!documentUrl) return

    setIsDownloading(true)
    try {
      // Fetch the file as blob
      const response = await fetch(documentUrl)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      
      // Create object URL
      const url = window.URL.createObjectURL(blob)
      
      // Create temporary link
      const link = document.createElement('a')
      link.href = url
      link.download = documentUrl.split('/').pop() // Get filename from URL
      
      // Append to body, click and remove
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!taskDetails?._id) return

    try {
      await Api.delete(`/tools/task/${taskDetails._id}`)
      toast.success('File deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Merged PDF Document',
        text: 'Check out this merged PDF document',
        url: window.location.href,
      }).catch(console.error)
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const suggestedTools = [
    {
      name: "Compress PDF",
      description: "Reduce file size",
      icon: Compress,
      color: "bg-green-500",
      href: "/compress-pdf",
    },
    {
      name: "Split PDF",
      description: "Extract pages",
      icon: Split,
      color: "bg-blue-500",
      href: "/split-pdf",
    },
    {
      name: "Add page numbers",
      description: "Number your pages",
      icon: Hash,
      color: "bg-purple-500",
      href: "/add-page-numbers",
    },
    {
      name: "Add watermark",
      description: "Protect your document",
      icon: Droplets,
      color: "bg-pink-500",
      href: "/add-watermark",
    },
    {
      name: "Rotate PDF",
      description: "Fix orientation",
      icon: RotateCw,
      color: "bg-orange-500",
      href: "/rotate-pdf",
    },
    {
      name: "Protect PDF",
      description: "Add password",
      icon: Shield,
      color: "bg-indigo-500",
      href: "/protect-pdf",
    },
  ]

  const socialPlatforms = [
    { name: "Trustpilot", icon: "⭐", color: "bg-green-600" },
    { name: "Facebook", icon: "📘", color: "bg-blue-600" },
    { name: "Twitter", icon: "🐦", color: "bg-sky-500" },
    { name: "LinkedIn", icon: "💼", color: "bg-blue-700" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDFs have been merged!</h1>
          <p className="text-xl text-gray-600">Your files have been successfully combined into one document.</p>
        </div>

        {/* Download Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 min-w-0"
              >
                <Download className="w-6 h-6" />
                {isDownloading ? "Downloading..." : "Download merged PDF"}
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">File will be automatically deleted after 1 hour for your privacy</p>
            </div>
          </div>
        </div>

        {/* Continue To Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Continue to...</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedTools.map((tool, index) => (
              <button
                key={index}
                onClick={() => router.push(tool.href)}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-6">
            <button className="text-red-600 hover:text-red-700 font-medium">See more tools →</button>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How can you thank us? Spread the word!</h3>
          <p className="text-gray-600 mb-6">Please share the tool to inspire more productive people!</p>

          <div className="flex flex-wrap justify-center gap-4">
            {socialPlatforms.map((platform, index) => (
              <button
                key={index}
                className={`${platform.color} hover:opacity-90 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
              >
                <span className="text-lg">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
