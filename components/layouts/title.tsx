interface SectionTitleProps {
  title: string
  eyebrow?: string
}

export const SectionTitle = ({ title, eyebrow }: SectionTitleProps) => {
  return (
    <div className='flex gap-4 items-start justify-between'>
      <div>
        <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>{eyebrow}</p>
        <h2 className='font-okx font-semibold tracking-wide text-xl'>{title}</h2>
      </div>
    </div>
  )
}
