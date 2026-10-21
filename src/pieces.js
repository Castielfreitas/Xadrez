// Original vector silhouettes for Arena. Scalable independently of platform fonts.
const shapes={
 p:'<circle cx="24" cy="12" r="6.5"/><path d="M19 18c1 5 1 8-2 12l-5 7h24l-5-7c-3-4-3-7-2-12z"/><path d="M12 37h24l2 5H10z"/>',
 r:'<path d="M10 6h7v6h4V6h6v6h4V6h7v13l-5 4 1 13H14l1-13-5-4z"/><path d="M14 19h20M15 24h18M12 36h24l3 6H9z"/>',
 n:'<path d="M13 35c0-9 6-11 12-17l-9 4-5-5L21 7l1-4 6 4c9 1 12 9 10 20l-3 9H13z"/><path d="m20 10 8 2M14 17l4 1M26 22c5-4 6-7 5-10" fill="none"/><circle cx="24" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M12 36h24l3 6H9z"/>',
 b:'<path d="M24 5c-5 6-12 12-10 18 1 4 5 6 10 6s9-2 10-6C36 17 29 11 24 5z"/><path d="m26 12-6 9" fill="none"/><path d="M20 29v5h8v-5M16 34h16l5 8H11z"/><circle cx="24" cy="4" r="2"/>',
 q:'<path d="m9 16 6 18h18l6-18-10 10-5-17-5 17z"/><circle cx="8" cy="13" r="3"/><circle cx="16" cy="11" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="32" cy="11" r="3"/><circle cx="40" cy="13" r="3"/><path d="M15 34h18l2 4H13zM12 38h24l2 4H10z"/>',
 k:'<path d="M21 3h6v5h5v5h-5v6h-6v-6h-5V8h5z"/><path d="M24 21c-8-10-18-3-15 5l8 10h14l8-10c3-8-7-15-15-5z"/><path d="M24 21v14" fill="none"/><path d="M16 35h16l3 4H13zM12 39h24l2 4H10z"/>'
};
export function pieceSVG(p){const white=p.color==='w',fill=white?'#faf7ed':'#55565b',stroke=white?'#494a50':'#202126';return `<svg class="chess-piece-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g fill="${fill}" stroke="${stroke}" color="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${shapes[p.type]||''}<path d="M14 40h20" fill="none" stroke="${white?'#d6d2c8':'#77787e'}" stroke-width="1.2"/></g></svg>`;}
