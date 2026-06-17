import { AnimationName, PixelGrid } from 'three-px-react'

export const Loader = ({ isDark = false }: { isDark?: boolean }) => (
  <PixelGrid animation='snake' color={isDark ? '#f5f5f5' : '#aaa'} className='md:scale-96 scale-85' duration={1200} />
)

interface PxLoaderProps {
  isDark?: boolean
  animation?: AnimationName
}

export const PxLoader = ({ isDark = false, animation = 'snake' }: PxLoaderProps) => (
  <PixelGrid
    animation={animation}
    color={isDark ? '#f5f5f5' : '#CCC'}
    className='md:scale-96 scale-85'
    duration={1200}
  />
)
