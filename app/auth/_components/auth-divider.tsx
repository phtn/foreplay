export function AuthDivider() {
  return (
    <div className='relative mb-3 xl:mb-6'>
      <div className='absolute inset-0 flex items-center'>
        <div className='w-full border-t-[0.33px] border-primary dark:border-white/25' />
      </div>
      <div className='relative flex justify-center text-xs uppercase'>
        <span className='bg-primary/70 dark:bg-foreground/10 backdrop-blur-xl rounded-md px-2'>
          <span className=' text-xs text-white dark:text-foreground'>or</span>
        </span>
      </div>
    </div>
  )
}
