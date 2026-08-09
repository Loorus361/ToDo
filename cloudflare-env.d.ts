// Ergänzt die typisierte D1-Bindung der privaten Sites-Laufzeit
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}
