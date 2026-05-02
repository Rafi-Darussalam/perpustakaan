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
import { anggotaSchema, type AnggotaSchema } from '@/schemas/schema'
import { useState, useEffect } from 'react'

import axios from 'axios'
import { ANGGOTA_API_URL } from '@/constants/constant'

type FormUpdateAnggotaProps = {
  open: boolean
  setOpen: (open: boolean) => void
  anggotaData: any
  onSuccess: () => void
}

export default function FormUpdateAnggota({ open, setOpen, anggotaData, onSuccess }: FormUpdateAnggotaProps) {
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

  useEffect(() => {
    if (anggotaData) {
      reset({
        nama: anggotaData.nama,
        nomor_telepon: anggotaData.nomor_telepon,
        email: anggotaData.email,
        alamat: anggotaData.alamat || ''
      })
    }
  }, [anggotaData, reset])

  async function onSubmit(data: AnggotaSchema) {
    try {
      setErrorMessage('')
      
      await axios.put(`${ANGGOTA_API_URL}/${anggotaData.id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      toast.success('Berhasil memperbarui anggota')
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
        toast.error(message)
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak diketahui')
        toast.error('Terjadi kesalahan yang tidak diketahui')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[1.3rem]">Edit Anggota</DialogTitle>
          <DialogDescription>
            Ubah data anggota di bawah ini untuk memperbarui informasi anggota perpustakaan.
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
              placeholder="Jl. Ahamd No. 123"
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
              {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
