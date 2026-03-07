export const CONTENT_TYPE_META = {
  'text/html': { label: 'HTML', color: 'primary' },
  'application/json': { label: 'JSON', color: 'secondary' },
  'text/plain': { label: 'Text', color: 'success' },
  'application/xml': { label: 'XML', color: 'info' },
  'application/javascript': { label: 'JS', color: 'warning' },
  'application/x-httpd-php': { label: 'PHP', color: 'error' },
};

export function getCtMeta(contentType) {
  return CONTENT_TYPE_META[contentType] || { label: 'Custom', color: 'default' };
}
