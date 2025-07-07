import React from 'react';

interface FormInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  type?: 'text' | 'number' | 'email';
}

export const FormInput: React.FC<FormInputProps> = ({
  value,
  onChange,
  placeholder = '',
  autoFocus = false,
  type = 'text'
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-transparent border-b-2 border-schnicken-light/50 text-center text-schnicken-light text-2xl md:text-3xl py-4 focus:outline-none focus:border-schnicken-light placeholder:text-schnicken-light/30 transition-all duration-300"
    />
  );
};
