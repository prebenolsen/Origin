// Self-hosted fonts (bundled + precached by the service worker) so the app's
// typography works fully offline with no dependency on the Google Fonts CDN.
//
// Inter (UI / --font-sans): latin subset covers English, Spanish and Norwegian
// (æ ø å ¿ ¡ all live in U+0000-00FF). Weights match the design tokens.
// Fraunces Variable (display / --font-serif): the optical-size axis build,
// normal + italic. See src/index.css (@theme --font-sans / --font-serif).
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
