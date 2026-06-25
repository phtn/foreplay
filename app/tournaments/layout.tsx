import { PropsWithChildren } from 'react'

export default function TourLayout({ children }: PropsWithChildren) {
  return (
    <div>
      {children}

      <div className='h-24 w-full flex items-center justify-center text-xs opacity-50 tracking-wider'>
        &copy; {new Date().getFullYear()} <span className='font-poly px-2'>Foreplay PRO</span>
      </div>
    </div>
  )
}
