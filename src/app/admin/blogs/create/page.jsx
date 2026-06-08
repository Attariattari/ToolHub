"use client"
import { useState, useRef, useEffect, useCallback, useContext } from "react"
import { FaSave, FaTags, FaFolder, FaImage, FaFileAlt, FaUpload, FaTimes } from "react-icons/fa"
import { BlogsContext } from "@/context/Blog.context"
import { useParams, useRouter } from "next/navigation"
import { API_URL } from "@/constants/constants"

export default function CreateBlogPage({ isEditMode = false, blogId = null }) {
  const router = useRouter()
  const params = useParams()
  const {
    createBlog,
    updateBlog,
    fetchSingleBlog,
    singleBlog,
    isLoading: contextLoading
  } = useContext(BlogsContext)

  // Get blog ID from params if in edit mode
  const currentBlogId = blogId || params?.id || params?.token

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    status: "draft",
    featuredImage: null,
    metaTitle: "",
    metaDescription: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [tagInput, setTagInput] = useState("")
  const [isQuillLoaded, setIsQuillLoaded] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [quillInitialized, setQuillInitialized] = useState(false)

  const quillRef = useRef(null)
  const [quillInstance, setQuillInstance] = useState(null)

  // Available categories
  const categories = [
    "Tips & Tricks",
    "Tutorials",
    "Security",
    "Best Practices",
    "Technical",
    "Reviews",
    "Help",
    "News",
  ]

  // Fetch blog data for edit mode
  useEffect(() => {
    if (isEditMode && currentBlogId && !isDataLoaded) {
      fetchBlogData()
    } else if (!isEditMode) {
      setIsDataLoaded(true)
    }
  }, [isEditMode, currentBlogId, isDataLoaded])

  const fetchBlogData = async () => {
    try {
      const blogData = await fetchSingleBlog(currentBlogId)
      if (blogData) {
        setFormData({
          title: blogData.title || "",
          slug: blogData.slug || "",
          content: blogData.content || "",
          excerpt: blogData.excerpt || "",
          category: blogData.category || "",
          tags: blogData.tags || [],
          status: blogData.status || "draft",
          featuredImage: null, // Don't set existing file, just show preview
          metaTitle: blogData.metaTitle || "",
          metaDescription: blogData.metaDescription || "",
        })

        // Set image preview if exists
        if (blogData.featuredImage) {
          setImagePreview(API_URL + '/' + blogData.featuredImage)
        }

        setIsDataLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching blog data:", error)
      setIsDataLoaded(true)
    }
  }

  // Initialize Quill only once when data is loaded and ref is ready
  useEffect(() => {
    // Only initialize if:
    // 1. Quill is not yet initialized
    // 2. Data is loaded (for both create and edit mode)
    // 3. Ref is available
    if (!quillInitialized && isDataLoaded && quillRef.current) {
      initializeQuill()
    }

    // Cleanup function to prevent double initialization
    return () => {
      if (quillInstance) {
        // Don't cleanup here as it might cause issues
        // Just let the component unmount naturally
      }
    }
  }, [isDataLoaded, quillInitialized])

  const initializeQuill = () => {
    // Check if Quill is already loaded
    if (window.Quill) {
      createQuillInstance()
      return
    }

    // Load Quill dynamically
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css'
      document.head.appendChild(link)

      // Small delay to ensure CSS is loaded
      setTimeout(() => {
        createQuillInstance()
      }, 100)
    }

    script.onerror = () => {
      console.error('Failed to load Quill.js')
    }

    document.head.appendChild(script)
  }

  const createQuillInstance = () => {
    if (window.Quill && quillRef.current && !quillInstance) {
      const quill = new window.Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write your blog content here...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        },
        formats: [
          'header', 'font', 'size',
          'bold', 'italic', 'underline', 'strike',
          'color', 'background',
          'script', 'super', 'sub',
          'blockquote', 'code-block',
          'list', 'bullet', 'indent',
          'align', 'direction',
          'link', 'image', 'video'
        ]
      })

      // Handle content changes
      quill.on('text-change', () => {
        const content = quill.root.innerHTML
        setFormData(prev => ({
          ...prev,
          content: content
        }))
      })

      // Set initial content if in edit mode
      if (isEditMode && formData.content) {
        quill.root.innerHTML = formData.content
      }

      setQuillInstance(quill)
      setIsQuillLoaded(true)
      setQuillInitialized(true)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Auto-generate slug from title (only if not in edit mode or slug is empty)
    if (name === "title" && (!isEditMode || !formData.slug)) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      setFormData((prev) => ({
        ...prev,
        slug: slug,
      }))
    }
  }

  // Tags functionality
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value)
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      const newTags = [...formData.tags]
      newTags.pop()
      setFormData(prev => ({ ...prev, tags: newTags }))
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }

      setFormData((prev) => ({
        ...prev,
        featuredImage: file,
      }))

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: null,
    }))
    setImagePreview(null)
  }

  const validateRequiredFields = () => {
    if (!formData.title.trim()) {
      return "Title is required"
    }
    if (!formData.slug.trim()) {
      return "Slug is required"
    }
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      return "Content is required"
    }
    if (!formData.category) {
      return "Category is required"
    }
    return null
  }

  const handleSubmit = async (status) => {
    const validationError = validateRequiredFields()
    if (validationError) {
      return // Error will be shown by toast in context
    }

    setIsSubmitting(true)

    try {
      const submitData = { ...formData, status }
      let result

      if (isEditMode && currentBlogId) {
        // Update existing blog
        result = await updateBlog(currentBlogId, submitData)
      } else {
        // Create new blog
        result = await createBlog(submitData)
      }

      if (result) {
        // Success handled by context (shows toast and navigates back)
        console.log(`Blog ${isEditMode ? 'updated' : 'created'} successfully:`, result)
      }

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} blog post:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAsDraft = (e) => {
    e.preventDefault()
    handleSubmit("draft")
  }

  const handlePublish = (e) => {
    e.preventDefault()
    handleSubmit("published")
  }

  // Show loading state while fetching data in edit mode
  if (isEditMode && !isDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading blog data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Update your existing blog post'
              : 'Write and publish a new blog post for PDFDex'
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          {formData.status === "published" ? (
            <button
              onClick={handlePublish}
              disabled={isSubmitting || contextLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center disabled:opacity-50"
            >
              {isSubmitting || contextLoading ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" size={14} />
                  {isEditMode ? 'Update' : 'Publish'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSaveAsDraft}
              disabled={isSubmitting || contextLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center disabled:opacity-50"
            >
              {isSubmitting || contextLoading ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" size={14} />
                  {isEditMode ? 'Update Draft' : 'Save Draft'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your blog post title..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /blogs/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-r-md focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaTags className="mr-2 text-blue-600" />
              Tags
            </h3>
            <div className="border border-gray-300 rounded-md p-2 focus-within:border-blue-500 min-h-[42px] flex flex-wrap items-center gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder={formData.tags.length === 0 ? "Type and press Enter to add tags" : ""}
                className="flex-1 min-w-[120px] outline-none bg-transparent"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Type and press Enter to add tags. Press Backspace to remove the last tag.</p>
          </div>

          {/* Content with Quill Rich Text Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">Content *</label>

            {/* Loading state */}
            {!isQuillLoaded && (
              <div className="border border-gray-300 rounded-md p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading editor...</p>
              </div>
            )}

            {/* Quill Editor */}
            <div className={!isQuillLoaded ? 'hidden' : ''}>
              <div ref={quillRef} />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              placeholder="Brief description of your post (optional)..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
            />
            <p className="mt-2 text-sm text-gray-500">This will be shown in post previews and search results.</p>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaFileAlt className="mr-2 text-blue-600" />
              Publish Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Featured Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaImage className="mr-2 text-blue-600" />
              Featured Image
            </h3>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Featured image preview"
                    className="w-full h-48 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
                  <FaUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload featured image</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input
                type="file"
                id="featuredImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="featuredImage"
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <FaUpload className="mr-2" size={14} />
                {imagePreview ? "Change Image" : "Upload Image"}
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaFolder className="mr-2 text-blue-600" />
              Category
            </h3>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="SEO title for search engines"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="SEO description for search engines"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {(isSubmitting || contextLoading) && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg border px-4 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">
              {isEditMode ? 'Updating blog post...' : 'Saving blog post...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// "use client"
// import { useState, useRef, useEffect, useCallback, useContext } from "react"
// import { FaSave, FaTags, FaFolder, FaImage, FaFileAlt, FaUpload, FaTimes } from "react-icons/fa"
// import { BlogsContext } from "@/context/Blog.context"
// import { useParams, useRouter } from "next/navigation"

// export default function CreateBlogPage({ isEditMode = false, blogId = null }) {
//   const router = useRouter()
//   const params = useParams()
//   const {
//     createBlog,
//     updateBlog,
//     fetchSingleBlog,
//     singleBlog,
//     isLoading: contextLoading
//   } = useContext(BlogsContext)

//   // Get blog ID from params if in edit mode
//   const currentBlogId = blogId || params?.id || params?.token

//   const [formData, setFormData] = useState({
//     title: "",
//     slug: "",
//     content: "",
//     excerpt: "",
//     category: "",
//     tags: [],
//     status: "draft",
//     featuredImage: null,
//     metaTitle: "",
//     metaDescription: "",
//   })

//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [imagePreview, setImagePreview] = useState(null)
//   const [tagInput, setTagInput] = useState("")
//   const [isQuillLoaded, setIsQuillLoaded] = useState(false)
//   const [isDataLoaded, setIsDataLoaded] = useState(false)

//   const quillRef = useRef(null)
//   const [quillInstance, setQuillInstance] = useState(null)

//   // Available categories
//   const categories = [
//     "Tips & Tricks",
//     "Tutorials",
//     "Security",
//     "Best Practices",
//     "Technical",
//     "Reviews",
//     "Help",
//     "News",
//   ]

//   // Fetch blog data for edit mode
//   useEffect(() => {
//     if (isEditMode && currentBlogId && !isDataLoaded) {
//       fetchBlogData()
//     } else if (!isEditMode) {
//       setIsDataLoaded(true)
//     }
//   }, [isEditMode, currentBlogId])

//   const fetchBlogData = async () => {
//     try {
//       const blogData = await fetchSingleBlog(currentBlogId)
//       if (blogData) {
//         setFormData({
//           title: blogData.title || "",
//           slug: blogData.slug || "",
//           content: blogData.content || "",
//           excerpt: blogData.excerpt || "",
//           category: blogData.category || "",
//           tags: blogData.tags || [],
//           status: blogData.status || "draft",
//           featuredImage: null, // Don't set existing file, just show preview
//           metaTitle: blogData.metaTitle || "",
//           metaDescription: blogData.metaDescription || "",
//         })

//         // Set image preview if exists
//         if (blogData.featuredImage) {
//           setImagePreview(blogData.featuredImage)
//         }

//         setIsDataLoaded(true)
//       }
//     } catch (error) {
//       console.error("Error fetching blog data:", error)
//       setIsDataLoaded(true)
//     }
//   }

//   // Initialize Quill and populate content when data is loaded
//   useEffect(() => {
//     if (!isQuillLoaded && quillRef.current) {
//       // Load Quill dynamically
//       const script = document.createElement('script');
//       script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js';
//       script.onload = () => {
//         const link = document.createElement('link');
//         link.rel = 'stylesheet';
//         link.href = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css';
//         document.head.appendChild(link);

//         setTimeout(() => {
//           if (window.Quill && quillRef.current && !quillInstance) {
//             const quill = new window.Quill(quillRef.current, {
//               theme: 'snow',
//               placeholder: 'Write your blog content here...',
//               modules: {
//                 toolbar: [
//                   [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
//                   [{ 'size': ['small', false, 'large', 'huge'] }],
//                   ['bold', 'italic', 'underline', 'strike'],
//                   [{ 'color': [] }, { 'background': [] }],
//                   [{ 'font': [] }],
//                   [{ 'align': [] }],
//                   ['blockquote', 'code-block'],
//                   [{ 'list': 'ordered' }, { 'list': 'bullet' }],
//                   [{ 'script': 'sub' }, { 'script': 'super' }],
//                   [{ 'indent': '-1' }, { 'indent': '+1' }],
//                   ['link', 'image', 'video'],
//                   ['clean']
//                 ]
//               },
//               formats: [
//                 'header', 'font', 'size',
//                 'bold', 'italic', 'underline', 'strike',
//                 'color', 'background',
//                 'script', 'super', 'sub',
//                 'blockquote', 'code-block',
//                 'list', 'bullet', 'indent',
//                 'align', 'direction',
//                 'link', 'image', 'video'
//               ]
//             });

//             // Handle content changes
//             quill.on('text-change', () => {
//               const content = quill.root.innerHTML;
//               setFormData(prev => ({
//                 ...prev,
//                 content: content
//               }));
//             });

//             setQuillInstance(quill);
//             setIsQuillLoaded(true);
//           }
//         }, 100);
//       };

//       script.onerror = () => {
//         console.error('Failed to load Quill.js');
//       };

//       document.head.appendChild(script);
//     }
//   }, [quillInstance, isQuillLoaded]);

//   // Populate Quill content when data is loaded and Quill is ready
//   useEffect(() => {
//     if (quillInstance && isDataLoaded && formData.content && isEditMode) {
//       quillInstance.root.innerHTML = formData.content;
//     }
//   }, [quillInstance, isDataLoaded, formData.content, isEditMode]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))

//     // Auto-generate slug from title (only if not in edit mode or slug is empty)
//     if (name === "title" && (!isEditMode || !formData.slug)) {
//       const slug = value
//         .toLowerCase()
//         .replace(/[^a-z0-9\s-]/g, "")
//         .replace(/\s+/g, "-")
//         .replace(/-+/g, "-")
//         .trim()
//       setFormData((prev) => ({
//         ...prev,
//         slug: slug,
//       }))
//     }
//   }

//   // Tags functionality
//   const handleTagInputChange = (e) => {
//     setTagInput(e.target.value)
//   }

//   const handleTagInputKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault()
//       addTag()
//     } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
//       const newTags = [...formData.tags]
//       newTags.pop()
//       setFormData(prev => ({ ...prev, tags: newTags }))
//     }
//   }

//   const addTag = () => {
//     const trimmedTag = tagInput.trim()
//     if (trimmedTag && !formData.tags.includes(trimmedTag)) {
//       setFormData(prev => ({
//         ...prev,
//         tags: [...prev.tags, trimmedTag]
//       }))
//       setTagInput('')
//     }
//   }

//   const removeTag = (tagToRemove) => {
//     setFormData(prev => ({
//       ...prev,
//       tags: prev.tags.filter(tag => tag !== tagToRemove)
//     }))
//   }

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0]
//     if (file) {
//       if (!file.type.startsWith("image/")) {
//         alert("Please select an image file")
//         return
//       }

//       if (file.size > 5 * 1024 * 1024) {
//         alert("Image size should be less than 5MB")
//         return
//       }

//       setFormData((prev) => ({
//         ...prev,
//         featuredImage: file,
//       }))

//       const reader = new FileReader()
//       reader.onload = (e) => {
//         setImagePreview(e.target.result)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const removeImage = () => {
//     setFormData((prev) => ({
//       ...prev,
//       featuredImage: null,
//     }))
//     setImagePreview(null)
//   }

//   const validateRequiredFields = () => {
//     if (!formData.title.trim()) {
//       return "Title is required"
//     }
//     if (!formData.slug.trim()) {
//       return "Slug is required"
//     }
//     if (!formData.content.trim() || formData.content === '<p><br></p>') {
//       return "Content is required"
//     }
//     if (!formData.category) {
//       return "Category is required"
//     }
//     return null
//   }

//   const handleSubmit = async (status) => {
//     const validationError = validateRequiredFields()
//     if (validationError) {
//       return // Error will be shown by toast in context
//     }

//     setIsSubmitting(true)

//     try {
//       const submitData = { ...formData, status }
//       let result

//       if (isEditMode && currentBlogId) {
//         // Update existing blog
//         result = await updateBlog(currentBlogId, submitData)
//       } else {
//         // Create new blog
//         result = await createBlog(submitData)
//       }

//       if (result) {
//         // Success handled by context (shows toast and navigates back)
//         console.log(`Blog ${isEditMode ? 'updated' : 'created'} successfully:`, result)
//       }

//     } catch (error) {
//       console.error(`Error ${isEditMode ? 'updating' : 'creating'} blog post:`, error)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleSaveAsDraft = (e) => {
//     e.preventDefault()
//     handleSubmit("draft")
//   }

//   const handlePublish = (e) => {
//     e.preventDefault()
//     handleSubmit("published")
//   }

//   // Show loading state while fetching data in edit mode
//   if (isEditMode && !isDataLoaded) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-500">Loading blog data...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
//           </h1>
//           <p className="mt-1 text-sm text-gray-500">
//             {isEditMode
//               ? 'Update your existing blog post'
//               : 'Write and publish a new blog post for PDFDex'
//             }
//           </p>
//         </div>
//         <div className="mt-4 md:mt-0">
//           {formData.status === "published" ? (
//             <button
//               onClick={handlePublish}
//               disabled={isSubmitting || contextLoading}
//               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center disabled:opacity-50"
//             >
//               {isSubmitting || contextLoading ? (
//                 <>
//                   <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
//                   {isEditMode ? 'Updating...' : 'Publishing...'}
//                 </>
//               ) : (
//                 <>
//                   <FaSave className="mr-2" size={14} />
//                   {isEditMode ? 'Update' : 'Publish'}
//                 </>
//               )}
//             </button>
//           ) : (
//             <button
//               onClick={handleSaveAsDraft}
//               disabled={isSubmitting || contextLoading}
//               className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center disabled:opacity-50"
//             >
//               {isSubmitting || contextLoading ? (
//                 <>
//                   <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
//                   {isEditMode ? 'Updating...' : 'Saving...'}
//                 </>
//               ) : (
//                 <>
//                   <FaSave className="mr-2" size={14} />
//                   {isEditMode ? 'Update Draft' : 'Save Draft'}
//                 </>
//               )}
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Main Content - 2/3 width */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Title & Slug */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="space-y-4">
//               <div>
//                 <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
//                   Post Title *
//                 </label>
//                 <input
//                   type="text"
//                   id="title"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   placeholder="Enter your blog post title..."
//                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//                   required
//                 />
//               </div>

//               <div>
//                 <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
//                   URL Slug
//                 </label>
//                 <div className="flex">
//                   <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
//                     /blogs/
//                   </span>
//                   <input
//                     type="text"
//                     id="slug"
//                     name="slug"
//                     value={formData.slug}
//                     onChange={handleInputChange}
//                     className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-r-md focus:outline-none focus:border-blue-500 text-gray-900"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Tags */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//               <FaTags className="mr-2 text-blue-600" />
//               Tags
//             </h3>
//             <div className="border border-gray-300 rounded-md p-2 focus-within:border-blue-500 min-h-[42px] flex flex-wrap items-center gap-2">
//               {formData.tags.map((tag, index) => (
//                 <span
//                   key={index}
//                   className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800 border border-blue-200"
//                 >
//                   {tag}
//                   <button
//                     type="button"
//                     onClick={() => removeTag(tag)}
//                     className="ml-1 text-blue-600 hover:text-blue-800"
//                   >
//                     <FaTimes size={10} />
//                   </button>
//                 </span>
//               ))}
//               <input
//                 type="text"
//                 value={tagInput}
//                 onChange={handleTagInputChange}
//                 onKeyDown={handleTagInputKeyDown}
//                 placeholder={formData.tags.length === 0 ? "Type and press Enter to add tags" : ""}
//                 className="flex-1 min-w-[120px] outline-none bg-transparent"
//               />
//             </div>
//             <p className="mt-2 text-sm text-gray-500">Type and press Enter to add tags. Press Backspace to remove the last tag.</p>
//           </div>

//           {/* Content with Quill Rich Text Editor */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <label className="block text-sm font-medium text-gray-700 mb-4">Content *</label>

//             {/* Loading state */}
//             {!isQuillLoaded && (
//               <div className="border border-gray-300 rounded-md p-8 text-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                 <p className="text-gray-500">Loading editor...</p>
//               </div>
//             )}

//             {/* Quill Editor */}
//             <div className={!isQuillLoaded ? 'hidden' : ''}>
//               <div ref={quillRef} />
//             </div>
//           </div>

//           {/* Excerpt */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
//               Excerpt
//             </label>
//             <textarea
//               id="excerpt"
//               name="excerpt"
//               value={formData.excerpt}
//               onChange={handleInputChange}
//               rows={3}
//               placeholder="Brief description of your post (optional)..."
//               className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//             />
//             <p className="mt-2 text-sm text-gray-500">This will be shown in post previews and search results.</p>
//           </div>
//         </div>

//         {/* Sidebar - 1/3 width */}
//         <div className="space-y-6">
//           {/* Publish Settings */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//               <FaFileAlt className="mr-2 text-blue-600" />
//               Publish Settings
//             </h3>
//             <div className="space-y-4">
//               <div>
//                 <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
//                   Status
//                 </label>
//                 <select
//                   id="status"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//                 >
//                   <option value="draft">Draft</option>
//                   <option value="published">Published</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Featured Image Upload */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//               <FaImage className="mr-2 text-blue-600" />
//               Featured Image
//             </h3>
//             <div className="space-y-4">
//               {imagePreview ? (
//                 <div className="relative">
//                   <img
//                     src={imagePreview}
//                     alt="Featured image preview"
//                     className="w-full h-48 object-cover rounded-md border border-gray-300"
//                   />
//                   <button
//                     type="button"
//                     onClick={removeImage}
//                     className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
//                   >
//                     <FaTimes size={12} />
//                   </button>
//                 </div>
//               ) : (
//                 <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
//                   <FaUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//                   <p className="text-sm text-gray-600 mb-2">Upload featured image</p>
//                   <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
//                 </div>
//               )}
//               <input
//                 type="file"
//                 id="featuredImage"
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//               />
//               <label
//                 htmlFor="featuredImage"
//                 className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
//               >
//                 <FaUpload className="mr-2" size={14} />
//                 {imagePreview ? "Change Image" : "Upload Image"}
//               </label>
//             </div>
//           </div>

//           {/* Category */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//               <FaFolder className="mr-2 text-blue-600" />
//               Category
//             </h3>
//             <select
//               id="category"
//               name="category"
//               value={formData.category}
//               onChange={handleInputChange}
//               className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//               required
//             >
//               <option value="">Select a category</option>
//               {categories.map((category) => (
//                 <option key={category} value={category}>
//                   {category}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* SEO Settings */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
//             <div className="space-y-4">
//               <div>
//                 <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
//                   Meta Title
//                 </label>
//                 <input
//                   type="text"
//                   id="metaTitle"
//                   name="metaTitle"
//                   value={formData.metaTitle}
//                   onChange={handleInputChange}
//                   placeholder="SEO title for search engines"
//                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
//                   Meta Description
//                 </label>
//                 <textarea
//                   id="metaDescription"
//                   name="metaDescription"
//                   value={formData.metaDescription}
//                   onChange={handleInputChange}
//                   rows={8}
//                   placeholder="SEO description for search engines"
//                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Status indicator */}
//       {(isSubmitting || contextLoading) && (
//         <div className="fixed bottom-4 right-4">
//           <div className="bg-white rounded-lg shadow-lg border px-4 py-2 flex items-center space-x-2">
//             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
//             <span className="text-sm text-gray-600">
//               {isEditMode ? 'Updating blog post...' : 'Saving blog post...'}
//             </span>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }