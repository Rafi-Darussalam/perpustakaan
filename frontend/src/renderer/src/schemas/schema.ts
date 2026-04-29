import { z } from 'zod'

export const bukuSchema = z.object({
    judul: z.string().min(2, {
        message: "Judul minimal 2 karakter"
    }).max(100, {
        message: "Judul maksimal 100 karakter"
    }),

    penulis: z.string().min(2, {
        message: "Nama penulis minimal 2 karakter"
    }),

    kategori: z.string().min(2, {
        message: "Kategori minimal 2 karakter"
    })
})

export type BukuSchema = z.infer<typeof bukuSchema> 