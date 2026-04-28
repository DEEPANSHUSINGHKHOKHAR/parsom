import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  value,
  onChange,
  placeholder,
  name,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...inputProps}
        className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 pr-12 text-sm text-[#171412] outline-none transition placeholder:text-[#756c63]/60 focus:border-[#171412]/25"
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#756c63] transition hover:bg-[#171412]/5 hover:text-[#171412]"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
