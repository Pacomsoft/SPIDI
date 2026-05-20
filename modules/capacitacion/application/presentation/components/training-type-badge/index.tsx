'use client';

import type { TrainingType } from '@/modules/capacitacion/domain/contracts/training.dto';

interface ITrainingTypeBadgeProps {
  type: TrainingType;
}

const LABELS: Record<TrainingType, string> = {
  Mandatory:     'Obligatorio',
  Optional:      'Opcional',
  CompanyPolicy: 'Política de empresa',
};

// Paleta específica para columna "Tipo" en Capacitación.
// Estilos inline para evitar colisión con las clases badge-* globales
// (que también usan otros módulos con semántica distinta).
const STYLES: Record<TrainingType, React.CSSProperties> = {
  Optional: {
    // Amber: border amber-300, bg amber-100
    borderColor: 'oklch(0.879 0.169 91.605)',   // #FFD230
    backgroundColor: 'oklch(0.962 0.059 95.617)', // #FEF3C6
    color: 'oklch(0.2405 0.012 84.56)',           // #221f19 — texto oscuro unificado
  },
  CompanyPolicy: {
    // Azul chart-3 / chart-5
    borderColor: 'oklch(71.98% 0.0907 227.557)',  // #62B0D1
    backgroundColor: 'oklch(94.8% 0.0188 222.164)', // #E1F1F7
    color: 'oklch(0.2405 0.012 84.56)',
  },
  Mandatory: {
    // Rosa-rojo suave (NO el rojo de botones)
    borderColor: 'oklch(0.6813 0.1223 13.71)',    // #D97782
    backgroundColor: 'oklch(0.9358 0.0222 7.19)', // #F8E4E7
    color: 'oklch(0.2405 0.012 84.56)',
  },
};

export function TrainingTypeBadge({ type }: ITrainingTypeBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
      style={STYLES[type]}
    >
      {LABELS[type]}
    </span>
  );
}
