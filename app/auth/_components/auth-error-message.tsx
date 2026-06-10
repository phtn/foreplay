type AuthErrorMessageProps = {
  message: string | null
}

export function AuthErrorMessage({ message }: AuthErrorMessageProps) {
  return message ? (
    <div role='alert' className='mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
      {message}
    </div>
  ) : null
}
