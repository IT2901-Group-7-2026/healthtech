"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useFormatDate } from "@/hooks/use-format-date";
import { toTZDate } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import type { Matcher } from "react-day-picker";

export interface DateInputProps {
  value?: TZDate;
  onChange: (date?: TZDate) => void;
  placeholder?: string;
  minDate?: TZDate;
  maxDate?: TZDate;
  className?: string;
  id?: string;
  disabled?: boolean;
}

function tzToDate(date: TZDate | undefined): Date | undefined {
  return date ? (date as Date) : undefined;
}

export const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Select date",
      minDate,
      maxDate,
      className = "h-8 w-32 justify-between text-sm",
      id,
      disabled = false,
    },
    ref,
  ) => {
    const format = useFormatDate();
    const [open, setOpen] = React.useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            className={className}
            disabled={disabled}
          >
            {value ? format(value, "dd.MM.yy") : placeholder}
            <ChevronDownIcon className="ml-1 h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date ? toTZDate(date) : undefined);
              setOpen(false);
            }}
            disabled={{
              before: tzToDate(minDate),
              after:  tzToDate(maxDate),
            } as Matcher}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

DateInput.displayName = "DateInput";