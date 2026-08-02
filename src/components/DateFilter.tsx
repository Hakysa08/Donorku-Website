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
} from "date-fns";
import { id } from "date-fns/locale";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
};

const HARI = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DateFilter({
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const [bulanAktif, setBulanAktif] = useState<Date>(
    value ?? new Date()
  );

  // saat popover dibuka, sinkronkan bulan yang ditampilkan dengan tanggal terpilih
  useEffect(() => {
    if (open) {
      setBulanAktif(value ?? new Date());
    }
  }, [open, value]);

  const label = format(value ?? new Date(), "d MMMM yyyy", {
    locale: id,
  });

  const awalGrid = startOfWeek(
    startOfMonth(bulanAktif),
    { weekStartsOn: 1 }
  );

  const akhirGrid = endOfWeek(
    endOfMonth(bulanAktif),
    { weekStartsOn: 1 }
  );

  const semuaTanggal = eachDayOfInterval({
    start: awalGrid,
    end: akhirGrid,
  });

  function pilihTanggal(tanggal: Date) {
    onChange(tanggal);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="
            flex
            h-[52px]
            w-fit
            min-w-[210px]
            items-center
            justify-between
            gap-3
            rounded-2xl
            border
            border-gray-200
            bg-white
            px-4
            shadow-sm
            transition
            hover:border-gray-300
          "
        >
          <span className="truncate text-[14px] font-medium text-gray-800">
            {label}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-gray-500 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="end"
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
              {format(bulanAktif, "MMMM yyyy", {
                locale: id,
              })}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setBulanAktif((prev) =>
                    subMonths(prev, 1)
                  )
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setBulanAktif((prev) =>
                    addMonths(prev, 1)
                  )
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
              const diBulanIni = isSameMonth(
                tanggal,
                bulanAktif
              );

              const terpilih =
                value && isSameDay(tanggal, value);

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
                        ? "font-bold text-red-600"
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

          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-500
                py-2
                text-sm
                font-medium
                text-white
                hover:bg-red-600
              "
            >
              <X size={15} />
              Hapus Filter
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
