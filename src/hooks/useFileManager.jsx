"use client"

import { useState, useRef, useCallback } from "react"
import { pdfjs } from "react-pdf"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function useFileManager() {
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(new Set())
  const [fileHealthCheck, setFileHealthCheck] = useState({})
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
  const [filePages, setFilePages] = useState({})

  const fileDataCache = useRef({})
  const documentCache = useRef({})

  // Check if a file is password protected
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      try {
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "",
        })
        await loadingTask.promise
        return false
      } catch (pdfError) {
        if (
          pdfError.name === "PasswordException" ||
          pdfError.name === "MissingPDFException" ||
          pdfError.message?.includes("password") ||
          pdfError.message?.includes("encrypted")
        ) {
          setPasswordProtectedFiles((prev) => new Set([...prev, id]))
          return true
        }
        return false
      }
    } catch (error) {
      console.warn("Error checking password protection:", error)
      return false
    }
  }, [])

  // Create stable file data
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id]
      }

      try {
        const isPasswordProtected = await checkPasswordProtection(file, id)

        if (isPasswordProtected) {
          const stableData = {
            blob: null,
            dataUrl: null,
            uint8Array: null,
            isPasswordProtected: true,
          }
          fileDataCache.current[id] = stableData
          return stableData
        }

        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const blob = new Blob([uint8Array], { type: file.type })
        const objectUrl = URL.createObjectURL(blob)

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array.slice(),
          isPasswordProtected: false,
        }

        fileDataCache.current[id] = stableData
        return stableData
      } catch (error) {
        console.error("Error creating stable file data:", error)
        return null
      }
    },
    [checkPasswordProtection],
  )

  // Handle new files
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileObjects = await Promise.all(
        newFiles.map(async (file, index) => {
          const id = Date.now() + index + Math.random()
          const stableData = await createStableFileData(file, id)

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
          }
        }),
      )

      setFiles((prev) => [...prev, ...fileObjects])
    },
    [createStableFileData],
  )

  // Remove file
  const removeFile = useCallback((id) => {
    // Clean up object URL
    const fileData = fileDataCache.current[id]
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }

    // Clean up all references
    setLoadingFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    setPasswordProtectedFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    delete fileDataCache.current[id]

    if (documentCache.current[id]) {
      try {
        if (documentCache.current[id].destroy) {
          documentCache.current[id].destroy()
        }
      } catch (e) {
        console.warn("Document cleanup warning:", e)
      }
      delete documentCache.current[id]
    }

    setFileHealthCheck((prev) => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    setFiles((prev) => prev.filter((file) => file.id !== id))

    setFilePages((prev) => {
      const newPages = { ...prev }
      delete newPages[id]
      return newPages
    })
  }, [])

  // Sort files
  const sortFilesByName = useCallback((order = "asc") => {
    setFiles((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (order === "asc") {
          return a.name.localeCompare(b.name)
        } else {
          return b.name.localeCompare(a.name)
        }
      })
      return sorted
    })
  }, [])

  // Document load handlers
  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    setLoadingFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setFilePages((prev) => ({
      ...prev,
      [fileId]: pdf.numPages,
    }))

    documentCache.current[fileId] = pdf

    setFileHealthCheck((prev) => ({
      ...prev,
      [fileId]: true,
    }))
  }, [])

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`Document load error for file ${fileId}:`, error)

    setLoadingFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setFileHealthCheck((prev) => ({
      ...prev,
      [fileId]: false,
    }))
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    Object.values(fileDataCache.current).forEach((data) => {
      if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
        URL.revokeObjectURL(data.dataUrl)
      }
    })
  }, [])

  return {
    files,
    setFiles,
    loadingFiles,
    fileHealthCheck,
    passwordProtectedFiles,
    filePages,
    handleFiles,
    removeFile,
    sortFilesByName,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    cleanup,
  }
}
