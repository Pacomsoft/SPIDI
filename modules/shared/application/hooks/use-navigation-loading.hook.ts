'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalLoading } from '@/modules/shared/application/hooks/use-global-loading.hook';

/**
 * Retorna:
 * - handleNavClick: onClick para ítems del sidebar (activa loading antes de navegar con <Link>)
 * - navigateTo: reemplaza router.push — activa loading y luego navega programáticamente.
 *   Usar en tablas, botones y cualquier navegación imperativa.
 *
 * El NavigationLoadingWatcher oculta el overlay cuando el nuevo pathname está montado.
 */
export function useNavigationLoading() {
  const pathname = usePathname();
  const router = useRouter();
  const { showLoading } = useGlobalLoading();

  const normalize = (url: string) => url.split('?')[0].replace(/\/$/, '');

  const isSameRoute = useCallback(
    (targetUrl: string) => {
      const current = normalize(pathname ?? '');
      const target = normalize(targetUrl);
      return current === target || current.startsWith(target + '/');
    },
    [pathname],
  );

  /** Para ítems <Link> del sidebar — activa loading antes de que Next navegue */
  const handleNavClick = useCallback(
    (targetUrl: string) => {
      if (!isSameRoute(targetUrl)) {
        showLoading();
      }
    },
    [isSameRoute, showLoading],
  );

  /** Para router.push programático — activa loading + navega */
  const navigateTo = useCallback(
    (targetUrl: string) => {
      if (!isSameRoute(targetUrl)) {
        showLoading();
      }
      router.push(targetUrl);
    },
    [isSameRoute, showLoading, router],
  );

  /** Para router.back() — activa loading y regresa a la página anterior */
  const navigateBack = useCallback(
    (fallbackUrl: string) => {
      showLoading();
      // Si hay historial de navegación, ir atrás; si no, ir al fallback
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
    },
    [showLoading, router],
  );

  return { handleNavClick, navigateTo, navigateBack };
}
