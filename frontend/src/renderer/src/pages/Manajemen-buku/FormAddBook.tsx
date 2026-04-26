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

import { Plus } from 'lucide-react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukuSchema, type BukuSchema } from '@/schemas/schema'
import { useState } from 'react'

export default function AddBook() {
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
      rating: 3
    }
  })

  function onSubmit(data: BukuSchema) {
    console.log(data)
    reset()
    setOpen(false)
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
              placeholder="Contoh: Laskar Pelangi"
              aria-invalid={!!errors.judul}
              {...register('judul')}
            />
            <FieldError errors={errors.judul ? [{ message: errors.judul.message }] : []} />
          </Field>

          <Field aria-invalid={!!errors.penulis}>
            <FieldLabel htmlFor="penulis">Penulis</FieldLabel>
            <Input
              id="penulis"
              placeholder="Contoh: Andrea Hirata"
              aria-invalid={!!errors.penulis}
              {...register('penulis')}
            />
            <FieldError errors={errors.penulis ? [{ message: errors.penulis.message }] : []} />
          </Field>

          <Field aria-invalid={!!errors.rating}>
            <FieldLabel htmlFor="rating">Rating (1-5)</FieldLabel>
            <Input
              id="rating"
              type="number"
              defaultValue={1}
              min={1}
              max={5}
              placeholder="3"
              aria-invalid={!!errors.rating}
              {...register('rating', { valueAsNumber: true })}
              className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
            <FieldError errors={errors.rating ? [{ message: errors.rating.message }] : []} />
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
