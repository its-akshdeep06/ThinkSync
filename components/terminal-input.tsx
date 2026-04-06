'use client'

import { useState, useRef, useEffect } from 'react'

interface TerminalInputProps {
  onSubmit: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function TerminalInput({ onSubmit, disabled = false, placeholder = 'Describe your intent...' }: TerminalInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
      setValue('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div 
        className={`flex items-center gap-3 bg-ts-elevated p-4 transition-all duration-200 ${
          isFocused ? 'border-b-[0.5px] border-ts-emerald' : 'border-b-[0.5px] border-transparent'
        }`}
      >
        <span className="font-mono text-[13px] text-ts-emerald">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-mono text-[12px] text-ts-text-primary placeholder:text-ts-text-ghost focus:outline-none disabled:opacity-50"
        />
        {value && (
          <span className="w-[2px] h-4 bg-ts-emerald cursor-blink" />
        )}
      </div>
    </form>
  )
}
