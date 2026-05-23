import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  availableTags?: string[]
}

export function TagInput({ tags, onChange, availableTags = [] }: TagInputProps) {
  const [inputVal, setInputVal] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cleanVal = inputVal.trim()
      if (cleanVal && !tags.includes(cleanVal)) {
        onChange([...tags, cleanVal])
        setInputVal('')
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  const toggleAvailableTag = (tag: string) => {
    if (tags.includes(tag)) {
      onChange(tags.filter(t => t !== tag))
    } else {
      onChange([...tags, tag])
    }
  }

  return (
    <div className="space-y-3.5 select-none text-left">
      {/* Input container */}
      <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center flex-wrap gap-2 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-colors">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-[#3155F6] text-white dark:bg-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold leading-none"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-blue-700 dark:hover:bg-blue-700 p-0.5 rounded-full text-blue-100 hover:text-white transition-colors cursor-pointer"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Type a tag and press Enter..." : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-850 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Available suggestions */}
      {availableTags.length > 0 && (
        <div className="space-y-1.5">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Recommended Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleAvailableTag(tag)}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-[11px] font-bold border transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default TagInput
