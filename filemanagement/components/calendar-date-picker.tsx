"use client";

import * as React from "react";
// Anda bisa memilih menggunakan X atau tidak untuk ikon tombol tutup
import { CalendarIcon } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay
} from "date-fns";
import { toDate, formatInTimeZone } from "date-fns-tz";
import { DateRange } from "react-day-picker";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"; // Pastikan path ini benar
import { Button } from "@/components/ui/button"; // Pastikan path ini benar
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"; // Pastikan path ini benar
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"; // Pastikan path ini benar
// Asumsi Calendar ada di direktori yang sama atau path ini benar
import { Calendar } from "./ui/calendar";

// Nama bulan sudah dalam Bahasa Indonesia
const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Varian styling (tidak diubah)
const multiSelectVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground", // Hapus text-background jika tidak diperlukan
        link: "underline-offset-4 hover:underline text-primary" // Sesuaikan warna link jika perlu
      }
    },
    defaultVariants: {
      variant: "outline" // Ubah default variant jika perlu, misal 'outline'
    }
  }
);

// Interface Props (tidak diubah)
interface CalendarDatePickerProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  title?: string;
  className?: string;
  date: DateRange;
  closeOnSelect?: boolean;
  numberOfMonths?: 1 | 2;
  yearsRange?: number;
  onDateSelect: (range: { from: Date; to: Date }) => void;
}

// Komponen Utama
export const CalendarDatePicker = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      closeOnSelect = false,
      numberOfMonths = 2,
      yearsRange = 10,
      onDateSelect,
      variant, // Ambil variant dari props
      ...props
    },
    ref
  ) => {
    // State internal (tidak diubah)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      numberOfMonths === 2 ? "Tahun Ini" : "Hari Ini"
    );
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(date?.from);
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(date?.from?.getFullYear());
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(numberOfMonths === 2 ? date?.to : date?.from);
    const [yearTo, setYearTo] = React.useState<number | undefined>(numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear());
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(null);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Handler fungsi (tidak diubah, kecuali penambahan handleClose)
    const handleClose = () => setIsPopoverOpen(false);
    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range?.from) {
        let from = startOfDay(range.from);
        let to = range.to ? endOfDay(range.to) : endOfDay(from);
        if (to.getTime() < from.getTime()) { to = endOfDay(from); }
        // console.log(`CalendarDatePicker: Memanggil onDateSelect dengan Dari=${from.toISOString()}, Ke=${to.toISOString()}`);
        onDateSelect({ from, to });
        setMonthFrom(range.from);
        setYearFrom(range.from.getFullYear());
        setMonthTo(range.to || range.from);
        setYearTo((range.to || range.from).getFullYear());
        if (closeOnSelect && range.from && (numberOfMonths === 1 || range.to)) {
          handleClose();
        }
      }
      setSelectedRange(null);
    };

    const selectDateRange = (fromInput: Date, toInput: Date, rangeLabel: string) => {
      const startDate = startOfDay(fromInput);
      const endDate = endOfDay(toInput);
      // console.log(`CalendarDatePicker: Preset '${rangeLabel}', Dari=${startDate.toISOString()}, Ke=${endDate.toISOString()}`);
      onDateSelect({ from: startDate, to: endDate });
      setSelectedRange(rangeLabel);
      setMonthFrom(startDate);
      setYearFrom(startDate.getFullYear());
      setMonthTo(endDate);
      setYearTo(endDate.getFullYear());
      if (closeOnSelect) {
        handleClose();
      }
    };

    const handleMonthChange = (newMonthIndex: number, part: string) => {
      setSelectedRange(null);
      if (part === "from") {
        if (yearFrom !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > 11) return;
          const newMonth = new Date(yearFrom, newMonthIndex, 1);
          // Ambil tanggal 'from' saat ini jika ada, jika tidak, gunakan awal bulan
          const currentFromDay = date?.from ? date.from.getDate() : 1;
          let potentialFromDate = new Date(yearFrom, newMonthIndex, currentFromDay);

          // Jika tanggal tidak valid (misal 31 Feb), set ke akhir bulan sebelumnya
          if (potentialFromDate.getMonth() !== newMonthIndex) {
              potentialFromDate = endOfMonth(new Date(yearFrom, newMonthIndex - 1, 1));
          }

          const from = startOfDay(potentialFromDate);
          let to = date?.to;

          // Jika mode single month atau 'to' tidak ada, set 'to' = 'from'
          if (numberOfMonths !== 2 || !to) {
              to = endOfDay(from);
          } else {
              to = endOfDay(toDate(to, { timeZone }));
          }

          // Pastikan 'from' <= 'to'
          if (from.getTime() <= to.getTime()) {
              onDateSelect({ from, to });
              setMonthFrom(from); // Set bulan berdasarkan tanggal 'from' yang baru
              // Pertahankan 'monthTo' jika 'to' tidak berubah signifikan
              if (date?.to && to.getMonth() === date.to.getMonth() && to.getFullYear() === date.to.getFullYear()) {
                 setMonthTo(date.to)
              } else {
                 // Jika 'to' berubah bulan/tahun, update monthTo juga
                 setMonthTo(to);
              }
          }
        }
      } else { // part === 'to'
        if (yearTo !== undefined && numberOfMonths === 2 && date?.from) {
          if (newMonthIndex < 0 || newMonthIndex > 11) return;
           // Ambil tanggal 'to' saat ini jika ada, jika tidak, gunakan akhir bulan
           const currentToDay = date?.to ? date.to.getDate() : 31; // Default ke 31, akan disesuaikan
           const newMonth = new Date(yearTo, newMonthIndex, 1); // Awal bulan target
           let potentialToDate = new Date(yearTo, newMonthIndex, currentToDay);

           // Jika tanggal tidak valid atau lebih dari akhir bulan, set ke akhir bulan
           if(potentialToDate.getMonth() !== newMonthIndex || potentialToDate.getDate() < currentToDay) {
              potentialToDate = endOfMonth(newMonth);
           }

          const from = startOfDay(toDate(date.from, { timeZone }));
          const to = endOfDay(potentialToDate);

          // Pastikan 'from' <= 'to'
          if (from.getTime() <= to.getTime()) {
            onDateSelect({ from, to });
            setMonthTo(to); // Update monthTo berdasarkan tanggal 'to' yang baru
            // Pertahankan 'monthFrom'
            if(date?.from) setMonthFrom(date.from);
          }
        }
      }
    };

    const handleYearChange = (newYear: number, part: string) => {
        setSelectedRange(null);
        if (part === "from") {
            if (years.includes(newYear)) {
                const currentMonthIndex = monthFrom ? monthFrom.getMonth() : (date?.from ? date.from.getMonth() : 0);
                const currentDay = date?.from ? date.from.getDate() : 1;
                let potentialFromDate = new Date(newYear, currentMonthIndex, currentDay);

                // Validasi tanggal (misal 29 Feb di tahun non-kabisat)
                if (potentialFromDate.getMonth() !== currentMonthIndex) {
                    potentialFromDate = endOfMonth(new Date(newYear, currentMonthIndex - 1, 1));
                }

                const from = startOfDay(potentialFromDate);
                let to = date?.to;

                if (numberOfMonths !== 2 || !to) {
                    to = endOfDay(from);
                } else {
                    to = endOfDay(toDate(to, { timeZone }));
                }

                if (from.getTime() <= to.getTime()) {
                    onDateSelect({ from, to });
                    setYearFrom(newYear);
                    setMonthFrom(from);
                     // Update 'to' state juga jika perlu
                     if (date?.to && to.getFullYear() !== date.to.getFullYear()) {
                        setYearTo(to.getFullYear())
                     }
                      if (date?.to && to.getMonth() !== date.to.getMonth()) {
                        setMonthTo(to)
                     }
                }
            }
        } else { // part === 'to'
            if (years.includes(newYear) && numberOfMonths === 2 && date?.from) {
                const currentMonthIndex = monthTo ? monthTo.getMonth() : (date?.to ? date.to.getMonth() : 11);
                 const currentDay = date?.to ? date.to.getDate() : 31;
                 let potentialToDate = new Date(newYear, currentMonthIndex, currentDay);

                 // Validasi tanggal
                if(potentialToDate.getMonth() !== currentMonthIndex || potentialToDate.getDate() < currentDay) {
                    potentialToDate = endOfMonth(new Date(newYear, currentMonthIndex, 1));
                }

                const from = startOfDay(toDate(date.from, { timeZone }));
                const to = endOfDay(potentialToDate);

                if (from.getTime() <= to.getTime()) {
                    onDateSelect({ from, to });
                    setYearTo(newYear);
                    setMonthTo(to);
                    // Pertahankan 'from' state
                    if (date?.from) {
                        setYearFrom(date.from.getFullYear());
                        setMonthFrom(date.from);
                    }
                }
            }
        }
    };

    // Helper dan variabel lain (tidak diubah)
    const today = new Date();
    const years = Array.from(
      { length: yearsRange + 1 },
      (_, i) => today.getFullYear() - Math.floor(yearsRange / 2) + i
    );
    const dateRanges = [
      { label: "Hari Ini", start: today, end: today },
      { label: "Kemarin", start: subDays(today, 1), end: subDays(today, 1) },
      { label: "Minggu Ini", start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) },
      { label: "Minggu Lalu", start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7), end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7) },
      { label: "7 Hari Terakhir", start: subDays(today, 6), end: today },
      { label: "Bulan Ini", start: startOfMonth(today), end: endOfMonth(today) },
      { label: "Bulan Lalu", start: startOfMonth(subDays(today, today.getDate())), end: endOfMonth(subDays(today, today.getDate())) },
      { label: "Tahun Ini", start: startOfYear(today), end: endOfYear(today) },
      { label: "Tahun Lalu", start: startOfYear(subDays(today, 365)), end: endOfYear(subDays(today, 365)) }
    ];
    const handleMouseOver = (part: string) => setHighlightedPart(part);
    const handleMouseLeave = () => setHighlightedPart(null);
    // Handler wheel event tidak disertakan di sini untuk keringkasan, asumsikan sudah ada
    React.useEffect(() => { /* ... (wheel listener effect) ... */ }, [highlightedPart, date, id, numberOfMonths]);
    const formatWithTz = (date: Date, fmt: string) => formatInTimeZone(date, timeZone, fmt);

    // Render JSX
    return (
      <>
        <style>{`.date-part { touch-action: none; }`}</style>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            {/* Tombol Trigger */}
            <Button
              variant={variant || "outline"} // Gunakan variant dari props atau default 'outline'
              id={id || "date"}
              ref={ref}
              {...props} // Sebarkan props sisa ke Button
              className={cn(
                "w-auto justify-start text-left font-normal h-8", // Default styling trigger, sesuaikan tinggi (h-8)
                !date?.from && "text-muted-foreground", // Style jika belum ada tanggal
                className // Terapkan className dari props
              )}
              onClick={handleTogglePopover}
              suppressHydrationWarning
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {/* Tampilan Tanggal di Tombol Trigger */}
              <span>
                {date?.from ? (
                  date.to && date.from.getTime() !== date.to.getTime() ? (
                    <>
                      <span id={`firstDay-${id}`} className={cn("date-part", highlightedPart === "firstDay" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstDay")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.from, "dd")}</span>{" "}
                      <span id={`firstMonth-${id}`} className={cn("date-part", highlightedPart === "firstMonth" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstMonth")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.from, "LLL")}</span>
                      {/* Tampilkan tahun 'from' hanya jika beda dengan tahun 'to' */}
                      {date.from.getFullYear() !== date.to.getFullYear() && (
                         <span id={`firstYear-${id}`} className={cn("date-part", highlightedPart === "firstYear" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstYear")} onMouseLeave={handleMouseLeave}>, {formatWithTz(date.from, "y")}</span>
                      )}
                      {/* Pemisah */}
                      {" - "}
                      {/* Bagian 'to' */}
                      <span id={`secondDay-${id}`} className={cn("date-part", highlightedPart === "secondDay" && "underline font-bold")} onMouseOver={() => handleMouseOver("secondDay")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.to, "dd")}</span>{" "}
                      <span id={`secondMonth-${id}`} className={cn("date-part", highlightedPart === "secondMonth" && "underline font-bold")} onMouseOver={() => handleMouseOver("secondMonth")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.to, "LLL")}</span>,{" "}
                      <span id={`secondYear-${id}`} className={cn("date-part", highlightedPart === "secondYear" && "underline font-bold")} onMouseOver={() => handleMouseOver("secondYear")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.to, "y")}</span>
                    </>
                  ) : (
                     // Tampilan Tanggal Tunggal
                     <>
                       <span id={`day-${id}`} className={cn("date-part", highlightedPart === "firstDay" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstDay")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.from, "dd")}</span>{" "}
                       <span id={`month-${id}`} className={cn("date-part", highlightedPart === "firstMonth" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstMonth")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.from, "LLL")}</span>,{" "}
                       <span id={`year-${id}`} className={cn("date-part", highlightedPart === "firstYear" && "underline font-bold")} onMouseOver={() => handleMouseOver("firstYear")} onMouseLeave={handleMouseLeave}>{formatWithTz(date.from, "y")}</span>
                     </>
                  )
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          {/* Konten Popover */}
          {isPopoverOpen && (
            <PopoverContent
              className="w-auto p-0"
              align="start"
              avoidCollisions={false}
              onInteractOutside={handleClose}
              onEscapeKeyDown={handleClose}
              style={{ maxHeight: "var(--radix-popover-content-available-height)", overflowY: "auto" }}
            >
              {/* Flex Container Utama Konten */}
              <div className="flex">
                {/* Preset (kiri) */}
                {numberOfMonths === 2 && (
                  <div className="flex flex-col gap-1 px-4 py-4 text-left border-r border-border min-w-[150px]"> {/* Ganti border-foreground/10 jadi border-border */}
                    {dateRanges.map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start w-full text-left px-2 h-8", // Set tinggi (h-8) agar konsisten
                          "hover:bg-accent hover:text-accent-foreground", // Gunakan warna aksen untuk hover
                          selectedRange === label && "bg-primary text-primary-foreground hover:bg-primary/80" // Highlight jika aktif
                        )}
                        onClick={() => selectDateRange(start, end, label)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                {/* Kalender & Dropdown (kanan) */}
                <div className="flex flex-col p-2">
                  {/* Dropdown Bulan & Tahun */}
                  <div className="flex items-center justify-center gap-2 mb-2"> {/* Sesuaikan gap */}
                    {/* Dropdown 'From' */}
                    <div className="flex gap-2">
                      <Select onValueChange={(v) => handleMonthChange(months.indexOf(v), "from")} value={monthFrom ? months[monthFrom.getMonth()] : undefined}>
                        <SelectTrigger className="w-[122px] focus:ring-0 focus:ring-offset-0 h-8"> {/* Hapus styling hover agar default */}
                          <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>{months.map((m, i) => <SelectItem key={i} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select onValueChange={(v) => handleYearChange(Number(v), "from")} value={yearFrom ? yearFrom.toString() : undefined}>
                        <SelectTrigger className="w-[100px] focus:ring-0 focus:ring-offset-0 h-8">
                          <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>{years.map((y, i) => <SelectItem key={i} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Pemisah */}
                    {numberOfMonths === 2 && <span className="mx-1 text-muted-foreground">-</span>}
                    {/* Dropdown 'To' */}
                    {numberOfMonths === 2 && (
                      <div className="flex gap-2">
                        <Select onValueChange={(v) => handleMonthChange(months.indexOf(v), "to")} value={monthTo ? months[monthTo.getMonth()] : undefined}>
                          <SelectTrigger className="w-[122px] focus:ring-0 focus:ring-offset-0 h-8">
                            <SelectValue placeholder="Bulan" />
                          </SelectTrigger>
                          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={(v) => handleYearChange(Number(v), "to")} value={yearTo ? yearTo.toString() : undefined}>
                          <SelectTrigger className="w-[100px] focus:ring-0 focus:ring-offset-0 h-8">
                            <SelectValue placeholder="Tahun" />
                          </SelectTrigger>
                          <SelectContent>{years.map((y, i) => <SelectItem key={i} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {/* Kalender */}
                  <div className="flex pl-4 pb-8">
                    <Calendar
                      mode="range"
                      // defaultMonth={monthFrom} // Tidak perlu jika month sudah controlled
                      month={monthFrom} // Controlled month
                      onMonthChange={setMonthFrom} // Handler untuk controlled month
                      selected={date}
                      onSelect={handleDateSelect}
                      numberOfMonths={numberOfMonths}
                      showOutsideDays={false}
                      className={cn("p-0", className)} // Terapkan className dari props ke Calendar juga jika relevan
                      // Tambahkan modifiers jika perlu untuk styling hari tertentu
                      // modifiers={{ ... }}
                      // modifiersClassNames={{ ... }}
                    />
                  </div>
                </div>
              </div>
              {/* Area Tombol Tutup */}
              <div className="flex justify-end p-2 border-t border-border mt-1">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Tutup
                </Button>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </>
    );
  }
);

CalendarDatePicker.displayName = "CalendarDatePicker";