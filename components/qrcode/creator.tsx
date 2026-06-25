import QrCreator from 'qr-creator'
import { useEffect, useRef } from 'react'

interface CreateQRProps {
  config: QrCreator.Config
}

export const CreateQR = ({ config }: CreateQRProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    void QrCreator.render(config, containerRef.current as HTMLDivElement)
  }, [config])
  return <div className='size-54 p-2 overflow-hidden' ref={containerRef} />
}
