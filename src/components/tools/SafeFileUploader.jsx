"use client"

import FileUploader from "@/components/tools/FileUploader"

// Safe wrapper for FileUploader that removes Framer Motion props
export default function SafeFileUploader(props) {
  // Remove Framer Motion props that shouldn't go to DOM
  const { whileTap, whileHover, animate, initial, ...safeProps } = props
  return <FileUploader {...safeProps} />
}
