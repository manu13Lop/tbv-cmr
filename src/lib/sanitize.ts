import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    return DOMPurify.sanitize(dirty);
  }
  return DOMPurify.sanitize(dirty);
}
