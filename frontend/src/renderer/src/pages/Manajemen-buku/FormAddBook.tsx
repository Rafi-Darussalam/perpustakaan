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

import { Plus } from 'lucide-react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukuSchema, type BukuSchema } from '@/schemas/schema'
import { useState } from 'react'

import axios from 'axios'
import { BUKU_API_URL } from '@/constants/constant'

export default function AddBook({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BukuSchema>({
    resolver: zodResolver(bukuSchema),
    defaultValues: {
      judul: '',
      penulis: '',
      kategori: ''
    }
  })

  async function onSubmit(data: BukuSchema) {
    try {
      console.log('Hitting API:', BUKU_API_URL)
      console.log('Payload:', data)

      const response = await axios.post(BUKU_API_URL, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Response:', response.data)
      console.log('Data terkirim:', data)

      reset()
      toast.success('Berhasil menambah buku')
      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error('Error detail:', error)

      if (axios.isAxiosError(error)) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
