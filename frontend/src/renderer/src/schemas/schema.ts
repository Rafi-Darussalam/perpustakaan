import { z } from 'zod'

export const bukuSchema = z.object({
  judul: z
    .string()
    .min(2, {
      message: 'Judul minimal 2 karakter'
    })
    .max(100, {
      message: 'Judul maksimal 100 karakter'
    }),

  penulis: z.string().min(2, {
    message: 'Nama penulis minimal 2 karakter'
  }),

  kategori: z.string().min(2, {
    message: 'Kategori minimal 2 karakter'
  })
})

export type BukuSchema = z.infer<typeof bukuSchema>

export const anggotaSchema = z.object({
  nama: z
    .string()
    .min(2, {
      message: 'Nama minimal 2 karakter'
    })
    .max(100, {
      message: 'Nama maksimal 100 karakter'
    }),

  nomor_telepon: z.string().min(10, {
    message: 'Nomor telepon minimal 10 karakter'
  }),

  email: z.string().email({
    message: 'Format email tidak valid'
  }),

  alamat: z.string().optional()
})


export type AnggotaSchema = z.infer<typeof anggotaSchema>

export const peminjamanSchema = z.object({
  anggotaId: z.number({ message: 'Peminjam wajib dipilih' }).positive({
    message: 'Peminjam wajib dipilih'
  }),
  bukuId: z.number({ message: 'Buku wajib dipilih' }).positive({
    message: 'Buku wajib dipilih'
  }),
  tanggal_pinjam: z.date({ message: 'Tanggal peminjaman wajib diisi' }),
  tanggal_jatuh_tempo: z.date({ message: 'Tanggal pengembalian wajib diisi' })
}).refine((data) => data.tanggal_jatuh_tempo > data.tanggal_pinjam, {
  message: 'Tanggal pengembalian harus setelah tanggal peminjaman',
  path: ['tanggal_jatuh_tempo']
})

export type PeminjamanSchema = z.infer<typeof peminjamanSchema>
