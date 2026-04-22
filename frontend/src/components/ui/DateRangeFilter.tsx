import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "../../utils/cn";

export type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Custom Range", value: "custom" },
];

export function DateRangeFilter({ onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("30days");
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30)),
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);

  const handlePresetClick = (preset: (typeof PRESETS)[0]) => {
    setSelectedPreset(preset.value);

    const end = new Date();
    const start = new Date();

    switch (preset.value) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start.setDate(end.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "7days":
        start.setDate(end.getDate() - 7);
        break;
      case "30days":
        start.setDate(end.getDate() - 30);
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case "custom":
        return;
    }

    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setIsOpen(false);

      const label =
        PRESETS.find((p) => p.value === selectedPreset && p.value !== "custom")
          ?.label ||
        `${tempStartDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} - ${tempEndDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}`;

      onChange({
        startDate: tempStartDate.toISOString(),
        endDate: tempEndDate.toISOString(),
        label: label,
      });
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const onDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setTempStartDate(start);
    setTempEndDate(end);
    setSelectedPreset("custom");
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-700 hover:border-surface-300 transition-all shadow-sm group min-w-[220px]"
      >
        <Calendar size={18} className="text-[hsl(var(--primary))]" />
        <span className="flex-1 text-left truncate">
          {startDate?.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}{" "}
          -{" "}
          {endDate?.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-surface-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleCancel} />
          <div className="absolute right-0 mt-1 bg-white border border-surface-200 rounded shadow-xl z-30 flex flex-col min-w-[680px]">
            <div className="flex">
              {/* Presets Sidebar */}
              <div className="w-[160px] border-r border-surface-100 flex flex-col py-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      selectedPreset === preset.value
                        ? "bg-[hsl(var(--primary))] text-white font-medium"
                        : "text-surface-600 hover:bg-surface-50",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Multi-month Picker */}
              <div className="p-2 custom-range-picker flex-1">
                <DatePicker
                  selected={tempStartDate}
                  onChange={onDateChange}
                  startDate={tempStartDate}
                  endDate={tempEndDate}
                  selectsRange
                  monthsShown={2}
                  inline
                  calendarClassName="border-none shadow-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-3 border-t border-surface-100 bg-surface-50/50">
              <span className="text-sm font-medium text-surface-600 mr-auto pl-2">
                {tempStartDate?.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}{" "}
                -{" "}
                {tempEndDate?.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-sm font-bold text-surface-900 bg-surface-100 hover:bg-surface-200 rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!tempStartDate || !tempEndDate}
                className="px-8 py-2 text-sm font-bold text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] rounded transition-all disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .custom-range-picker .react-datepicker {
          border: none !important;
          font-family: inherit !important;
          display: flex !important;
        }
        .custom-range-picker .react-datepicker__header {
          background-color: white !important;
          border-bottom: none !important;
          padding-top: 15px !important;
        }
        .custom-range-picker .react-datepicker__month-container {
          padding: 0 10px !important;
          float: none !important;
        }
        .custom-range-picker .react-datepicker__current-month {
          font-size: 14px !important;
          font-weight: 700 !important;
          margin-bottom: 10px !important;
          color: #1e293b !important;
        }
        .custom-range-picker .react-datepicker__day-name {
          font-size: 12px !important;
          font-weight: 700 !important;
          width: 2.5rem !important;
          color: #64748b !important;
          margin: 0 !important;
        }
        .custom-range-picker .react-datepicker__day {
          width: 2.5rem !important;
          line-height: 2.5rem !important;
          font-size: 13px !important;
          margin: 0 !important;
          border-radius: 0 !important;
          color: #1e293b !important;
          font-weight: 500 !important;
        }
        .custom-range-picker .react-datepicker__day--in-range {
          background-color: #e0f2fe !important;
          color: #0369a1 !important;
        }
        .custom-range-picker .react-datepicker__day--in-selecting-range {
          background-color: #f0f9ff !important;
        }
        .custom-range-picker .react-datepicker__day--selected,
        .custom-range-picker .react-datepicker__day--range-start,
        .custom-range-picker .react-datepicker__day--range-end {
          background-color: #0284c7 !important;
          color: white !important;
          border-radius: 4px !important;
        }
        .custom-range-picker .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }
        .custom-range-picker .react-datepicker__navigation {
          top: 15px !important;
        }
        .custom-range-picker .react-datepicker__month {
          margin: 0.4rem !important;
        }
      `}</style>
    </div>
  );
}
