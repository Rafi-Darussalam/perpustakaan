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

    rating: z.number().min(1, {
        message: "Rating minimal 1"
    }).max(5, {
        message: "Rating maksimal 5"
    })
})

export type BukuSchema = z.infer<typeof bukuSchema> 