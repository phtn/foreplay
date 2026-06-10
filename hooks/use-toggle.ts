import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'

interface UseToggleReturn {
  on: boolean
  toggle: VoidFunction
  setOn: Dispatch<SetStateAction<boolean>>
}
export const useToggle = (initialState?: boolean): UseToggleReturn => {
  const [on, setOn] = useState<boolean>(() => initialState ?? false)

  const toggle = useCallback((): void => {
    setOn((prevState: boolean): boolean => !prevState)
  }, [])

  return { on, toggle, setOn }
}
