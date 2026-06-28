import { AdminHeader } from './header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className='mx-auto max-w-7xl w-full flex flex-col md:gap-4 lg:p-8'>
        <AdminHeader />
        {children}
      </div>
    </>
  )
}
