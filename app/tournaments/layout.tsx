import { PropsWithChildren } from 'react'

export default function TourLayout({ children }: PropsWithChildren) {
  return (
    <div>
      {children}
      <div className='h-24 w-full flex items-center justify-center text-xs tracking-wider text-foreground/50'>
        <span className='font-mono'>&copy;{new Date().getFullYear()}</span>{' '}
        <span className='font-ios tracking-wider px-2'>foreplay.pro</span>
      </div>
    </div>
  )
}
