import React, { useState } from "react";

interface FloatingInputProps {
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  isDarkMode: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  type = "text",
  value,
  onChange,
  label,
  icon,
  rightElement,
  disabled = false,
  autoFocus = false,
  maxLength,
  isDarkMode,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      {/* Icon */}
      {icon && (
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
            isFocused || value
              ? "text-blue-500"
              : isDarkMode
                ? "text-neutral-500"
                : "text-gray-400"
          }`}
        >
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck="false"
        className={`w-full ${icon ? "pl-12" : "pl-4"} ${
          rightElement ? "pr-12" : "pr-4"
        } py-3 rounded-2xl text-sm outline-none transition-all ${
          isDarkMode
            ? "bg-black/50 text-white border border-neutral-800 focus:border-blue-500 focus:bg-black"
            : "bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500 focus:bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        placeholder=" "
      />

      {/* Floating Label */}
      <label
        htmlFor={id}
        className={`absolute ${
          icon ? "left-12" : "left-4"
        } transition-all duration-200 pointer-events-none ${
          isFocused || value
            ? `-top-2.5 text-[10px] font-semibold px-2 rounded ${
                isDarkMode ? "bg-black text-blue-500" : "bg-white text-blue-600"
              }`
            : `top-4 text-sm ${
                isDarkMode ? "text-neutral-500" : "text-gray-400"
              }`
        }`}
      >
        {label}
      </label>

      {/* Right Element */}
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          {rightElement}
        </div>
      )}
    </div>
  );
};
