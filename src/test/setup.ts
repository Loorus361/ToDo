import 'fake-indexeddb/auto';

// dexie-export-import referenziert `self` (Browser-Global)
if (typeof globalThis.self === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).self = globalThis;
}

// dexie-export-import nutzt FileReader zum Parsen von Blobs.
// Node.js hat kein FileReader — minimaler Polyfill für die benötigten Methoden.
if (typeof globalThis.FileReader === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).FileReader = class FileReader extends EventTarget {
    result: string | ArrayBuffer | null = null;
    error: Error | null = null;
    readyState = 0;
    onload: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;

    private _finish(blob: Promise<string | ArrayBuffer>) {
      blob.then((data) => {
        this.result = data;
        this.readyState = 2;
        const event = new Event('load');
        this.onload?.(event);
        this.dispatchEvent(event);
      }).catch((err) => {
        this.error = err;
        const event = new Event('error');
        this.onerror?.(event);
        this.dispatchEvent(event);
      });
    }

    readAsText(blob: Blob) {
      this._finish(blob.text());
    }

    readAsArrayBuffer(blob: Blob) {
      this._finish(blob.arrayBuffer());
    }
  };
}
