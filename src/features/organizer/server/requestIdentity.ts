// Liest ausschließlich die von Sites verifizierte Nutzeridentität aus Request-Headern
export interface RequestIdentity {
  ownerId: string;
  displayName: string;
  email: string;
}

export function readRequestIdentity(request: Request, allowLocalDevelopment = false): RequestIdentity | null {
  const ownerId = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const encoding = request.headers.get('oai-authenticated-user-full-name-encoding');

  if (ownerId && email) {
    let displayName = email;
    if (encodedName && encoding === 'percent-encoded-utf-8') {
      try { displayName = decodeURIComponent(encodedName); } catch { displayName = email; }
    }
    return { ownerId, email, displayName };
  }

  const hostname = new URL(request.url).hostname;
  if (allowLocalDevelopment && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return { ownerId: 'local-development-user', email: 'lokal@entwicklung', displayName: 'Lokale Vorschau' };
  }
  return null;
}
