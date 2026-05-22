'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Trash2, Upload, ZoomIn } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PhotoData {
  fileUrl: string
  fileName: string
  fileType: string
  previewUrl?: string
}

interface PhotoUploadProps {
  photos: PhotoData[]
  onPhotosChange: (photos: PhotoData[]) => void
  maxPhotos?: number
  label?: string
  required?: boolean
  className?: string
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  label = 'Adicionar foto',
  required = false,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file

    const imageUrl = URL.createObjectURL(file)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageUrl
      })

      const maxDimension = 1600
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
      const width = Math.round(image.width * scale)
      const height = Math.round(image.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)

      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.82)
      })

      if (!blob) return file
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = maxPhotos - photos.length
    const filesToUpload = files.slice(0, remaining)

    setUploading(true)
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const uploadFile = await compressImage(file)
        const formData = new FormData()
        formData.append('file', uploadFile)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload falhou')

        const data = await response.json()

        const previewUrl = URL.createObjectURL(uploadFile)

        return {
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          previewUrl,
        }
      })

      const newPhotos = await Promise.all(uploadPromises)
      onPhotosChange([...photos, ...newPhotos])
      toast.success(`${newPhotos.length} foto(s) adicionada(s)`)
    } catch {
      toast.error('Erro ao fazer upload. Verifique o arquivo e tente novamente.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.previewUrl || photo.fileUrl}
                alt={photo.fileName}
                className="w-20 h-20 object-cover rounded-lg border border-brand-green/12 shadow-[0_12px_30px_-24px_rgba(22,65,58,0.7)] cursor-pointer hover:opacity-90 transition"
                onClick={() => setPreviewPhoto(photo.previewUrl || photo.fileUrl)}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewPhoto(photo.previewUrl || photo.fileUrl)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 rounded-lg transition"
              >
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'gap-2',
              required && photos.length === 0 && 'border-red-300 text-red-600 hover:bg-red-50'
            )}
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 animate-pulse" />
                Enviando...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {label}
                {required && photos.length === 0 && <span className="text-red-500 ml-1">*</span>}
              </>
            )}
          </Button>
        </>
      )}

      {required && photos.length === 0 && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> Foto obrigatória
        </p>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl p-0">
          {previewPhoto && (
            <img
              src={previewPhoto}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
