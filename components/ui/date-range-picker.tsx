"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
  placeholder = "Selecciona un rango de fechas"
}: DatePickerWithRangeProps) {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal text-sm h-9",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            {date?.from ? (
              date.to ? (
                <span className="truncate">
                  {format(date.from, "d MMM", { locale: es })} - {format(date.to, "d MMM, yyyy", { locale: es })}
                </span>
              ) : (
                format(date.from, "d MMM, yyyy", { locale: es })
              )
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[95vw] md:min-w-[600px] p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={isMobile ? 1 : 2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
