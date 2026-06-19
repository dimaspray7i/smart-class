import React, { useState, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export function RetroTag({ label, color = 'orange' }) {
  const colors = {
    orange: 'bg-retro-orange/10 text-retro-orange border-retro-orange',
    blue: 'bg-retro-blue/10 text-retro-blue border-retro-blue',
    purple: 'bg-retro-purple/10 text-retro-purple border-retro-purple',
    lime: 'bg-retro-lime/10 text-retro-lime border-retro-lime',
    green: 'bg-retro-green/10 text-retro-green border-retro-green',
    pink: 'bg-retro-pink/10 text-retro-pink border-retro-pink',
    gray: 'bg-base-gray/10 text-base-black/50 border-base-black/10',
  };
  return (
    <span className={twMerge("px-2 py-0.5 rounded-retro text-[9px] font-black uppercase border-2", colors[color])}>
      {label}
    </span>
  );
}

export function RetroInput({ label, name, value, onChange, error, ...props }) {
  return (
    <Input
      label={label}
      value={value}
      onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))}
      error={error}
      {...props}
    />
  );
}

export function RetroSelect({ label, name, value, onChange, options = [], error, ...props }) {
  return (
    <Select
      label={label}
      value={value}
      onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))}
      options={options}
      error={error}
      {...props}
    />
  );
}

export function RetroSubjectMultiSelect({ label, value = [], onChange, subjects = [], error }) {
  const toggleSubject = (id) => {
    const next = value.includes(id) ? value.filter(i => i !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">{label}</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
        {subjects.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSubject(s.id)}
            className={twMerge(
              "px-3 py-1 rounded-retro border-2 font-retro-mono text-[10px] transition-all",
              value.includes(s.id)
                ? "bg-retro-purple text-base-white border-base-black shadow-hard-sm"
                : "bg-base-white text-base-black border-base-black/20 hover:border-base-black"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}

export function RetroAvatarUpload({ value, onChange, error, onError }) {
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof value === 'string') setPreview(value);
  }, [value]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onError?.('❌ Max file size 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">Avatar</label>
      <div className="flex gap-3 items-center">
        <div className="w-20 h-20 border-4 border-base-black rounded-retro overflow-hidden bg-base-gray/20 flex items-center justify-center flex-shrink-0">
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">📷</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="retro-btn retro-btn-secondary text-xs"
        >
          Pilih File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}
