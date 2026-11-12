// A single reusable illustrated shelf face keeps the DVD aisle inexpensive to draw.
export function dvdShelf(section:string, offset:number) {
 const colors=['#254754','#994e42','#324b72','#d7a35e','#536652','#774963','#759291'];
 const titles=['MOON RUN','TIDE SONG','LAST LANTERN','WILD SIGNAL','SKY CIRCUIT'];
 const rows=Array.from({length:3},(_,row)=>{
  const top=52+row*74;
  const cases=Array.from({length:24},(_,i)=>{
   const x=14+i*15,seed=i*7+row*5+offset;
   const height=52+(seed%6), y=top+59-height;
   return `<g transform="translate(${x} ${y})"><rect width="13" height="${height}" rx="2" fill="${colors[(seed+i)%colors.length]}"/><path d="M2 2v${height-4}" stroke="#fff" opacity=".22"/><rect x="3" y="4" width="7" height="3" fill="#eee3bc"/><text transform="translate(5 11) rotate(90)" font-family="sans-serif" font-size="6" font-weight="bold" fill="#fff3d4">${titles[seed%5]}</text></g>`;
  }).join('');
  return cases+`<rect x="0" y="${top+59}" width="388" height="8" fill="#98673e"/><path d="M0 ${top+60}h388" stroke="#deb378"/>`;
 }).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="388" height="276" viewBox="0 0 388 276"><rect width="388" height="276" fill="#302e30"/><rect width="388" height="36" fill="#244d50"/><text x="194" y="25" fill="#ffe8af" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" letter-spacing="2">${section}</text>${rows}</svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
export const shelves=['ADVENTURE','STAFF PICKS','SCIENCE FICTION'].map(dvdShelf);
