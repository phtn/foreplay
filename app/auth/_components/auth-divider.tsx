export function AuthDivider() {
  return (
    <div className='relative mb-3 xl:mb-6'>
      <div className='absolute inset-0 flex items-center'>
        <div className='w-full border-t-[0.33px] border-border' />
      </div>
      <div className='relative flex justify-center text-xs uppercase'>
        <span className='bg-card px-3 text-xs text-muted-foreground'>or</span>
      </div>
    </div>
  )
}
