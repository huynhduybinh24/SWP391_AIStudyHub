import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.split('')
  // Ensure we always have an array of length 6
  const otpArray = Array.from({ length: 6 }, (_, i) => digits[i] || '')

  const handleInputChange = (index: number, val: string) => {
    // Only allow numbers
    if (val && !/^\d+$/.test(val)) return

    const newOtpArray = [...otpArray]
    newOtpArray[index] = val.slice(-1) // keep the last entered char

    const newOtpValue = newOtpArray.join('')
    onChange(newOtpValue)

    // Auto-focus next input if a value is typed
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        // If current value is empty, focus previous input and clear it
        inputRefs.current[index - 1]?.focus()
        const newOtpArray = [...otpArray]
        newOtpArray[index - 1] = ''
        onChange(newOtpArray.join(''))
      } else {
        // Clear current input
        const newOtpArray = [...otpArray]
        newOtpArray[index] = ''
        onChange(newOtpArray.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData) {
      onChange(pastedData)
      // Focus the last input filled or the next empty one
      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-2.5">
        {otpArray.map((digit, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            className={`size-12 rounded-xl text-center text-lg font-bold bg-[#E8EEFF]/40 border border-slate-200/50 dark:border-slate-800 text-foreground dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 focus:border-[#2563eb]'
            }`}
          />
        ))}
      </div>
      {error && <p className="text-center text-xs text-red-500 font-semibold mt-1.5">{error}</p>}
    </div>
  )
}
