import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const inputClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

// Two compounding problems, both fixed here without touching any call site:
//
// 1. Numeric fields default to the number 0 (`someField: 0` in every form's
//    initial state), so an untouched field literally displays "0". Clicking
//    in and typing "5" without first selecting that "0" makes the DOM (and
//    real browsers, correctly) insert after it — "05" — not replace it. Fix:
//    select the whole value on focus, the standard numeric-field convention,
//    so the first keystroke replaces "0" instead of appending to it.
//
// 2. Even when the DOM briefly shows "05" mid-keystroke, React DOM's
//    controlled <input type="number"> reconciliation compares the DOM's
//    current text against the `value` prop with LOOSE equality. The parent's
//    onChange parses "05" to the number 5 and re-renders with value={5} —
//    but "05" == 5, so React decides nothing changed and leaves "05" sitting
//    in the DOM even though the underlying value is already correct. Fix:
//    never feed a round-tripped *number* back into the DOM as `value`.
//    Instead, drive the visible text from a local string buffer that is
//    always updated from the exact same keystroke event the user just
//    produced, and only resync that buffer from the external (parsed) value
//    while the field isn't focused — e.g. when the form loads initial data
//    or another field recomputes it. The external onChange contract (fires
//    with the native event, callers still do `parseFloat(e.target.value) ||
//    0`) is unchanged, so no call site needs to be touched.
function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [text, setText] = React.useState(() =>
    value === undefined || value === null ? "" : String(value),
  )
  const focused = React.useRef(false)

  React.useEffect(() => {
    if (!focused.current) {
      setText(value === undefined || value === null ? "" : String(value))
    }
  }, [value])

  return (
    <InputPrimitive
      type="number"
      data-slot="input"
      className={cn(inputClassName, className)}
      value={text}
      onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = true
        e.target.select()
        onFocus?.(e)
      }}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = false
        setText(value === undefined || value === null ? "" : String(value))
        onBlur?.(e)
      }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
        onChange?.(e)
      }}
      {...props}
    />
  )
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (type === "number") {
    return <NumberInput className={className} {...props} />
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

export { Input }
