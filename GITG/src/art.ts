// Original portrait and poster illustrations. Embedded URLs also work in off-screen canvases.
export type IllustratedIdentity = { id: string; name: string; image: string };

function svgImage(width: number, height: number, artwork: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${artwork}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

type Portrait = {
  name: string;
  skin: string;
  blush: string;
  ink: string;
  background: string;
  shirt: string;
  hairBack: string;
  hairFront: string;
  accessories?: string;
  collar: string;
};

function portrait(p: Portrait): IllustratedIdentity {
  const artwork = `
    <rect width="144" height="144" rx="14" fill="${p.background}"/>
    <circle cx="73" cy="64" r="55" fill="#fff" opacity=".19"/>
    <path d="M8 32h10m-5-5v10m110 46h10m-5-5v10M15 104l4-6 3 6-3 5z" stroke="#fff" opacity=".67" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g fill="${p.ink}">${p.hairBack}</g>
    <path d="M13 151c1-22 13-37 32-41l15-4h25l16 4c20 5 30 18 32 41z" fill="${p.shirt}"/>
    <path d="M60 92v15q1 11 12 13 13-3 14-13V92" fill="${p.skin}"/>
    <path d="M60 94q12 12 26 1v5q-12 11-26 2" fill="${p.blush}" opacity=".8"/>
    <g fill="${p.skin}"><ellipse cx="40" cy="70" rx="6" ry="9"/><ellipse cx="104" cy="70" rx="6" ry="9"/><path d="M41 59c0-21 12-34 31-34s32 13 32 34l-2 21c-3 17-18 27-30 27S44 94 42 80z"/></g>
    <g fill="${p.ink}">${p.hairFront}</g>
    <g fill="none" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"><path d="M49 64q5-4 11-2m22 0q6-2 11 2"/></g>
    <g fill="${p.ink}"><ellipse cx="56" cy="72" rx="3.2" ry="4"/><ellipse cx="88" cy="72" rx="3.2" ry="4"/></g>
    <g fill="${p.blush}" opacity=".75"><ellipse cx="51" cy="81" rx="6" ry="2.5"/><ellipse cx="93" cy="81" rx="6" ry="2.5"/></g>
    <path d="M72 75l-2 7 4 1" fill="none" stroke="${p.blush}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M64 88q8 6 16 0" fill="none" stroke="${p.ink}" stroke-width="2.6" stroke-linecap="round"/>
    ${p.collar}
    ${p.accessories || ''}
  `;
  return { id: p.name.toLowerCase(), name: p.name, image: svgImage(144, 144, artwork) };
}

export const people: IllustratedIdentity[] = [
  portrait({
    name: 'Maya', skin: '#bd7652', blush: '#a35342', ink: '#352136', background: '#f6be7e', shirt: '#127b79',
    hairBack: '<path d="M37 67q-7-36 16-45 34-15 51 15 7 13 2 35l-5 18-4-31-48 5-9 24z"/><circle cx="91" cy="26" r="19"/><circle cx="105" cy="28" r="13"/>',
    hairFront: '<path d="M39 69q-6-33 20-41 31-10 44 24l-1 17-8-14q-9-3-16-16-8 14-23 17l-9 2-4 11z"/>',
    collar: '<path d="M50 109l11-4q3 12 11 15l-11 8zm44 0l-8-4q-5 14-14 15l12 8z" fill="#a4e6c2"/><path d="M72 121v24" stroke="#075a5b" stroke-width="3"/>',
    accessories: '<path d="M94 30q8 2 12 9m-16-6q9 4 12 10" fill="none" stroke="#f4d277" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="78" r="3" fill="#ffe395"/><circle cx="104" cy="78" r="3" fill="#ffe395"/>',
  }),
  portrait({
    name: 'Leo', skin: '#ebb68d', blush: '#c8846f', ink: '#503338', background: '#98cfe2', shirt: '#bf523e',
    hairBack: '<path d="M38 71q-9-38 12-47 30-16 52 8 10 12 3 41l-7-16-49-1-8 19z"/>',
    hairFront: '<path d="M38 68q-7-14 0-28l-8-5 15-2-4-10 17 4q12-16 34-9l-5 6q12 2 20 10l-7 2q8 12 3 26l-6-11q-3-8-6-10-2 10-14 17l1-10q-10 11-27 12l4-8-10 6z"/>',
    collar: '<path d="M51 109q20 25 42 0" stroke="#ffe6af" fill="none" stroke-width="5"/><path d="M19 136h105m-110 8h116" fill="none" stroke="#ffe2a3" stroke-width="4"/>',
    accessories: '<g fill="none" stroke="#293e54" stroke-width="3.5"><rect x="44" y="65" width="23" height="16" rx="7"/><rect x="77" y="65" width="23" height="16" rx="7"/><path d="M67 70q5-3 10 0"/></g>',
  }),
  portrait({
    name: 'Nia', skin: '#855139', blush: '#71392f', ink: '#292334', background: '#dfb8db', shirt: '#473d80',
    hairBack: '<circle cx="44" cy="33" r="22"/><circle cx="99" cy="31" r="23"/><path d="M37 69q-12-47 32-51 46-2 37 51l-10 6-2-31-47 4-7 26z"/>',
    hairFront: '<path d="M37 70q-5-39 25-46 36-8 43 30v16l-7-9q-4-15-17-21-7 10-25 14l5-7q-14 5-20 20z"/>',
    collar: '<path d="M47 110l11-3 14 16-11 10zm50 0l-11-3-14 16 11 10z" fill="#ffb875"/><path d="M72 125v20" stroke="#eaaa72" stroke-width="3"/>',
    accessories: '<g fill="none" stroke="#f3cc69" stroke-width="3"><circle cx="39" cy="82" r="5"/><circle cx="105" cy="82" r="5"/><path d="M40 52l12-8m-10 13 12-8" stroke="#efab69" stroke-linecap="round"/></g>',
  }),
  portrait({
    name: 'Sami', skin: '#be8765', blush: '#a6634f', ink: '#332d3c', background: '#b8d8a0', shirt: '#245981',
    hairBack: '<path d="M38 70q-8-30 9-42 26-16 49 0 17 12 9 43l-8-14-49-1-7 17z"/>',
    hairFront: '<path d="M38 69q-8-12-2-23 0-11 11-15 4-12 17-11 10-9 22-2 12-1 16 9 13 5 11 17-1 8-8 13l-5 11-4-19q-9 7-18 1-13 9-20 1-8 7-13 4l-4 15z"/>',
    collar: '<path d="M53 107l19 13 19-13 9 4-28 25-28-25z" fill="#417aa1"/><path d="M62 122v12m20-12v12" stroke="#ffd9aa" stroke-width="3" stroke-linecap="round"/>',
    accessories: '<path d="M49 80h1m5 2h1m32-2h1m5 2h1" stroke="#825340" stroke-width="2.4" stroke-linecap="round"/>',
  }),
  portrait({
    name: 'June', skin: '#eac49a', blush: '#ce917a', ink: '#332b3b', background: '#f1cc91', shirt: '#b54b69',
    hairBack: '<path d="M38 98q-12-30-1-56 8-23 34-24 29-1 37 24 8 30-1 57l-17-2-39 1z"/>',
    hairFront: '<path d="M38 72q-6-44 26-48 39-6 42 39l-4 16-6-26q-12 0-19-12l1 13q-12-2-17-12l-2 12-12 1-6 24z"/>',
    collar: '<path d="M53 107q4 20 19 13 13 8 20-13l7 3q-3 20-15 18l-12-5-9 5q-14 4-17-18z" fill="#ffead2"/><circle cx="72" cy="134" r="2" fill="#f6bda7"/>',
    accessories: '<path d="M91 45l10 4m-11 0 10 4" stroke="#78dbcc" stroke-width="3.2" stroke-linecap="round"/>',
  }),
];

function poster(id: string, name: string, art: string, colors: [string, string], lines: string[]): IllustratedIdentity {
  const title = lines.map((line, i) => `<text x="80" y="${165 + i * 16}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="17" letter-spacing="1" fill="${colors[1]}">${line}</text>`).join('');
  return {
    id, name,
    image: svgImage(160, 198, `
      <rect width="160" height="198" fill="${colors[0]}"/>
      ${art}
      <rect x="5" y="5" width="150" height="188" rx="2" stroke="${colors[1]}" fill="none" opacity=".6"/>
      ${title}
    `),
  };
}

export const movies: IllustratedIdentity[] = [
  poster('moon-run', 'Moon Run', `
    <circle cx="108" cy="48" r="30" fill="#f8c87e"/><g fill="#ffe0ac"><circle cx="23" cy="40" r="2"/><circle cx="45" cy="23" r="1.5"/><circle cx="130" cy="94" r="2"/><circle cx="68" cy="67" r="1.5"/><path d="M121 20l2 5 5 2-5 1-2 5-1-5-4-1 4-2z"/></g>
    <g transform="rotate(36 74 88)"><path d="M64 111l10 29 10-29z" fill="#fa815b"/><path d="M70 110l4 21 5-21z" fill="#ffdb84"/><path d="M67 82l-12 19v15l13-10m13-24 13 19v15l-14-10" fill="#ea6d63"/><path d="M65 110q-8-36 9-58 18 21 9 58z" fill="#f3e5c1"/><circle cx="74" cy="81" r="6" fill="#334864" stroke="#e18160" stroke-width="3"/></g>
    <path d="M6 139q38-10 71 0 39 11 77-13v20H6z" fill="#656486"/><path d="M6 145q45-17 86-2 31 9 62-10v15H6z" fill="#473e65"/>
  `, ['#292644', '#ffe5b7'], ['MOON', 'RUN']),
  poster('tide-song', 'Tide Song', `
    <circle cx="101" cy="52" r="33" fill="#f7bc7b"/><circle cx="101" cy="52" r="25" fill="none" stroke="#ffe0a1" stroke-width="2"/>
    <path d="M5 107q23-49 54-38 21 7 22 22-10-10-24-6-16 6-14 18 3 18 22 21 39 5 88-27v48H5z" fill="#56b6ae"/><path d="M5 107q28-44 54-35 12 3 18 13-20-12-35 2-19 17-2 32-23-4-35 8z" fill="#d3f1d2"/>
    <path d="M5 135q29-16 55-7 29 9 55-5 20-10 40-25v47H5z" fill="#258788"/><path d="M6 139q34-14 56-6 35 10 74-12" fill="none" stroke="#8dd4c0" stroke-width="2"/>
    <g stroke="#254c62" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M30 40q7-5 13 2 4-7 11-6m46 36q5-4 10 1 3-5 8-4"/></g>
  `, ['#184c62', '#fff1cc'], ['TIDE', 'SONG']),
  poster('wild-signal', 'Wild Signal', `
    <circle cx="81" cy="63" r="39" fill="#dfaa5b"/><path d="M5 113l33-54 19 32 21-36 31 49 15-22 31 47v17H5z" fill="#86a071"/>
    <path d="M6 132l24-38 19 25 26-32 20 22 23-33 36 49v20H6z" fill="#46766a"/>
    <path d="M5 139l22-11 30 9 37-13 28 5 33-11v28H5z" fill="#285852"/>
    <g stroke="#f7d295" fill="none" stroke-width="2.8" stroke-linecap="round"><path d="M83 113V68m-9 45 9-32 9 32m-17-10h15"/><path d="M75 63q8-8 16 0m-21-6q13-13 26 0m-32-7q19-17 38 0"/></g>
    <g fill="#1c413e"><path d="M15 123l10-22 10 22h-6l9 13H12l9-13zM118 118l7-16 8 16h-5l7 10h-20l7-10z"/></g>
  `, ['#223e39', '#ffe2a5'], ['WILD', 'SIGNAL']),
  poster('sky-circuit', 'Sky Circuit', `
    <circle cx="115" cy="45" r="23" fill="#ffa674"/><g fill="none" stroke="#a9dbed" opacity=".8" stroke-width="2"><path d="M6 36h50m-21 6h44m22 47h49M9 100h31"/></g>
    <path d="M6 118l29-17 20 12 29-25 33 25 37-22v52H6z" fill="#73699a"/>
    <path d="M6 132q40-43 82-7 40 33 66-16v19q-30 32-63 14-42-29-85 3z" fill="#de916f"/><path d="M8 138q43-36 82-6 38 28 62-10" fill="none" stroke="#ffe1af" stroke-width="2" stroke-dasharray="7 6"/>
    <g transform="translate(77 75) rotate(-17)"><path d="M-36 2l18-1 13-19 8-1-4 19 20 1 11-7 7 1-9 12-21 3-10 13-6-1 3-14-23-1z" fill="#fff0c8"/><path d="M-35 3l25 4 24-2-14 6-25-1z" fill="#e96465"/></g>
  `, ['#3c446f', '#ffebbd'], ['SKY', 'CIRCUIT']),
  poster('last-lantern', 'Last Lantern', `
    <circle cx="80" cy="78" r="50" fill="#483c51"/><circle cx="80" cy="78" r="36" fill="#79534f"/><g fill="#e6bd7e"><circle cx="30" cy="49" r="2"/><circle cx="130" cy="30" r="1.8"/><circle cx="135" cy="99" r="2"/><circle cx="40" cy="114" r="1.5"/></g>
    <path d="M80 15v22m-8 10v-6a8 8 0 0116 0v6" stroke="#f5c781" stroke-width="3" fill="none"/>
    <path d="M64 49l8-5h16l8 5 7 9H57z" fill="#d39360"/><path d="M60 58h40l-4 37-10 8H74l-11-8z" fill="#f9c776" stroke="#9e694d" stroke-width="3"/><path d="M77 62l-1 32m10-32 1 32" stroke="#efae68" stroke-width="2"/><path d="M80 72q7 9 5 18-3 8-9 2-3-5 4-20z" fill="#fff0ab"/><path d="M65 97h30l-6 9H72z" fill="#ce945e"/>
    <g fill="#29293c"><path d="M7 25l16 28-6-1 16 28-8-2 15 27-11-1 20 29-29-2v14H5zM154 47l-13 23 6-2-14 26 7-2-17 23 12-2-21 23h27v10h14z"/></g>
  `, ['#282940', '#ffdda3'], ['LAST', 'LANTERN']),
];
