export default function UserLoading() {
  return (
    <main className='mx-auto w-full max-w-7xl animate-pulse space-y-5 px-3 pb-10 pt-2 sm:px-4 md:px-0 md:pt-0'>
      <div className='h-8 w-32 rounded-full bg-muted' />
      <div className='h-64 rounded-3xl bg-muted/70' />
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className='h-28 rounded-2xl bg-muted/70' />
        ))}
      </div>
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.75fr)]'>
        <div className='h-[32rem] rounded-2xl bg-muted/70' />
        <div className='h-[32rem] rounded-2xl bg-muted/70' />
      </div>
    </main>
  )
}
