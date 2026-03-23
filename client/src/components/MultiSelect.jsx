import { useEffect, useMemo, useRef, useState } from 'react';

export default function MultiSelect({ options = [], value = [], onChange, placeholder = 'Select', className = '', showFilter = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => (o.label || '').toLowerCase().includes(q) || (o.value || '').toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (v) => {
    const set = new Set(value.map(String));
    const sv = String(v);
    if (set.has(sv)) set.delete(sv); else set.add(sv);
    onChange?.(Array.from(set));
  };

  const allSelected = filtered.length > 0 && filtered.every(o => value.map(String).includes(String(o.value)));
  const clear = () => onChange?.([]);
  const selectAll = () => onChange?.(filtered.map(o => String(o.value)));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full border rounded px-2 h-10 text-left flex items-center justify-between"
      >
        <span className="truncate">
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5.25 7.5l4.75 4.75L14.75 7.5" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border bg-white shadow">
          {showFilter && (
            <div className="p-2 border-b">
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="filter..."
                className="w-full border rounded px-2 py-1"
              />
            </div>
          )}
          <div className="max-h-40 overflow-auto">
            <button
              type="button"
              onClick={allSelected ? clear : selectAll}
              className="w-full text-left px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
            >
              {allSelected ? 'Clear' : 'Select All'}
            </button>
            {filtered.map(o => {
              const checked = value.map(String).includes(String(o.value));
              return (
                <label key={String(o.value)} className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50">
                  <input type="checkbox" checked={checked} onChange={()=>toggle(o.value)} />
                  <span className="text-sm">{o.label}</span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
