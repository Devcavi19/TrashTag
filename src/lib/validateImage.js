// Client-side guard for photo uploads: JPEG/PNG only, max 5 MB.
// Returns an error message string, or null when the file is acceptable.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export function validateImage(file) {
  if (!file) return 'No file selected.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG or PNG images are allowed.'
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)} MB).`
  }
  return null
}
