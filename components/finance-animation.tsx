"use client"

import { useState } from "react"
import { RiPauseMiniLine, RiPlayMiniLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import styles from "./finance-animation.module.css"

export function FinanceAnimation() {
  const [paused, setPaused] = useState(false)
  return (
    <div className={`${styles.scene} hidden lg:block`} data-paused={paused}>
      <svg
        viewBox="0 0 440 270"
        className="w-full"
        role="img"
        aria-label="Ilustrasi animasi dompet dan koin"
      >
        <ellipse cx="222" cy="246" rx="140" ry="9" className={styles.shadow} />
        <g className={styles.receipt}>
          <rect
            x="155"
            y="49"
            width="128"
            height="155"
            rx="12"
            className={styles.paper}
          />
          <path
            d="M179 76h45m-45 18h80m-80 18h80m-80 18h51"
            className={styles.lines}
          />
          <circle cx="254" cy="75" r="5" className={styles.accent} />
        </g>
        <g className={styles.coinOne}>
          <circle cx="113" cy="75" r="23" className={styles.coin} />
          <circle cx="113" cy="75" r="15" className={styles.coinRing} />
          <path d="M113 67v16" className={styles.coinMark} />
        </g>
        <g className={styles.coinTwo}>
          <circle cx="318" cy="57" r="16" className={styles.coin} />
          <circle cx="318" cy="57" r="9" className={styles.coinRing} />
        </g>
        <path
          d="M111 140v-18c0-12 8-20 20-20h165c13 0 23 10 23 23v17"
          className={styles.back}
        />
        <rect
          x="105"
          y="123"
          width="219"
          height="112"
          rx="23"
          className={styles.wallet}
        />
        <path d="M127 145h170" className={styles.seam} />
        <rect
          x="273"
          y="159"
          width="62"
          height="43"
          rx="12"
          className={styles.accent}
        />
        <circle cx="294" cy="180" r="5" className={styles.clasp} />
        <g className={styles.coinThree}>
          <circle cx="352" cy="218" r="22" className={styles.coin} />
          <circle cx="352" cy="218" r="14" className={styles.coinRing} />
          <path d="M352 211v14" className={styles.coinMark} />
        </g>
      </svg>
      <Button
        variant="ghost"
        size="icon"
        className={`${styles.control} absolute right-0 bottom-0 size-11 rounded-full text-foreground/65`}
        aria-label={paused ? "Lanjutkan animasi" : "Jeda animasi"}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? (
          <RiPlayMiniLine size={20} aria-hidden="true" />
        ) : (
          <RiPauseMiniLine size={20} aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}
