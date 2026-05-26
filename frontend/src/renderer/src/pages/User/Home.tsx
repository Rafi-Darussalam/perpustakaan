import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Search, Filter, BookOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type Buku = {
  id: number
  judul: string
  penulis: string
  kategori: string
  status: string
  rating_average: number
  rating_count: number
}

export default function UserCatalog() {
  return <div className="flex flex-col gap-6 p-4 max-w-[1200px] mx-auto min-h-screen"></div>
}
