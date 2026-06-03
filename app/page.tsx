import ProtectedLayout from '@/ctx/protected'

export default function H() {
  return (
    <ProtectedLayout>
      <span>Signed in</span>
    </ProtectedLayout>
  )
}
