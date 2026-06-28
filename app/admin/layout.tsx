import { AdminHeader } from './header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className='max-w-7xl mx-auto flex flex-col md:gap-8 lg:p-8'>
        <AdminHeader />

        {children}
      </div>
    </>
  )
}
