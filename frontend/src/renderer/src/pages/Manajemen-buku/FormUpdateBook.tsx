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

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukuSchema, type BukuSchema } from '@/schemas/schema'
import { useState, useEffect } from 'react'

import axios from 'axios'
import { BUKU_API_URL } from '@/constants/constant'

type UpdateBookProps = {
  open: boolean
  setOpen: (open: boolean) => void
  bookData: any
  onSuccess: () => void
}

export default function UpdateBook({ open, setOpen, bookData, onSuccess }: UpdateBookProps) {
  const [errorMessage, setErrorMessage] = useState('')

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

  useEffect(() => {
    if (bookData) {
      reset({
        judul: bookData.judul,
        penulis: bookData.penulis,
        kategori: bookData.kategori
      })
    }
  }, [bookData, reset])

  async function onSubmit(data: BukuSchema) {
    try {
      setErrorMessage('')
      
      const response = await axios.put(`${BUKU_API_URL}/${bookData.id}`, data, {
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

      if (axios.isAxiosError(error)) {
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
