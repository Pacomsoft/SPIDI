'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useGlobalLoading } from '@/modules/shared/application/hooks/use-global-loading.hook';

/**
 * Escucha cambios de ruta (pathname) y activa el overlay de carga global
 * inmediatamente al hacer click en el menú, antes de que el nuevo segmento
 * termine de cargar. Se oculta automáticamente cuando el nuevo pathname
 * ya está montado (el efecto de "llegada" limpia el estado).
 *
 * Debe renderizarse dentro de GlobalLoadingProvider y dentro del layout
 * que contiene el sidebar (/adm/layout.tsx).
 */
export function NavigationLoadingWatcher() {
  const pathname = usePathname();
  const { showLoading, hideLoading } = useGlobalLoading();
  const prevPathname = useRef<string>(pathname);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cuando el pathname cambia significa que la nueva ruta ya terminó de montar
    // → ocultar el overlay (con un pequeño delay para evitar flash en rutas rápidas)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Delay mínimo de 150ms para que el usuario perciba el feedback
      // aunque la ruta cargue muy rápido (evita un flash imperceptible)
      hideTimeoutRef.current = setTimeout(() => {
        hideLoading();
      }, 150);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
