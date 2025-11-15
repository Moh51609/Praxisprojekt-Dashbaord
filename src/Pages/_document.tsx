import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* 💡 Sofortiger Fallback-Style für den allerersten Paint */}
        <style id="accent-inline">{`
          html {
            --primary: 99 102 241; /* Indigo (Standard) */
            --ring: 99 102 241;
          }
        `}</style>

        {/* 💡 Mini-Script: Setzt Accent + Theme VOR erstem Paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Accentfarbe aus localStorage lesen
                  const accent = localStorage.getItem('accent-color') || 'indigo';
                  const theme = localStorage.getItem('theme');

                  // RGB-Werte entsprechend Accent
                  let rgb = '99 102 241'; // Indigo (Fallback)
                  if (accent === 'emerald') rgb = '16 185 129';
                  if (accent === 'rose') rgb = '244 63 94';
                  if (accent === 'amber') rgb = '245 158 11';

                  // Direkt auf HTML anwenden
                  document.documentElement.setAttribute('data-accent', accent);
                  document.documentElement.style.setProperty('--primary', rgb);
                  document.documentElement.style.setProperty('--ring', rgb);

                  // Dark Mode anwenden, bevor gerendert wird
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Accent-Init Error:', e);
                }
              })();
            `,
          }}
        />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
