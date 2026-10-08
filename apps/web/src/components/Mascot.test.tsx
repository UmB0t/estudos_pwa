import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Mascot } from './Mascot';

describe('Mascot Component', () => {
  it('renders default idle state correctly', () => {
    const html = renderToStaticMarkup(<Mascot emotion="idle" />);
    expect(html).toContain('Veti');
    expect(html).toContain('Pronto para os estudos!');
    expect(html).toContain('emotion-idle');
  });

  it('renders thinking state correctly', () => {
    const html = renderToStaticMarkup(<Mascot emotion="thinking" />);
    expect(html).toContain('analisando sua consulta');
    expect(html).toContain('emotion-thinking');
    expect(html).toContain('antenna-pulse');
  });

  it('renders celebrating state correctly', () => {
    const html = renderToStaticMarkup(<Mascot emotion="celebrating" />);
    expect(html).toContain('Mandou bem demais!');
    expect(html).toContain('emotion-celebrating');
  });

  it('renders disapproval state correctly', () => {
    const html = renderToStaticMarkup(<Mascot emotion="disapproval" />);
    expect(html).toContain('Ops! Algo não saiu como esperado');
    expect(html).toContain('emotion-disapproval');
  });

  it('renders custom message when provided', () => {
    const html = renderToStaticMarkup(<Mascot emotion="idle" customMessage="Mensagem customizada do tutor!" />);
    expect(html).toContain('Mensagem customizada do tutor!');
  });
});
