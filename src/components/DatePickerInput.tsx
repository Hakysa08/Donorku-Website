"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parse,
  isValid,
} from "date-fns";
import { id } from "date-fns/locale";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value: string; // format "yyyy-MM-dd", boleh string kosong
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

const HARI = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

function toValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = "Pilih Tanggal",
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selected = parseValue(value);

  const [bulanAktif, setBulanAktif] = useState<Date>(
    selected ?? new Date()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setBulanAktif(selected ?? new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = mounted && selected
      ? format(selected, "dd/MM/yyyy")
      : "";

  const awalGrid = startOfWeek(startOfMonth(bulanAktif), { weekStartsOn: 1 });
  const akhirGrid = endOfWeek(endOfMonth(bulanAktif), { weekStartsOn: 1 });

  const semuaTanggal = eachDayOfInterval({
    start: awalGrid,
    end: akhirGrid,
  });

  function pilihTanggal(tanggal: Date) {
    onChange(toValue(tanggal));
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="
            flex
            h-12
            w-full
            items-center
            justify-between
            gap-3
            rounded-xl
            border
            border-gray-200
            bg-white
            px-5
            text-base
            outline-none
            transition
            hover:border-gray-300
            focus:border-red-400
            focus:ring-2
            focus:ring-red-100
          "
        >
          <span
            className={`truncate ${
              label ? "text-gray-800" : "text-gray-300"
            }`}
          >
            {label || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-gray-500 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </Popover.Trigger>

      {/* Input tersembunyi supaya validasi HTML `required` tetap bisa jalan
          kalau form ini di-submit lewat native form validation */}
      {required && (
        <input
          type="text"
          value={value}
          readOnly
          required
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}

      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="start"
          className="
            z-50
            w-[280px]
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-4
            shadow-xl
          "
        >
          {/* HEADER BULAN */}
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-[15px] font-bold text-black">
              {format(bulanAktif, "MMMM yyyy", { locale: id })}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setBulanAktif((prev) => subMonths(prev, 1))
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setBulanAktif((prev) => addMonths(prev, 1))
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* HARI */}
          <div className="mb-2 grid grid-cols-7">
            {HARI.map((hari) => (
              <div
                key={hari}
                className="text-center text-[11px] font-medium uppercase text-gray-400"
              >
                {hari}
              </div>
            ))}
          </div>

          {/* TANGGAL */}
          <div className="grid grid-cols-7 gap-y-1">
            {semuaTanggal.map((tanggal) => {
              const diBulanIni = isSameMonth(tanggal, bulanAktif);
              const terpilih = selected && isSameDay(tanggal, selected);

              return (
                <button
                  key={tanggal.toISOString()}
                  type="button"
                  onClick={() => pilihTanggal(tanggal)}
                  className={`
                    mx-auto
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    text-[13px]
                    transition
                    hover:bg-gray-100
                    ${
                      terpilih
                        ? "bg-red-600 font-bold text-white hover:bg-red-600"
                        : diBulanIni
                        ? "text-gray-800"
                        : "text-gray-300"
                    }
                  `}
                >
                  {format(tanggal, "d")}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}