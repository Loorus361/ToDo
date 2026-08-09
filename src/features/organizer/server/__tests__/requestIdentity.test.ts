// Tests für die vertrauenswürdige Sites-Identität und den lokalen Entwicklungsfall
import { describe, expect, it } from 'vitest';
import { readRequestIdentity } from '../requestIdentity';

describe('readRequestIdentity', () => {
  it('verwendet die verifizierte Nutzer-ID als Eigentümer', () => {
    const request = new Request('https://private.example/api', { headers: {
      'oai-authenticated-user-id': 'stable-user-id',
      'oai-authenticated-user-email': 'carlos@example.test',
      'oai-authenticated-user-full-name': 'Carlos%20Anderssohn',
      'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
    } });
    expect(readRequestIdentity(request)).toEqual({ ownerId: 'stable-user-id', email: 'carlos@example.test', displayName: 'Carlos Anderssohn' });
  });

  it('weist nicht authentifizierte Produktionsaufrufe ab', () => {
    expect(readRequestIdentity(new Request('https://private.example/api'))).toBeNull();
  });

  it('erlaubt die lokale Ersatzidentität nur nach expliziter Freigabe', () => {
    const request = new Request('http://localhost:3000/api');
    expect(readRequestIdentity(request)).toBeNull();
    expect(readRequestIdentity(request, true)?.ownerId).toBe('local-development-user');
  });
});
