import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { toast } from 'sonner'

import { Plus, ImagePlus, X } from 'lucide-react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukuSchema, type BukuSchema } from '@/schemas/schema'
import { useState } from 'react'

import { api } from '@/lib/axios'
import { isAxiosError } from 'axios'

export default function AddBook({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
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
    try {
      console.log('Hitting API: /buku')
      console.log('Payload:', data)

      const response = await api.post('/buku', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Response:', response.data)
      console.log('Data terkirim:', data)

      reset()
      setImagePreview(null)
      toast.success('Berhasil menambah buku')
      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error('Error detail:', error)

      if (isAxiosError(error)) {
        if (error.response) {
          console.log('Error response:', error.response.data)
          console.log('Status code:', error.response.status)

          const message =
            error.response.data?.message ||
            error.response.data?.error ||
            `Gagal menambahkan buku (Status: ${error.response.status})`
          toast.error(message)
        } else if (error.request) {
          toast.error('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
        } else {
          toast.error(error.message || 'Terjadi kesalahan saat mengirim data')
        }
      } else {
        toast.error('Terjadi kesalahan yang tidak diketahui')
      }
    }
  }

  const handleClose = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      reset()
      setImagePreview(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Tambah Buku
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[1.3rem]">Tambah Buku</DialogTitle>
          <DialogDescription>
            Isi data buku di bawah ini untuk menambahkan koleksi baru ke perpustakaan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
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
            <FieldLabel htmlFor="gambar">Cover Buku</FieldLabel>
            <input
              type="file"
              id="gambar-upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="flex gap-3 mt-1 p-3 border rounded-lg bg-muted/40">
                <div className="relative group flex-shrink-0 w-16 h-22 rounded-md overflow-hidden border shadow-sm" style={{ height: '88px' }}>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
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
                    onClick={() => document.getElementById('gambar-upload')?.click()}
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
                onClick={() => document.getElementById('gambar-upload')?.click()}
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
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
