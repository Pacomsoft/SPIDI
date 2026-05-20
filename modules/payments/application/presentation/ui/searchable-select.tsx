'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Texto secundario mostrado debajo del label (ej. CURP, email) */
  description?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onSelect: (value: string) => void;
  /** Valores ya seleccionados — se marcan con ✓ y quedan deshabilitados */
  selectedValues?: string[];
  disabled?: boolean;
  /**
   * Búsqueda controlada externamente (ej. para debounce con API).
   * Cuando se pasa, el filtrado interno queda desactivado y la lista
   * muestra exactamente las `options` recibidas.
   */
  externalSearch?: string;
  onExternalSearchChange?: (value: string) => void;
  /**
   * Fuerza el texto mostrado en el trigger (útil cuando las options cambian
   * dinámicamente y el item seleccionado ya no está en la lista actual).
   */
  displayValue?: string;
}

/**
 * Select con búsqueda integrada y scroll.
 * Construido sobre Radix Popover + Input nativo (sin dependencia de cmdk).
 * Compatible con mobile: el popover ocupa el ancho del trigger (align="start", w-full).
 */
export function SearchableSelect({
  options,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  onSelect,
  selectedValues = [],
  disabled = false,
  externalSearch,
  onExternalSearchChange,
  displayValue,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Si hay búsqueda externa, la lista no se filtra internamente
  const isExternal = externalSearch !== undefined && onExternalSearchChange !== undefined;
  const activeQuery = isExternal ? externalSearch : query;

  const filtered = React.useMemo(() => {
    if (isExternal) return options; // filtrado delegado al padre
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query, isExternal]);

  // Autofocus al input cuando abre
  React.useEffect(() => {
    if (open) {
      // Pequeño delay para que el Popover haya montado el DOM
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      setQuery('');
      if (isExternal) onExternalSearchChange?.('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (value: string) => {
    if (isExternal) {
      onExternalSearchChange!(value);
    } else {
      setQuery(value);
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setOpen(false);
  };

  // Label a mostrar en el trigger: displayValue tiene prioridad, luego busca en options, luego placeholder
  const selectedLabel = React.useMemo(() => {
    if (displayValue) return displayValue;
    if (selectedValues.length === 0) return null;
    return options.find(o => o.value === selectedValues[0])?.label ?? null;
  }, [displayValue, options, selectedValues]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            selectedLabel ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="line-clamp-1">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          // Iguala el ancho al trigger en todos los tamaños de pantalla
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          className={cn(
            'z-50 min-w-[12rem] rounded-md border bg-popover text-popover-foreground shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            'origin-[--radix-popover-content-transform-origin]',
          )}
        >
          {/* Buscador */}
          <div className="flex items-center border-b px-3 py-2 gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={activeQuery}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Lista con scroll */}
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto overflow-x-hidden p-1"
          >
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !isSelected && handleSelect(option.value)}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                      isSelected
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">{option.description}</span>
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
