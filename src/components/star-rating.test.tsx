// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating ejercicioId="e1" />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('shows count when totalValoraciones > 0', () => {
    render(<StarRating ejercicioId="e1" totalValoraciones={3} />);
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('does not show count when totalValoraciones is 0', () => {
    render(<StarRating ejercicioId="e1" totalValoraciones={0} />);
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('calls valorarAction on star click', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<StarRating ejercicioId="e1" valorarAction={action} />);
    const stars = screen.getAllByRole('button');
    await user.click(stars[2]);
    expect(action).toHaveBeenCalledWith('e1', 3);
  });

  it('disables stars when no valorarAction provided', () => {
    render(<StarRating ejercicioId="e1" />);
    const stars = screen.getAllByRole('button');
    stars.forEach((star) => {
      expect(star).toBeDisabled();
    });
  });

  it('applies aria-label to each star', () => {
    render(<StarRating ejercicioId="e1" />);
    expect(screen.getByLabelText('1 estrella')).toBeInTheDocument();
    expect(screen.getByLabelText('2 estrellas')).toBeInTheDocument();
    expect(screen.getByLabelText('3 estrellas')).toBeInTheDocument();
    expect(screen.getByLabelText('4 estrellas')).toBeInTheDocument();
    expect(screen.getByLabelText('5 estrellas')).toBeInTheDocument();
  });
});
