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
import { anggotaSchema, type AnggotaSchema } from '@/schemas/schema'
import { useState } from 'react'

import axios from 'axios'
import { ANGGOTA_API_URL } from '@/constants/constant'

export default function FormAddAnggota({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AnggotaSchema>({
    resolver: zodResolver(anggotaSchema),
    defaultValues: {
      nama: '',
      nomor_telepon: '',
      email: '',
      alamat: ''
    }
  })

  async function onSubmit(data: AnggotaSchema) {
    try {
      setErrorMessage('')
      await axios.post(ANGGOTA_API_URL, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      reset()
      toast.success('Berhasil menambah anggota')
      onSuccess()
      setOpen(false)
    } catch (error) {
      console.error('Error detail:', error)

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const message =
            error.response.data?.message ||
            error.response.data?.error ||
            `Gagal menambahkan anggota (Status: ${error.response.status})`
          setErrorMessage(message)
          toast.error(message)
        } else if (error.request) {
          setErrorMessage('Tidak dapat terhubung ke server.')
          toast.error('Tidak dapat terhubung ke server.')
        } else {
          setErrorMessage(error.message)
          toast.error(error.message)
        }
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak diketahui')
        toast.error('Terjadi kesalahan yang tidak diketahui')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Tambah Anggota
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[1.3rem]">Tambah Anggota</DialogTitle>
          <DialogDescription>
            Isi data anggota tetap di bawah ini untuk didaftarkan ke perpustakaan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {errorMessage && <p className="text-destructive text-sm font-medium">{errorMessage}</p>}
          
          <Field aria-invalid={!!errors.nama}>
            <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
            <Input
              id="nama"
              placeholder="Contoh: Ahmad Dhani"
              aria-invalid={!!errors.nama}
              {...register('nama')}
            />
            <FieldError errors={errors.nama ? [{ message: errors.nama.message }] : []} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field aria-invalid={!!errors.nomor_telepon}>
              <FieldLabel htmlFor="nomor_telepon">Nomor Telepon</FieldLabel>
              <Input
                id="nomor_telepon"
                placeholder="08123456789"
                aria-invalid={!!errors.nomor_telepon}
                {...register('nomor_telepon')}
              />
              <FieldError errors={errors.nomor_telepon ? [{ message: errors.nomor_telepon.message }] : []} />
            </Field>

            <Field aria-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                placeholder="ad@gmail.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
            </Field>
          </div>

          <Field aria-invalid={!!errors.alamat}>
            <FieldLabel htmlFor="alamat">Alamat (Opsional)</FieldLabel>
            <Input
              id="alamat"
              placeholder="Jl. Ahmad No. 123"
              aria-invalid={!!errors.alamat}
              {...register('alamat')}
            />
            <FieldError errors={errors.alamat ? [{ message: errors.alamat.message }] : []} />
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
