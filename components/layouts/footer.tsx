import Link from 'next/link'

export default function FooterContent() {
  return (
    <div className='h-28 mt-8 w-full flex items-center justify-between px-6 md:px-12 bg-slate-600/2'>
      <div className='flex items-center justify-center text-xs tracking-wider text-foreground/50'>
        <span className='font-mono'>&copy;{new Date().getFullYear()}</span>{' '}
        <span className='font-ios tracking-wider px-2'>foreplay.pro</span>
      </div>
      <div className='flex items-center space-x-2 whitespace-nowrap text-foreground/50'>
        <Link href='/privacy-policy' className='hover:underline underline-offset-4 decoration-dotted'>
          <span className='font-ios text-xs tracking-wider px-2'>privacy</span>
        </Link>
        <span>&middot;</span>
        <Link href='/term-of-use' className='hover:underline underline-offset-4 decoration-dotted'>
          <span className='font-ios text-xs tracking-wider px-2'>terms</span>
        </Link>
      </div>
    </div>
  )
}
