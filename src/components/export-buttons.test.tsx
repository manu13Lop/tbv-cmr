// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportCSVButton } from './export-csv-button';
import { ExportPDFButton } from './export-pdf-button';

vi.mock('@/lib/export-csv', () => ({
  exportToCSV: vi.fn(),
}));

describe('ExportCSVButton', () => {
  it('renders with default label', () => {
    render(<ExportCSVButton filename="test" headers={['Name']} rows={[['Ana']]} />);
    expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <ExportCSVButton filename="test" headers={['Name']} rows={[['Ana']]} label="Descargar" />
    );
    expect(screen.getByText('Descargar')).toBeInTheDocument();
  });

  it('calls exportToCSV on click', async () => {
    const { exportToCSV } = await import('@/lib/export-csv');
    const user = userEvent.setup();
    render(<ExportCSVButton filename="test" headers={['Name']} rows={[['Ana']]} />);
    await user.click(screen.getByText('Exportar CSV'));
    expect(exportToCSV).toHaveBeenCalledWith('test', ['Name'], [['Ana']]);
  });
});

describe('ExportPDFButton', () => {
  it('renders with default label', () => {
    render(
      <ExportPDFButton
        filename="test"
        title="Report"
        columns={[{ header: 'Name', key: 'name' }]}
        rows={[{ name: 'Ana' }]}
      />
    );
    expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <ExportPDFButton
        filename="test"
        title="Report"
        columns={[{ header: 'Name', key: 'name' }]}
        rows={[{ name: 'Ana' }]}
        label="Guardar PDF"
      />
    );
    expect(screen.getByText('Guardar PDF')).toBeInTheDocument();
  });
});
