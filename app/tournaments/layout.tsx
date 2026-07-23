import { PropsWithChildren } from 'react'

export default function TourLayout({ children }: PropsWithChildren) {
  return (
    <div>
      {children}
      <div className='bg-[#1f2b27] dark:bg-background h-24 w-full flex items-center justify-center text-xs tracking-wider text-white/50'>
        <span className='font-ios'>&copy;{new Date().getFullYear()}</span>{' '}
        <span className='font-ios tracking-wider text-[11px] px-2'>foreplay.pro</span>
      </div>
    </div>
  )
}
