// Shared page shape for navigation (design D1/D6). Lives outside the vault
// modules so components can type their props without depending on them; the
// index (src/vault/index.ts) extends this with resolved links.

// `path` is the vault-relative identity (ADR-0013 form); `title` is the
// filename stem; `kind` splits pages from journal entries.

export type Page = {
  path: string
  title: string
  kind: 'page' | 'journal'
  content: string
}