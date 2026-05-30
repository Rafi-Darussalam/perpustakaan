import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { api } from '@/lib/axios'

const chartConfig = {
  peminjaman: {
    label: 'Peminjaman Saya',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

export default function HomeUserChart() {
  const [timeRange, setTimeRange] = React.useState('30d')
  const [data, setData] = React.useState<{ date: string; peminjaman: number }[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const days = timeRange === '30d' ? 30 : timeRange === '14d' ? 14 : 7
        const response = await api.get('/peminjaman/my-chart', { params: { days } })
        setData(response.data.data)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Riwayat Peminjaman Saya</CardTitle>
          <CardDescription>Jumlah buku yang kamu pinjam dalam periode ini</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Pilih rentang waktu"
          >
            <SelectValue placeholder="Pilih rentang waktu" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg">1 Bulan</SelectItem>
            <SelectItem value="14d" className="rounded-lg">2 Minggu</SelectItem>
            <SelectItem value="7d" className="rounded-lg">1 Minggu</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex aspect-auto h-[250px] w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <defs>
                <linearGradient id="fillUserPeminjaman" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-peminjaman)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-peminjaman)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }
                    formatter={(value, name) => [
                      <span key={name} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold">{String(value)}</span>
                        <span className="text-muted-foreground">peminjaman</span>
                      </span>,
                      null
                    ]}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="peminjaman"
                type="monotone"
                fill="url(#fillUserPeminjaman)"
                stroke="var(--color-peminjaman)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
