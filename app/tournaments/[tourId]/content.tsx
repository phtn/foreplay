import TourDetail from './details'

interface TourContentProps {
  tourId: string
}

export function TourContent({ tourId }: TourContentProps) {
  return (
    <main>
      <TourDetail tourId={tourId} />
    </main>
  )
}
