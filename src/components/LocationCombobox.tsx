import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { BAHIR_DAR_NODES } from '../data/bahirdar-graph';

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const LocationCombobox: React.FC<LocationComboboxProps> = ({ value, onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedNode = BAHIR_DAR_NODES.find(n => n.id === value);
  const displayValue = selectedNode ? selectedNode.name : query;

  const filtered = BAHIR_DAR_NODES.filter(n =>
    n.name.toLowerCase().includes((selectedNode ? '' : query).toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(''); // clear selected node id when typing
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-8 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          onClick={() => setOpen(!open)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(node => (
              <button
                key={node.id}
                onClick={() => handleSelect(node.id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 ${
                  value === node.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                }`}
              >
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                {node.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              No matching location — using custom input
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationCombobox;
