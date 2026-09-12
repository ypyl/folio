// The running build's version (add-version-badge), read from `package.json` at
// build time. A static import rather than a runtime fetch: Vite and vitest
// resolve it the same way, and only the imported field is bundled.

import { version } from '../package.json'

export const APP_VERSION = version
