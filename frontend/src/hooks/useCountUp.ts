import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

export function useCountUp(target: number, duration = 1.5) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const rounded = useTransform(spring, v => Math.round(v))
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      motionValue.set(target)
    }
  }, [target, motionValue])

  return rounded
}
