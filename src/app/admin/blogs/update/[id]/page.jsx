'use client'
import React from 'react'
import CreateBlogPage from '../../create/page'
import { useParams } from 'next/navigation'

const UpdatePage = () => {
  const { token } = useParams()

  return (
    <CreateBlogPage
      isEditMode={true}
      blogId={token}
    />
  )
}

export default UpdatePage