import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, icon, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-bone-300">{label}</span>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-bone-100 placeholder:text-bone-400 focus:border-brass-500 focus:outline-none ${icon ? 'pl-10' : ''} ${className}`}
          {...rest}
        />
      </div>
    </label>
  );
}
