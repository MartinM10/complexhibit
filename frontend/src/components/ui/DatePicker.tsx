"use client";

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ selected, onChange, placeholder, className }: DatePickerProps) {
  return (
    <div className="relative">
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder || "Select date"}
        className={`w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow ${className || ""}`}
        isClearable
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={100}
      />
      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      <style jsx global>{`
        .react-datepicker-wrapper {
          display: block;
          width: 100%;
        }
        .react-datepicker__input-container {
          display: block;
        }
        .react-datepicker-popper {
          z-index: 50 !important;
        }
      `}</style>
    </div>
  );
}
