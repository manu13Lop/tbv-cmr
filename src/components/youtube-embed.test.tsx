// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YoutubeEmbed } from './youtube-embed';

describe('YoutubeEmbed', () => {
  it('renders iframe for youtube.com URL with v param', () => {
    render(<YoutubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    const iframe = screen.getByTitle('YouTube video player');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('renders iframe for youtu.be short URL', () => {
    render(<YoutubeEmbed url="https://youtu.be/dQw4w9WgXcQ" />);
    const iframe = screen.getByTitle('YouTube video player');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('returns null for invalid URL', () => {
    const { container } = render(<YoutubeEmbed url="not-a-url" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for non-youtube URL', () => {
    const { container } = render(<YoutubeEmbed url="https://vimeo.com/12345" />);
    expect(container.innerHTML).toBe('');
  });
});
