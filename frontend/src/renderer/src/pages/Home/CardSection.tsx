import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@renderer/components/ui/card'

export default function HomeCardSection() {
  const cardInfo = [
    { title: 'Total Buku', description: 'Total seluruh buku', value: 100 },
    { title: 'Total Buku', description: 'Total seluruh buku', value: 100 },
    { title: 'Total Buku', description: 'Total seluruh buku', value: 100 },
    { title: 'Total Buku', description: 'Total seluruh buku', value: 100 }
  ]

  return (
    <div className='flex gap-4 flex-wrap'>
      {cardInfo.map(({ title, description, value }, i) => (
        <Card className="flex-1 min-w-[200px] bg-linear-to-b from-background to-sidebar" key={i}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-[2.5rem] font-bold'>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
