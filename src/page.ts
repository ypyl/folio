// Shared page shape for the static-navigation step. Lives outside the mock
// module so components can type their props without depending on it; the
// real vault page type slots in here behind the same name later.

export type Page = {
  title: string
  kind: 'page' | 'journal'
  content: string
}