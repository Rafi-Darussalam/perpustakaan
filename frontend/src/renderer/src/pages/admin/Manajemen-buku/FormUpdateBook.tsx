import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { toast } from 'sonner'

import { ImagePlus, X } from 'lucide-react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukuSchema, type BukuSchema } from '@/schemas/schema'
import { useState, useEffect } from 'react'

import { api } from '@/lib/axios'
import { getImageUrl } from '@/lib/utils'
import { isAxiosError } from 'axios'

type UpdateBookProps = {
  open: boolean
  setOpen: (open: boolean) => void
  bookData: {
    id: number
    judul: string
    penulis: string
    kategori: string
    gambar?: string | null
  } | null
  onSuccess: () => void
}

export default function UpdateBook({ open, setOpen, bookData, onSuccess }: UpdateBookProps) {
  const [errorMessage, setErrorMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<BukuSchema>({
    resolver: zodResolver(bukuSchema),
    defaultValues: {
      judul: '',
      penulis: '',
      kategori: '',
      gambar: ''
    }
  })

  useEffect(() => {
    if (bookData) {
      reset({
        judul: bookData.judul,
        penulis: bookData.penulis,
        kategori: bookData.kategori,
        gambar: bookData.gambar || ''
      })
      setImagePreview(bookData.gambar || null)
    }
  }, [bookData, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 8MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setValue('gambar', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('gambar', '')
  }

  async function onSubmit(data: BukuSchema) {
    if (!bookData) return

    try {
      setErrorMessage('')

      const payload: any = { ...data }

      // Jika gambar tidak diubah (masih berupa path lama, bukan base64 baru),
      // jangan kirim field gambar agar backend tidak memproses ulang.
      // Jika gambar dihapus (string kosong), kirim null agar backend menghapus gambar lama.
      if (payload.gambar) {
        if (!payload.gambar.startsWith('data:image')) {
          delete payload.gambar
        }
      } else {
        payload.gambar = null
      }

      const response = await api.put(`/buku/${bookData.id}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Update Response:', response.data)

      toast.success('Berhasil memperbarui buku')
      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error('Update Error:', error)

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Terjadi kesalahan saat memperbarui data'
        setErrorMessage(message)
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak diketahui')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[1.3rem]">Edit Buku</DialogTitle>
          <DialogDescription>
            Ubah data buku di bawah ini untuk memperbarui koleksi perpustakaan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <Field aria-invalid={!!errors.judul}>
            <FieldLabel htmlFor="judul">Judul Buku</FieldLabel>
            <Input
              id="judul"
              placeholder="Contoh: The Shining"
              aria-invalid={!!errors.judul}
              {...register('judul')}
            />
            <FieldError errors={errors.judul ? [{ message: errors.judul.message }] : []} />
          </Field>

          <Field aria-invalid={!!errors.penulis}>
            <FieldLabel htmlFor="penulis">Penulis</FieldLabel>
            <Input
              id="penulis"
              placeholder="Contoh: Stephen King"
              aria-invalid={!!errors.penulis}
              {...register('penulis')}
            />
            <FieldError errors={errors.penulis ? [{ message: errors.penulis.message }] : []} />
          </Field>

          <Field aria-invalid={!!errors.kategori}>
            <FieldLabel htmlFor="kategori">Kategori</FieldLabel>
            <Input
              id="kategori"
              placeholder="Contoh: Horor"
              aria-invalid={!!errors.kategori}
              {...register('kategori')}
            />
            <FieldError errors={errors.kategori ? [{ message: errors.kategori.message }] : []} />
          </Field>

          <Field aria-invalid={!!errors.gambar}>
            <FieldLabel htmlFor="gambar-edit">Cover Buku</FieldLabel>
            <input
              type="file"
              id="gambar-upload-edit"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="flex gap-3 mt-1 p-3 border rounded-lg bg-muted/40">
                <div className="relative group flex-shrink-0 w-16 rounded-md overflow-hidden border shadow-sm" style={{ height: '88px' }}>
                  <img src={getImageUrl(imagePreview) || ''} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer rounded-md"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Cover terpilih</p>
                  <p className="text-xs text-muted-foreground">Klik ikon × pada gambar untuk menghapus</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('gambar-upload-edit')?.click()}
                    className="w-full cursor-pointer"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Ganti Gambar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById('gambar-upload-edit')?.click()}
                className={`w-full mt-1 border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-muted/60 ${
                  errors.gambar
                    ? 'border-destructive text-destructive hover:border-destructive'
                    : 'border-border text-muted-foreground hover:border-border'
                }`}
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm font-medium">Klik untuk unggah cover buku</span>
                <span className="text-xs">PNG, JPG maksimal 8MB</span>
              </button>
            )}
            <FieldError errors={errors.gambar ? [{ message: errors.gambar.message }] : []} />
          </Field>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
