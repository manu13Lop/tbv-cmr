// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('renders the progress bar with width', () => {
    const { container } = render(<ProgressBar porcentaje={50} />);
    const bar = container.querySelector('.rounded-full.bg-primary');
    expect(bar).toBeInTheDocument();
    expect(bar?.getAttribute('style')).toContain('50%');
  });

  it('clamps percentage to 100', () => {
    const { container } = render(<ProgressBar porcentaje={150} />);
    const bar = container.querySelector('.rounded-full.bg-primary');
    expect(bar?.getAttribute('style')).toContain('100%');
  });

  it('clamps negative to 0', () => {
    const { container } = render(<ProgressBar porcentaje={-10} />);
    const bar = container.querySelector('.rounded-full.bg-primary');
    expect(bar?.getAttribute('style')).toContain('0%');
  });

  it('shows label and percentage text', () => {
    render(<ProgressBar porcentaje={75} label="Progreso" />);
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides label when not provided', () => {
    render(<ProgressBar porcentaje={50} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});
