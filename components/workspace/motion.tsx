"use client"
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  useReducedMotion,
} from "motion/react"
import * as m from "motion/react-m"
import type { ReactNode } from "react"

export function AppMotion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.18, ease: "easeOut" }}
    >
      {children}
    </m.div>
  )
}
