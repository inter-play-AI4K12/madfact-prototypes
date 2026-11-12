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

// Original vector posters: each film has its own composition, typography and palette.
function film(id:string,name:string,art:string):IllustratedIdentity {
 return {id,name,image:svgImage(240,330,art)};
}
export const movies:IllustratedIdentity[] = [
 film('after-hours','After Hours',`
  <rect width="240" height="330" fill="#13181e"/>
  <path d="M109 0h73v330h-73z" fill="#e6e1d7"/>
  <path d="M116 0l-7 330h-7L109 0z" fill="#a7a49b"/>
  <g fill="#151a20"><path d="M0 147h49V65h30v126h30v139H0zM182 45h24v80h34v205h-58z"/>
  <path d="M141 156q13-1 15 12l3 36 16 66h-17l-14-46-3 48h-15l2-69-2-31q-1-12 15-16z"/><circle cx="141" cy="141" r="11"/></g>
  <path d="M130 272l-20 58h63l-22-58" fill="#151a20" opacity=".5"/>
  <text x="20" y="42" fill="#e5e1d7" font-family="Arial,sans-serif" font-size="9" letter-spacing="3">THE CITY NEVER TELLS.</text>
  <g fill="#ef5147" font-family="Arial Narrow,Arial,sans-serif" font-weight="900" font-size="53" letter-spacing="-3">
   <text x="17" y="108">AFTER</text><text x="17" y="154">HOURS</text>
  </g>
  <path d="M20 291h58" stroke="#ef5147" stroke-width="3"/>
  <text x="20" y="312" fill="#c2c4c1" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">A FILM BY LENA REED</text>
 `),
 film('peach-season','Peach Season',`
  <rect width="240" height="330" fill="#f8cfb3"/>
  <path d="M0 240Q62 193 125 228T240 218V330H0z" fill="#f26b49"/>
  <g transform="translate(129 168) rotate(-14)">
   <ellipse cx="-27" cy="8" rx="43" ry="49" fill="#e9503f"/><ellipse cx="25" cy="8" rx="43" ry="49" fill="#ff925a"/>
   <path d="M1-35Q-10-64 4-77" fill="none" stroke="#5e553a" stroke-width="7"/>
   <path d="M4-53q8-40 51-26Q43-43 4-53" fill="#387460"/>
   <path d="M-2-28Q-17 5 1 48" fill="none" stroke="#d84a37" stroke-width="2"/>
  </g>
  <text x="19" y="30" fill="#6e412f" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">A VERY ORDINARY SUMMER.</text>
  <text x="17" y="89" fill="#a93632" font-family="Georgia,serif" font-size="54" font-style="italic" letter-spacing="-3">Peach</text>
  <text x="20" y="271" fill="#fff4d9" font-family="Georgia,serif" font-size="45" font-style="italic" letter-spacing="-2">Season</text>
  <text x="21" y="310" fill="#722f27" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">SOME THINGS TAKE THEIR TIME.</text>
 `),
 film('the-long-way-home','The Long Way Home',`
  <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#d7e1da"/><stop offset="1" stop-color="#f0ddbe"/></linearGradient></defs>
  <rect width="240" height="330" fill="#eee9dc"/>
  <rect x="14" y="58" width="212" height="207" fill="url(#sky)"/>
  <path d="M14 154l40-22 28 9 54-39 40 28 50-17v152H14z" fill="#839889"/>
  <path d="M14 195l37-25 46 18 40-30 41 22 48-27v112H14z" fill="#4e7063"/>
  <path d="M14 227q54-50 112-7t100-15v60H14z" fill="#294b41"/>
  <path d="M144 173q-20 24 1 41t-2 51h-34q51-39 22-54t13-38" fill="#d5c5a1"/>
  <path d="M125 257l8-16" stroke="#f8ebc9" stroke-width="2"/>
  <rect x="125" y="225" width="8" height="12" rx="2" fill="#c5533d"/>
  <text x="120" y="29" text-anchor="middle" fill="#566452" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">THERE IS NO SHORTCUT.</text>
  <text x="120" y="288" text-anchor="middle" fill="#293f34" font-family="Georgia,serif" font-size="17">The Long Way Home</text>
  <text x="120" y="311" text-anchor="middle" fill="#667263" font-family="Arial,sans-serif" font-size="7" letter-spacing="2">A FILM BY EMI PARK</text>
 `),
 film('ninety-nine-seconds','99 Seconds',`
  <rect width="240" height="330" fill="#f55b27"/>
  <path d="M0 183L240 47v52L0 235z" fill="#171f24"/>
  <path d="M0 253L240 117v6L0 260zm0 20L240 137v3L0 276z" fill="#ffd8aa"/>
  <text x="15" y="29" fill="#1b2326" font-family="Arial,sans-serif" font-size="9" font-weight="700" letter-spacing="3">EVERY SECOND COUNTS.</text>
  <text x="6" y="190" fill="#f7eddc" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="155" letter-spacing="-16">99</text>
  <text x="15" y="235" fill="#f7eddc" font-family="Arial,sans-serif" font-size="30" font-weight="900" letter-spacing="1">SECONDS</text>
  <g fill="#172125"><path d="M96 265l17-15h50l23 15h8v14H87v-14z"/><circle cx="111" cy="280" r="9"/><circle cx="171" cy="280" r="9"/></g>
  <path d="M38 272h39m-21-8h25" stroke="#172125" stroke-width="3"/>
  <text x="15" y="315" fill="#172125" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">NO PAUSE. NO SECOND TAKE.</text>
 `),
 film('a-small-miracle','A Small Miracle',`
  <rect width="240" height="330" fill="#e6dfc6"/>
  <path d="M196 0h44v330h-44z" fill="#6f7b54"/>
  <text x="222" y="300" transform="rotate(-90 222 300)" fill="#eee8d1" font-family="Arial,sans-serif" font-size="10" letter-spacing="4">A FILM BY ALEX RIVERS</text>
  <g fill="none" stroke="#45684b" stroke-width="3"><path d="M93 293q40-74 9-156M108 238q-44-5-54-34 41-1 54 34M111 209q37-6 47-36-39 4-47 36M109 174q-31-1-39-24 31-4 39 24"/></g>
  <g fill="#b07459"><ellipse cx="102" cy="119" rx="12" ry="27"/><ellipse cx="102" cy="119" rx="12" ry="27" transform="rotate(60 102 119)"/><ellipse cx="102" cy="119" rx="12" ry="27" transform="rotate(120 102 119)"/></g><circle cx="102" cy="119" r="10" fill="#e6b254"/>
  <g fill="#354b37" font-family="Georgia,serif" font-weight="400"><text x="18" y="40" font-size="20">A Small</text><text x="18" y="70" font-size="32" font-style="italic">Miracle</text></g>
  <text x="18" y="315" fill="#5c6750" font-family="Arial,sans-serif" font-size="7" letter-spacing="1.5">LOOK A LITTLE CLOSER.</text>
 `),
];
