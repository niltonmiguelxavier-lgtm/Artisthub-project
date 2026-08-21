import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  required?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export default function Input({ label, icon, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-bone-300">{label}</span>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:outline-none ${icon ? 'pl-10' : ''} ${className}`}
          {...rest}
        />
      </div>
    </label>
  );
}
