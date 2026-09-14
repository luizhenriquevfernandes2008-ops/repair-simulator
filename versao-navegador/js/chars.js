// Gerador de personagens estilo visual novel (SVG desenhado por código)
// viewBox 0 0 600 900 — busto até a cintura, como sprites de VN.
(function () {
  const OL = '#3d2630'; // cor do contorno

  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  let uid = 0;

  // ---------- CABELO (parte de trás) ----------
  function backHair(s, c, d) {
    const st = `fill="${c}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"`;
    switch (s) {
      case 'long':
        return `<path ${st} d="M196,190 C160,300 150,470 158,650 C200,690 400,690 442,650 C450,470 440,300 404,190 Z"/>
                <path fill="${d}" opacity=".55" d="M205,330 C195,450 192,560 200,650 C240,672 360,672 400,650 C408,560 405,450 395,330 C360,380 240,380 205,330Z"/>`;
      case 'verylong':
        return `<path ${st} d="M196,190 C150,320 140,560 150,900 L450,900 C460,560 450,320 404,190 Z"/>
                <path fill="${d}" opacity=".5" d="M210,340 C196,520 196,700 205,900 L395,900 C404,700 404,520 390,340 C360,390 240,390 210,340Z"/>`;
      case 'bob':
        return `<path ${st} d="M192,200 C176,280 180,360 212,405 C250,420 350,420 388,405 C420,360 424,280 408,200 Z"/>`;
      case 'twintails':
        return `<path ${st} d="M214,170 C120,200 88,380 110,560 C118,640 150,690 176,640 C160,560 170,420 214,300 Z"/>
                <path ${st} d="M386,170 C480,200 512,380 490,560 C482,640 450,690 424,640 C440,560 430,420 386,300 Z"/>
                <path fill="${d}" opacity=".45" d="M150,300 C130,420 132,540 160,630 C150,520 160,400 196,300Z"/>
                <path fill="${d}" opacity=".45" d="M450,300 C470,420 468,540 440,630 C450,520 440,400 404,300Z"/>
                <path ${st} d="M196,200 C190,260 192,330 208,380 L392,380 C408,330 410,260 404,200 Z"/>`;
      case 'ponytail':
        return `<path ${st} d="M360,150 C470,160 500,330 470,520 C462,570 440,600 428,560 C446,440 440,300 372,220 Z"/>
                <path fill="${d}" opacity=".45" d="M420,260 C460,360 458,460 440,540 C430,450 430,360 400,280Z"/>
                <path ${st} d="M196,200 C190,260 194,320 210,360 L390,360 C406,320 410,260 404,200 Z"/>`;
      case 'bun':
        return `<circle ${st} cx="300" cy="96" r="46"/><path fill="${d}" opacity=".4" d="M268,110 Q300,140 334,108 Q320,130 300,132 Q280,130 268,110Z"/>`;
      case 'buns':
        return `<circle ${st} cx="212" cy="112" r="48"/><circle ${st} cx="388" cy="112" r="48"/>
                <path fill="${d}" opacity=".4" d="M180,128 Q212,160 244,128 Q230,152 212,154 Q192,152 180,128Z M356,128 Q388,160 420,128 Q406,152 388,154 Q368,152 356,128Z"/>
                <path ${st} d="M196,200 C190,260 194,320 210,360 L390,360 C406,320 410,260 404,200 Z"/>`;
      case 'afro': {
        let p = ''; const n = 22;
        for (let i = 0; i <= n; i++) { const a = Math.PI * (0.92 + i / n * 1.16) , r = 178 + (i % 2 ? 10 : -4); p += (i ? 'L' : 'M') + (300 + Math.cos(a) * r).toFixed(1) + ',' + (225 + Math.sin(a) * r * .92).toFixed(1); }
        p += ' L470,300 C470,360 440,400 410,410 L190,410 C160,400 130,360 130,300 Z';
        return `<path ${st} d="${p}"/><path fill="${d}" opacity=".35" d="M160,300 C160,360 190,395 215,402 L385,402 C410,395 440,360 440,300 C400,340 200,340 160,300Z"/>`;
      }
      case 'braid':
        return `<path ${st} d="M196,200 C190,260 194,320 210,360 L390,360 C406,320 410,260 404,200 Z"/>`;
      case 'curly': {
        let s = '';
        for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i / 8 * 0.9); s += `<circle ${st} cx="${(300 + Math.cos(a) * 150).toFixed(0)}" cy="${(250 + Math.sin(a) * 150).toFixed(0)}" r="44"/>`; }
        return s;
      }
      case 'bald':
      case 'short':
      case 'spiky':
      case 'messy':
      default:
        return '';
    }
  }

  // ---------- CABELO (franja / frente) ----------
  function frontHair(s, c, d, hl) {
    const st = `fill="${c}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"`;
    const ring = `<path fill="${hl}" opacity=".55" d="M228,150 C260,128 340,128 372,150 C360,146 340,142 300,142 C260,142 240,146 228,150Z"/>`;
    const sideLocks = `<path ${st} d="M200,200 C186,270 186,340 202,410 C212,380 214,320 226,250 Z"/>
                       <path ${st} d="M400,200 C414,270 414,340 398,410 C388,380 386,320 374,250 Z"/>`;
    switch (s) {
      case 'straight':
        return `<path ${st} d="M192,232 C186,140 236,96 300,96 C364,96 414,140 408,232 L398,226 L388,244 L372,222 L356,246 L338,224 L320,248 L300,226 L280,248 L262,224 L244,246 L228,222 L212,244 L202,226 Z"/>${sideLocks}${ring}`;
      case 'side':
        return `<path ${st} d="M192,240 C182,140 236,94 304,96 C372,98 418,146 408,240 C400,214 388,196 372,186 C378,210 372,230 360,244 C356,220 340,196 318,186 C310,214 280,240 236,258 C252,234 256,212 252,192 C230,206 212,222 192,240 Z"/>${sideLocks}${ring}`;
      case 'parted':
        return `<path ${st} d="M192,240 C184,140 238,96 300,98 C362,96 416,140 408,240 C396,208 372,176 330,160 C340,190 350,210 366,232 C330,214 312,186 300,150 C288,186 270,214 234,232 C250,210 260,190 270,160 C228,176 204,208 192,240 Z"/>${sideLocks}${ring}`;
      case 'short':
        return `<path ${st} d="M194,236 C182,146 232,96 300,96 C368,96 418,146 406,236 C400,214 392,200 380,190 L376,214 L360,190 L346,220 L330,190 L312,222 L296,190 L278,220 L262,192 L246,218 L232,194 L222,214 Z"/>${ring}`;
      case 'spiky':
        return `<path ${st} d="M190,240 L170,196 L200,190 L178,140 L222,150 L218,100 L258,122 L272,74 L300,110 L332,70 L344,118 L386,96 L382,146 L426,138 L402,190 L432,200 L410,240 C404,214 394,200 380,190 L372,222 L352,192 L338,226 L318,194 L300,230 L282,194 L262,226 L248,192 L228,222 L220,194 Z"/>${ring}`;
      case 'messy':
        return `<path ${st} d="M188,246 C170,200 178,150 200,128 C200,100 240,84 270,96 C290,78 330,80 350,96 C380,88 410,112 408,140 C428,170 426,210 412,246 C404,222 396,206 384,196 C388,222 380,238 370,246 C366,222 352,204 336,196 C334,222 320,236 300,244 C304,222 298,206 288,198 C276,222 256,236 232,242 C244,226 246,210 242,198 C220,212 204,228 188,246 Z"/>${ring}`;
      case 'bun':
        return `<path ${st} d="M194,236 C184,150 236,110 300,110 C364,110 416,150 406,236 C396,200 370,170 330,160 C300,168 270,164 250,166 C222,180 204,206 194,236 Z"/>
                <path fill="${d}" opacity=".35" d="M232,150 C260,136 340,136 368,150 C340,146 260,146 232,150Z"/>`;
      case 'afro': {
        let s = `<path ${st} d="M190,236 C176,150 230,92 300,92 C370,92 424,150 410,236 C396,210 380,196 360,190 C330,200 270,200 240,190 C220,196 204,210 190,236Z"/>`;
        for (let i = 0; i < 7; i++) { const x = 222 + i * 26; s += `<circle ${st} cx="${x}" cy="${196 + Math.abs(i - 3) * 6}" r="20"/>`; }
        return s + `<path fill="${hl}" opacity=".45" d="M236,132 C270,114 330,114 364,132 C340,126 260,126 236,132Z"/>`;
      }
      case 'curly': {
        let s = `<path ${st} d="M192,236 C186,140 236,96 300,96 C364,96 414,140 408,236 C396,214 380,200 360,196 L240,196 C220,200 204,214 192,236Z"/>`;
        for (let i = 0; i < 8; i++) { const x = 214 + i * 24.5; s += `<circle ${st} cx="${x}" cy="${204 + (i % 2) * 10}" r="19"/>`; }
        s += `<circle ${st} cx="200" cy="236" r="16"/><circle ${st} cx="400" cy="236" r="16"/>`;
        return s + ring;
      }
      case 'undercut':
        return `<path fill="${d}" stroke="${OL}" stroke-width="3" d="M194,236 C188,180 200,150 222,138 L222,236Z"/>
                <path ${st} d="M214,214 C204,130 250,72 320,76 C392,80 424,140 408,236 C400,214 392,204 380,198 C374,226 352,246 318,252 C340,224 338,200 326,184 C300,200 262,206 228,206 C222,206 218,210 214,214Z"/>${ring}`;
      case 'bald':
        return `<path fill="#fff" opacity=".35" d="M250,130 C270,116 300,112 320,116 C300,120 270,126 256,138Z"/>`;
      default:
        return `<path ${st} d="M192,236 C186,140 236,96 300,96 C364,96 414,140 408,236 Z"/>`;
    }
  }

  // Cabelo que passa na frente dos ombros (trança)
  function hairOver(s, c, d) {
    if (s !== 'braid') return '';
    const st = `fill="${c}" stroke="${OL}" stroke-width="3"`;
    let out = `<path ${st} d="M372,250 C392,280 400,300 396,330 L372,330 Z"/>`;
    for (let i = 0; i < 7; i++) {
      const cx = 388 + Math.sin(i * 1.1) * 7, cy = 330 + i * 40;
      out += `<ellipse ${st} cx="${cx.toFixed(0)}" cy="${cy}" rx="${27 - i}" ry="25"/><path d="M${cx - 14},${cy - 8} Q${cx},${cy + 6} ${cx + 16},${cy - 10}" stroke="${d}" stroke-width="3" fill="none"/>`;
    }
    out += `<path d="M376,610 L400,610 L396,626 L380,626Z" fill="#ff4d6d" stroke="${OL}" stroke-width="2.5"/>`;
    out += `<path ${st} d="M378,624 C370,660 382,690 388,700 C396,690 408,660 398,624Z"/>`;
    return out;
  }

  // Tampa de cabelo atrás da cabeça (volume do topo)
  function hairCap(c) {
    return `<path fill="${c}" stroke="${OL}" stroke-width="3" d="M186,240 C176,130 236,84 300,84 C364,84 424,130 414,240 Z"/>`;
  }

  // ---------- OLHOS ----------
  function eye(e, iris, irisDark, style, lash) {
    // olho esquerdo desenhado em coordenadas absolutas; o direito é espelhado
    const id = 'ir' + (++uid);
    const sharp = style === 'sharp';
    const old = style === 'old';
    const sclera = sharp
      ? 'M226,268 C236,248 276,246 288,262 C286,282 272,292 254,292 C238,292 228,282 226,268Z'
      : 'M226,266 C230,236 280,234 288,258 C290,284 278,300 256,300 C236,300 226,286 226,266Z';
    const irisRx = sharp ? 14 : 18, irisRy = sharp ? 17 : 23;
    const cy = sharp ? 272 : 274;
    const defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${irisDark}"/><stop offset=".55" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, .45)}"/></linearGradient>
                  <clipPath id="c${id}"><path d="${sclera}"/></clipPath></defs>`;
    if (e === 'closed' || e === 'happy') {
      const p = e === 'happy' ? 'M228,276 Q257,248 288,274' : 'M228,272 Q257,286 288,270';
      return `<path d="${p}" fill="none" stroke="${lash}" stroke-width="6" stroke-linecap="round"/>`;
    }
    let pupilR = e === 'surprised' ? 4 : 8;
    let irisScale = e === 'surprised' ? 0.8 : 1;
    let upper = sharp
      ? `M220,266 C232,244 278,240 292,258 L288,264 C274,250 238,252 226,272Z`
      : `M220,262 C228,230 284,226 294,254 L289,259 C276,238 236,240 228,268Z`;
    // pálpebra caída para triste/bravo/sonolento: a linha dos cílios desce junto
    let lidMask = '';
    const lids = { angry: [252, 266], sad: [264, 250], sleepy: [268, 268] };
    if (lids[e]) {
      const [y1, y2] = lids[e], my = (y1 + y2) / 2 - 10;
      lidMask = `<path d="M214,220 L300,220 L300,${y2} Q257,${my} 214,${y1} Z" fill="SKIN"/>`;
      upper = `M218,${y1 + 2} Q257,${my - 6} 296,${y2 - 2} L294,${y2 + 5} Q257,${my + 2} 222,${y1 + 7} Z`;
    }
    const lower = `<path d="M240,${sharp ? 292 : 299} Q258,${sharp ? 296 : 303} 276,${sharp ? 290 : 296}" fill="none" stroke="${lash}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
    const flick = (sharp || lids[e]) ? '' : `<path d="M288,256 L300,248 L292,262Z" fill="${lash}"/>`;
    const wrinkle = old ? `<path d="M292,272 q8,4 12,12 M292,282 q6,2 9,8" stroke="${OL}" stroke-width="1.6" fill="none" opacity=".45"/>` : '';
    return `${defs}<path d="${sclera}" fill="#fff" stroke="${OL}" stroke-width="1.5"/>
      <g clip-path="url(#c${id})">
        <ellipse cx="257" cy="${cy}" rx="${irisRx * irisScale}" ry="${irisRy * irisScale}" fill="url(#${id})" stroke="${shade(irisDark, -0.3)}" stroke-width="1.5"/>
        <ellipse cx="257" cy="${cy + 2}" rx="${pupilR * (sharp ? .8 : 1)}" ry="${pupilR * 1.35}" fill="${shade(irisDark, -0.5)}"/>
        <path d="M232,248 Q258,236 286,248 L286,262 Q258,252 232,262Z" fill="${OL}" opacity=".18"/>
        <circle cx="${264}" cy="${cy - 9}" r="${sharp ? 4.5 : 6.5}" fill="#fff"/>
        <circle cx="${249}" cy="${cy + 10}" r="${sharp ? 2 : 3}" fill="#fff" opacity=".85"/>
        ${lidMask}
      </g>
      <path d="${upper}" fill="${lash}"/>${flick}${lower}${wrinkle}`;
  }

  function brows(e, col) {
    let p;
    switch (e) {
      case 'angry': p = 'M230,222 Q258,226 286,242'; break;
      case 'sad': case 'worried': p = 'M230,238 Q258,230 284,222'; break;
      case 'surprised': p = 'M230,214 Q256,200 284,212'; break;
      case 'happy': p = 'M230,226 Q256,212 284,222'; break;
      default: p = 'M230,230 Q256,218 284,228';
    }
    return `<path d="${p}" fill="none" stroke="${col}" stroke-width="5.5" stroke-linecap="round"/>`;
  }

  function mouth(m) {
    switch (m) {
      case 'open': return `<path d="M280,324 Q300,358 320,324 Q300,330 280,324Z" fill="#8a2c3f" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M290,340 Q300,350 310,340 Q300,336 290,340Z" fill="#ff8aa0"/>`;
      case 'talk': return `<path d="M286,326 Q300,344 314,326 Q300,330 286,326Z" fill="#8a2c3f" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`;
      case 'frown': return `<path d="M285,338 Q300,326 315,338" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
      case 'o': return `<ellipse cx="300" cy="334" rx="8" ry="10" fill="#8a2c3f" stroke="${OL}" stroke-width="2.5"/>`;
      case 'flat': return `<path d="M289,332 L311,332" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
      case 'smirk': return `<path d="M284,332 Q302,340 318,324" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
      case 'wavy': return `<path d="M284,334 q5,-5 10,0 t10,0 t10,0" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
      case 'grit': return `<path d="M282,326 L318,326 L314,340 L286,340Z" fill="#fff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M286,333 L314,333" stroke="${OL}" stroke-width="1.5"/>`;
      default: return `<path d="M285,328 Q300,340 315,328" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
    }
  }

  // ---------- ROUPAS ----------
  function outfit(o, c, c2, skin) {
    const body = `M268,420 C226,428 176,440 156,468 C136,496 128,560 124,650 L114,900 L486,900 L476,650 C472,560 464,496 444,468 C424,440 374,428 332,420 Q300,436 268,420 Z`;
    const st = `stroke="${OL}" stroke-width="3" stroke-linejoin="round"`;
    const arms = `<path d="M176,520 C166,620 160,760 164,900" fill="none" stroke="${OL}" stroke-width="3" opacity=".75"/>
                  <path d="M424,520 C434,620 440,760 436,900" fill="none" stroke="${OL}" stroke-width="3" opacity=".75"/>`;
    const dark = shade(c, -0.25);
    const sideShade = `<path d="M124,650 C128,560 136,496 156,468 C170,520 172,700 166,900 L114,900Z" fill="${dark}" opacity=".6"/>
                       <path d="M476,650 C472,560 464,496 444,468 C430,520 428,700 434,900 L486,900Z" fill="${dark}" opacity=".6"/>`;
    switch (o) {
      case 'uniform':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M268,420 L300,540 L332,420 Q300,436 268,420Z" fill="#fbf8f4" ${st}/>
          <path d="M268,420 L244,470 L300,580 L280,470Z" fill="${shade(c, .12)}" ${st}/>
          <path d="M332,420 L356,470 L300,580 L320,470Z" fill="${shade(c, .12)}" ${st}/>
          <path d="M300,452 L262,432 L266,478Z M300,452 L338,432 L334,478Z" fill="${c2}" ${st}/>
          <circle cx="300" cy="452" r="9" fill="${shade(c2, -.15)}" ${st}/>
          <path d="M292,458 L280,510 L298,500Z M308,458 L320,510 L302,500Z" fill="${c2}" ${st}/>
          <circle cx="300" cy="640" r="7" fill="${shade(c, -.35)}" ${st}/><circle cx="300" cy="700" r="7" fill="${shade(c, -.35)}" ${st}/>
          ${arms}`;
      case 'hoodie':
        return `<path d="M222,432 Q300,488 378,432 Q372,404 300,410 Q228,404 222,432Z" fill="${dark}" ${st}/>
          <path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M262,424 Q300,470 338,424" fill="none" ${st}/>
          <path d="M284,450 L280,560 M316,450 L320,560" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="280" cy="562" r="6" fill="${c2}" ${st}/><circle cx="320" cy="562" r="6" fill="${c2}" ${st}/>
          <path d="M196,780 Q300,752 404,780 L404,900 L196,900Z" fill="${shade(c, -.12)}" ${st}/>
          ${arms}`;
      case 'suit':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M266,420 L300,600 L334,420 Q300,436 266,420Z" fill="#f4f6fa" ${st}/>
          <path d="M290,440 L310,440 L306,456 L294,456Z" fill="${shade(c2, -.2)}" ${st}/>
          <path d="M294,456 L306,456 L316,600 L300,622 L284,600Z" fill="${c2}" ${st}/>
          <path d="M266,420 L236,480 L300,640 L276,480Z" fill="${shade(c, .1)}" ${st}/>
          <path d="M334,420 L364,480 L300,640 L324,480Z" fill="${shade(c, .1)}" ${st}/>
          <path d="M360,520 L400,516 L398,530 L362,534Z" fill="#fff" opacity=".85"/>
          <circle cx="300" cy="700" r="7" fill="${shade(c, -.4)}" ${st}/>
          ${arms}`;
      case 'cardigan':
        return `<path d="${body}" fill="${c2}" ${st}/>
          <path d="M268,420 C226,428 176,440 156,468 C136,496 128,560 124,650 L114,900 L280,900 L286,520 Q276,470 268,420Z" fill="${c}" ${st}/>
          <path d="M332,420 C374,428 424,440 444,468 C464,496 472,560 476,650 L486,900 L320,900 L314,520 Q324,470 332,420Z" fill="${c}" ${st}/>
          ${sideShade}
          <g fill="#fffdf5" stroke="${OL}" stroke-width="1.5">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = Math.PI * (0.15 + i * 0.0875); return `<circle cx="${300 + Math.cos(a) * 44}" cy="${410 + Math.sin(a) * 40}" r="6"/>`; }).join('')}</g>
          <circle cx="292" cy="600" r="7" fill="${shade(c, -.35)}" ${st}/><circle cx="292" cy="680" r="7" fill="${shade(c, -.35)}" ${st}/><circle cx="292" cy="760" r="7" fill="${shade(c, -.35)}" ${st}/>
          ${arms}`;
      case 'jacket':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M262,418 L300,470 L338,418 Q300,436 262,418Z" fill="${c2}" ${st}/>
          <path d="M254,414 L236,470 L284,452Z M346,414 L364,470 L316,452Z" fill="${shade(c, .15)}" ${st}/>
          <path d="M300,470 L300,900" stroke="${OL}" stroke-width="3"/><path d="M300,470 L300,900" stroke="#c8c8c8" stroke-width="1.5" stroke-dasharray="4 5"/>
          <rect x="344" y="540" width="62" height="40" rx="8" fill="${c2}" ${st}/>
          <path d="M356,560 l10,-8 l10,8 l10,-8 l10,8" fill="none" stroke="#fff" stroke-width="3"/>
          ${arms}`;
      case 'goth':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M262,420 Q300,446 338,420 L346,440 Q300,470 254,440Z" fill="#fff" ${st}/>
          <g fill="#fff" stroke="${OL}" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${258 + i * 14}" cy="${448 + Math.sin(i / 6 * Math.PI) * 14}" r="7"/>`).join('')}</g>
          <path d="M300,500 L290,520 L300,540 L310,520Z" fill="${c2}" ${st}/>
          <path d="M200,620 Q300,660 400,620" fill="none" stroke="${c2}" stroke-width="4"/>
          ${arms}`;
      case 'idol':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M262,420 Q300,446 338,420 L350,450 Q300,480 250,450Z" fill="#fff" ${st}/>
          <path d="M300,470 L262,448 L260,500Z M300,470 L338,448 L340,500Z" fill="${c2}" ${st}/>
          <circle cx="300" cy="470" r="10" fill="${shade(c2, -.15)}" ${st}/>
          <path d="M300,600 l10,22 l24,2 l-18,16 l6,24 l-22,-12 l-22,12 l6,-24 l-18,-16 l24,-2Z" fill="#fff3a0" ${st}/>
          <path d="M140,780 Q170,760 200,780 Q230,760 260,780 Q290,760 320,780 Q350,760 380,780 Q410,760 440,780 Q470,760 480,790" fill="none" stroke="#fff" stroke-width="6"/>
          ${arms}`;
      case 'labcoat':
        return `<path d="${body}" fill="${c2}" ${st}/>
          <path d="M268,420 C226,428 176,440 156,468 C136,496 128,560 124,650 L114,900 L282,900 L290,560 Q276,470 268,420Z" fill="#f8f9fb" ${st}/>
          <path d="M332,420 C374,428 424,440 444,468 C464,496 472,560 476,650 L486,900 L318,900 L310,560 Q324,470 332,420Z" fill="#f8f9fb" ${st}/>
          <path d="M268,420 L250,480 L290,560Z M332,420 L350,480 L310,560Z" fill="#e3e7ee" ${st}/>
          <path d="M124,650 C128,560 136,496 156,468 C170,520 172,700 166,900 L114,900Z" fill="#dfe3ea" opacity=".8"/>
          <path d="M476,650 C472,560 464,496 444,468 C430,520 428,700 434,900 L486,900Z" fill="#dfe3ea" opacity=".8"/>
          <rect x="360" y="600" width="70" height="60" rx="6" fill="#eef1f5" ${st}/>
          <rect x="372" y="580" width="8" height="40" rx="3" fill="#3a86ff" ${st}/><rect x="388" y="584" width="8" height="36" rx="3" fill="#e63946" ${st}/>
          <circle cx="300" cy="470" r="6" fill="${shade(c2, -.3)}"/>
          ${arms}`;
      case 'chef':
        return `<path d="${body}" fill="#fbfbf8" ${st}/>${sideShade.replace(new RegExp(dark, 'g'), '#dcdcd4')}
          <path d="M262,418 Q300,452 338,418 L346,446 Q300,480 254,446Z" fill="${c2}" ${st}/>
          <path d="M292,462 L276,520 L300,506 L324,520 L308,462Z" fill="${shade(c2, -.15)}" ${st}/>
          <path d="M300,480 L300,900" stroke="#cfcfc6" stroke-width="3"/>
          ${[560, 640, 720, 800].map(y => `<circle cx="262" cy="${y}" r="8" fill="#e9e9e0" stroke="${OL}" stroke-width="2"/><circle cx="338" cy="${y}" r="8" fill="#e9e9e0" stroke="${OL}" stroke-width="2"/>`).join('')}
          ${arms}`;
      case 'sporty':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M260,414 L272,452 L300,470 L328,452 L340,414 Q300,432 260,414Z" fill="${shade(c, .15)}" ${st}/>
          <path d="M300,470 L300,900" stroke="${OL}" stroke-width="3"/><path d="M300,470 L300,900" stroke="#ddd" stroke-width="1.5" stroke-dasharray="3 4"/>
          <path d="M160,470 C150,560 146,720 150,900" stroke="#fff" stroke-width="10" fill="none"/><path d="M178,468 C168,560 164,720 168,900" stroke="${c2}" stroke-width="8" fill="none"/>
          <path d="M440,470 C450,560 454,720 450,900" stroke="#fff" stroke-width="10" fill="none"/><path d="M422,468 C432,560 436,720 432,900" stroke="${c2}" stroke-width="8" fill="none"/>
          <path d="M330,560 l14,-16 l14,16 l14,-16" stroke="${c2}" stroke-width="6" fill="none"/>
          ${arms}`;
      case 'punk':
        return `<path d="${body}" fill="${c2}" ${st}/>
          <path d="M268,420 C226,428 176,440 156,468 C136,496 128,560 124,650 L114,900 L268,900 L276,540 Z" fill="${c}" ${st}/>
          <path d="M332,420 C374,428 424,440 444,468 C464,496 472,560 476,650 L486,900 L330,900 L324,540 Z" fill="${c}" ${st}/>
          <path d="M268,420 L236,470 L276,540Z M332,420 L364,470 L324,540Z" fill="${shade(c, .2)}" ${st}/>
          <g fill="#d9d9d9" stroke="${OL}" stroke-width="1.5">${[0, 1, 2, 3, 4].map(i => `<path d="M${172 + i * 15},${482 - i * 5} l7,-12 l7,12Z"/><path d="M${354 + i * 15},${462 + i * 5} l7,-12 l7,12Z"/>`).join('')}</g>
          <circle cx="300" cy="600" r="30" fill="#fff" ${st}/><path d="M288,594 l8,8 m0,-8 l-8,8 M306,594 l8,8 m0,-8 l-8,8 M288,614 q12,8 24,0" stroke="${OL}" stroke-width="3" fill="none"/>
          <path d="M276,540 L276,900 M324,540 L324,900" stroke="#c0c0c0" stroke-width="3"/>
          ${arms}`;
      case 'overalls':
        return `<path d="${body}" fill="${c2}" ${st}/>${sideShade.replace(new RegExp(dark, 'g'), shade(c2, -.25))}
          <path d="M264,422 Q300,462 336,422" fill="none" ${st}/>
          <path d="M214,600 L386,600 L396,900 L204,900Z" fill="${c}" ${st}/>
          <path d="M232,600 L252,470 L276,470 L262,600Z M368,600 L348,470 L324,470 L338,600Z" fill="${c}" ${st}/>
          <circle cx="262" cy="590" r="9" fill="#ffd23f" ${st}/><circle cx="338" cy="590" r="9" fill="#ffd23f" ${st}/>
          <rect x="262" y="640" width="76" height="60" rx="8" fill="${shade(c, .12)}" ${st}/>
          <path d="M270,660 L330,660" stroke="#ffd23f" stroke-width="3" stroke-dasharray="5 4"/>
          ${arms}`;
      case 'turtleneck':
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M262,380 Q300,396 338,380 L342,436 Q300,454 258,436Z" fill="${shade(c, .08)}" ${st}/>
          ${[0, 1, 2, 3].map(i => `<path d="M${270 + i * 20},386 L${268 + i * 20},440" stroke="${shade(c, -.2)}" stroke-width="2"/>`).join('')}
          <path d="M240,500 Q300,560 360,500" stroke="${c2}" stroke-width="4" fill="none"/><circle cx="300" cy="530" r="10" fill="${c2}" ${st}/>
          ${arms}`;
      case 'tshirt':
      default:
        return `<path d="${body}" fill="${c}" ${st}/>${sideShade}
          <path d="M264,422 Q300,462 336,422" fill="none" ${st}/>
          <path d="M300,560 C284,536 250,548 262,580 C272,604 300,620 300,620 C300,620 328,604 338,580 C350,548 316,536 300,560Z" fill="${c2}" ${st}/>
          ${arms}`;
    }
  }

  function accessories(list, spec) {
    let out = '';
    for (const a of list || []) {
      if (a === 'glasses') {
        const f = spec.glassesColor || '#5a3a3a';
        out += `<g fill="rgba(200,230,255,.18)" stroke="${f}" stroke-width="4"><rect x="222" y="242" width="70" height="56" rx="16"/><rect x="308" y="242" width="70" height="56" rx="16"/></g>
                <path d="M292,262 Q300,256 308,262" stroke="${f}" stroke-width="4" fill="none"/>
                <path d="M234,252 l14,-6 M320,252 l14,-6" stroke="#fff" stroke-width="3" opacity=".7"/>`;
      }
      if (a === 'bow') {
        const b = spec.bowColor || '#ff4d6d';
        out += `<g transform="translate(360,128) rotate(18)"><path d="M0,0 L-44,-26 L-40,24Z M0,0 L44,-26 L40,24Z" fill="${b}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><circle r="11" fill="${shade(b, -.2)}" stroke="${OL}" stroke-width="3"/></g>`;
      }
      if (a === 'clip') {
        out += `<g transform="translate(236,176) rotate(-30)"><rect x="-20" y="-6" width="40" height="12" rx="6" fill="${spec.clipColor || '#ffd23f'}" stroke="${OL}" stroke-width="3"/></g>`;
      }
      if (a === 'cap') {
        const cc = spec.capColor || '#e63946';
        out += `<path d="M186,196 C184,112 240,78 300,78 C362,78 416,112 414,196 Z" fill="${cc}" stroke="${OL}" stroke-width="3"/>
                <path d="M186,192 Q300,168 452,206 Q440,228 300,212 Q230,208 186,212Z" fill="${shade(cc, -.2)}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
                <circle cx="300" cy="84" r="8" fill="${shade(cc, -.2)}" stroke="${OL}" stroke-width="2"/>
                <path d="M270,120 Q300,104 330,120 L330,150 Q300,140 270,150Z" fill="#fff" stroke="${OL}" stroke-width="2"/>`;
      }
      if (a === 'headphones') {
        const hc = spec.phonesColor || '#2b2d42';
        out += `<path d="M190,250 C180,110 420,110 410,250" fill="none" stroke="${OL}" stroke-width="18" stroke-linecap="round"/>
                <path d="M190,250 C180,110 420,110 410,250" fill="none" stroke="${hc}" stroke-width="12" stroke-linecap="round"/>
                <rect x="170" y="236" width="36" height="66" rx="16" fill="${hc}" stroke="${OL}" stroke-width="3"/>
                <rect x="394" y="236" width="36" height="66" rx="16" fill="${hc}" stroke="${OL}" stroke-width="3"/>
                <rect x="178" y="250" width="10" height="36" rx="5" fill="#7df9ff"/><rect x="412" y="250" width="10" height="36" rx="5" fill="#7df9ff"/>`;
      }
      if (a === 'choker') out += `<path d="M270,388 Q300,404 330,388 L330,400 Q300,416 270,400Z" fill="#1a1a1a" stroke="${OL}" stroke-width="2"/><circle cx="300" cy="410" r="6" fill="#c0c0ff" stroke="${OL}" stroke-width="1.5"/>`;
      if (a === 'earrings') out += `<circle cx="198" cy="306" r="6" fill="#ffd23f" stroke="${OL}" stroke-width="2"/><circle cx="402" cy="306" r="6" fill="#ffd23f" stroke="${OL}" stroke-width="2"/>`;
      if (a === 'mustache') out += `<path d="M300,314 C286,304 262,306 256,322 C272,316 286,322 300,320 C314,322 328,316 344,322 C338,306 314,304 300,314Z" fill="${spec.hair}" stroke="${OL}" stroke-width="2.5"/>`;
      if (a === 'freckles') out += `<g fill="${shade(spec.skin, -.35)}" opacity=".6"><circle cx="236" cy="312" r="2.4"/><circle cx="246" cy="318" r="2"/><circle cx="228" cy="320" r="2"/><circle cx="364" cy="312" r="2.4"/><circle cx="354" cy="318" r="2"/><circle cx="372" cy="320" r="2"/></g>`;
      if (a === 'bandaid') out += `<g transform="translate(360,318) rotate(-20)"><rect x="-18" y="-7" width="36" height="14" rx="6" fill="#f5c9a0" stroke="${OL}" stroke-width="2"/><rect x="-6" y="-5" width="12" height="10" fill="#e8b48a"/></g>`;
      if (a === 'catears') {
        const cc = spec.hair, inn = '#ffb3c6';
        out += `<path d="M206,150 L214,56 L276,112Z M394,150 L386,56 L324,112Z" fill="${cc}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
                <path d="M220,128 L224,80 L258,112Z M380,128 L376,80 L342,112Z" fill="${inn}"/>`;
      }
      if (a === 'beanie') {
        const bc = spec.beanieColor || '#e76f51';
        out += `<path d="M188,176 C184,96 240,64 300,64 C360,64 416,96 412,176 Z" fill="${bc}" stroke="${OL}" stroke-width="3"/>
                <rect x="182" y="160" width="236" height="36" rx="16" fill="${shade(bc, -.15)}" stroke="${OL}" stroke-width="3"/>
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${202 + i * 24},164 L${202 + i * 24},192" stroke="${shade(bc, -.35)}" stroke-width="3"/>`).join('')}
                <circle cx="300" cy="62" r="22" fill="#fff" stroke="${OL}" stroke-width="3"/>`;
      }
      if (a === 'eyepatch') out += `<path d="M196,178 L404,300" stroke="#111" stroke-width="6"/><path d="M318,244 C330,236 372,236 384,250 C388,280 374,300 350,302 C330,300 316,284 318,244Z" fill="#111" stroke="${OL}" stroke-width="2"/><path d="M340,262 l14,14 m0,-14 l-14,14" stroke="#9d0208" stroke-width="3"/>`;
      if (a === 'beard') out += `<path d="M200,280 C204,340 240,392 300,400 C360,392 396,340 400,280 C384,318 360,344 330,350 C318,340 282,340 270,350 C240,344 216,318 200,280Z" fill="${spec.hair}" stroke="${OL}" stroke-width="3"/><path d="M280,332 Q300,324 320,332 Q300,342 280,332Z" fill="${shade(spec.skin, -.4)}"/>`;
      if (a === 'goggles') {
        out += `<path d="M192,168 Q300,140 408,168" stroke="#3d2b1f" stroke-width="12" fill="none"/>
                <circle cx="256" cy="150" r="30" fill="#8ecae6" stroke="#6c584c" stroke-width="8"/><circle cx="344" cy="150" r="30" fill="#8ecae6" stroke="#6c584c" stroke-width="8"/>
                <path d="M242,138 l12,-6 M330,138 l12,-6" stroke="#fff" stroke-width="4"/>`;
      }
      if (a === 'headband') out += `<path d="M190,190 Q300,150 410,190 L410,210 Q300,172 190,210Z" fill="${spec.headbandColor || '#e63946'}" stroke="${OL}" stroke-width="3"/>`;
      if (a === 'flower') out += `<g transform="translate(222,150)">${[0, 1, 2, 3, 4].map(i => `<ellipse rx="13" ry="20" transform="rotate(${i * 72}) translate(0,-16)" fill="#ff8fab" stroke="${OL}" stroke-width="2"/>`).join('')}<circle r="10" fill="#ffd23f" stroke="${OL}" stroke-width="2"/></g>`;
      if (a === 'piercing') out += `<circle cx="196" cy="300" r="7" fill="none" stroke="#c0c0c0" stroke-width="3"/><circle cx="404" cy="296" r="6" fill="none" stroke="#c0c0c0" stroke-width="3"/><circle cx="404" cy="312" r="6" fill="none" stroke="#c0c0c0" stroke-width="3"/>`;
      if (a === 'scarf') { const sc = spec.scarfColor || '#e63946'; out += `<path d="M252,380 Q300,420 348,380 L360,420 Q300,468 240,420Z" fill="${sc}" stroke="${OL}" stroke-width="3"/><path d="M320,430 L340,540 L310,540 L300,440Z" fill="${shade(sc, -.1)}" stroke="${OL}" stroke-width="3"/>`; }
      if (a === 'star') out += `<path transform="translate(244,150) scale(.9)" d="M0,-18 L5,-6 L18,-6 L8,3 L12,16 L0,8 L-12,16 L-8,3 L-18,-6 L-5,-6Z" fill="#fff3a0" stroke="${OL}" stroke-width="2.5"/>`;
    }
    return out;
  }

  // ---------- MONTAGEM ----------
  // spec: {skin, hair, hairBack, hairFront, eyes, eyeStyle, outfit, outfitColor, outfitColor2, acc[], male, old, lips}
  // expr: 'neutral','smile','happy','sad','angry','surprised','blush','worried','smug'
  function drawCharacter(spec, expr = 'neutral', opts = {}) {
    const skin = spec.skin || '#ffe0cc';
    const skinD = shade(skin, -0.12);
    const hair = spec.hair, hairD = shade(hair, -0.28), hairHL = shade(hair, 0.55);
    const iris = spec.eyes || '#6a4c93', irisD = shade(iris, -0.45);
    const lash = spec.lashColor || '#2a1620';
    let eyeState = expr, mouthState = 'smile', browState = expr, blush = false;
    switch (expr) {
      case 'neutral': eyeState = 'open'; mouthState = spec.male ? 'flat' : 'smile'; browState = 'neutral'; break;
      case 'smile': eyeState = 'open'; mouthState = 'smile'; browState = 'happy'; break;
      case 'happy': eyeState = 'happy'; mouthState = 'open'; browState = 'happy'; break;
      case 'sad': eyeState = 'sad'; mouthState = 'frown'; browState = 'sad'; break;
      case 'angry': eyeState = 'angry'; mouthState = 'grit'; browState = 'angry'; break;
      case 'surprised': eyeState = 'surprised'; mouthState = 'o'; browState = 'surprised'; break;
      case 'blush': eyeState = 'open'; mouthState = 'wavy'; browState = 'worried'; blush = true; break;
      case 'worried': eyeState = 'open'; mouthState = 'wavy'; browState = 'worried'; break;
      case 'smug': eyeState = 'sleepy'; mouthState = 'smirk'; browState = 'neutral'; break;
    }
    if (opts.blink) eyeState = 'closed';
    if (opts.talk) mouthState = (mouthState === 'open' || mouthState === 'o') ? mouthState : 'talk';

    const face = spec.male
      ? 'M196,214 C194,280 206,326 236,356 C258,376 284,388 300,390 C316,388 342,376 364,356 C394,326 406,280 404,214 C404,150 360,116 300,116 C240,116 196,150 196,214 Z'
      : 'M198,214 C196,276 212,318 244,350 C267,372 288,384 300,386 C312,384 333,372 356,350 C388,318 404,276 402,214 C402,150 360,118 300,118 C240,118 198,150 198,214 Z';

    let e = eye(eyeState, iris, irisD, spec.eyeStyle, lash).replace(/SKIN/g, skin);
    const eyeL = `<g>${e}</g>`;
    const eyeR = `<g transform="translate(600,0) scale(-1,1)">${e.replace(/id="(c?)ir(\d+)"/g, 'id="$1ir$2r"').replace(/url\(#(c?)ir(\d+)\)/g, 'url(#$1ir$2r)')}</g>`;
    const bL = brows(browState, hairD), bR = `<g transform="translate(600,0) scale(-1,1)">${bL}</g>`;

    const blushSvg = (blush || spec.alwaysBlush) ? `<g opacity="${blush ? .75 : .35}"><ellipse cx="240" cy="318" rx="24" ry="10" fill="#ff7aa2"/><ellipse cx="360" cy="318" rx="24" ry="10" fill="#ff7aa2"/>
      ${blush ? '<path d="M226,312 l6,-8 M238,314 l6,-8 M250,314 l6,-8 M346,312 l6,-8 M358,314 l6,-8 M370,314 l6,-8" stroke="#e0507a" stroke-width="2" stroke-linecap="round"/>' : ''}</g>` : '';
    const oldLines = spec.old ? `<path d="M262,344 q-10,-10 -12,-24 M338,344 q10,-10 12,-24" stroke="${OL}" stroke-width="1.8" fill="none" opacity=".35"/>` : '';
    const nose = `<path d="M300,296 L295,306 L301,307" fill="none" stroke="${shade(skin, -.35)}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    const sweat = expr === 'worried' || expr === 'blush' ? `<path d="M398,210 C392,226 392,236 400,238 C408,236 408,226 398,210Z" fill="#bde0fe" stroke="${OL}" stroke-width="2"/>` : '';
    const anger = expr === 'angry' ? `<g transform="translate(396,168)" stroke="#e63946" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-14,-4 q6,4 0,10 M14,-4 q-6,4 0,10 M-4,-14 q4,6 10,0 M-4,14 q4,-6 10,0"/></g>` : '';

    const lipsSvg = spec.lips ? `<path d="M288,331 Q300,337 312,331" stroke="${spec.lips}" stroke-width="4" fill="none" stroke-linecap="round"/>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="${opts.w || 600}" height="${opts.h || 900}">
      ${backHair(spec.hairBack, hair, hairD)}
      ${spec.hairBack && spec.hairBack !== 'bun' ? '' : ''}
      <path d="M268,350 L268,428 Q300,446 332,428 L332,350 Z" fill="${skin}" stroke="${OL}" stroke-width="3"/>
      <path d="M268,372 Q300,410 332,372 L332,398 Q300,430 268,398Z" fill="${skinD}"/>
      ${outfit(spec.outfit, spec.outfitColor || '#6d597a', spec.outfitColor2 || '#ff4d6d', skin)}
      ${(spec.acc || []).includes('choker') ? accessories(['choker'], spec) : ''}
      ${(spec.acc || []).includes('scarf') ? accessories(['scarf'], spec) : ''}
      ${hairOver(spec.hairBack, hair, hairD)}
      ${spec.hairBack === 'bald' || spec.hairBack === 'afro' ? '' : hairCap(hair)}
      <ellipse cx="197" cy="276" rx="14" ry="24" fill="${skin}" stroke="${OL}" stroke-width="3"/>
      <ellipse cx="403" cy="276" rx="14" ry="24" fill="${skin}" stroke="${OL}" stroke-width="3"/>
      <path d="${face}" fill="${skin}" stroke="${OL}" stroke-width="3"/>
      ${spec.hairFront === 'bald' ? '' : `<path d="M212,236 C250,262 350,262 388,236 L388,212 L212,212Z" fill="${skinD}" opacity=".55"/>`}
      ${blushSvg}${oldLines}
      ${eyeL}${eyeR}${nose}
      ${accessories((spec.acc || []).filter(a => a === 'beard'), spec)}
      ${mouth(mouthState)}${lipsSvg}
      ${accessories((spec.acc || []).filter(a => a === 'freckles' || a === 'mustache' || a === 'bandaid'), spec)}
      ${frontHair(spec.hairFront, hair, hairD, hairHL)}
      <g opacity=".92">${bL}${bR}</g>
      ${accessories((spec.acc || []).filter(a => !['choker', 'scarf', 'beard', 'freckles', 'mustache', 'bandaid'].includes(a)), spec)}
      ${sweat}${anger}
    </svg>`;
  }

  // ---------- ELENCO ----------
  const ROSTER = [
    {
      id: 'aiko', name: 'Aiko', full: 'Aiko Tanaka', role: 'estudante tímida',
      spec: { skin: '#ffe4d2', hair: '#7b5ea7', hairBack: 'verylong', hairFront: 'straight', eyes: '#9b5de5', outfit: 'uniform', outfitColor: '#8a7b6e', outfitColor2: '#e05780', acc: ['clip'], clipColor: '#ffd6e0' },
      wealth: 1.0, patience: 0.8, haggle: 0.2, tip: 0.15, devices: ['phone_iphone', 'notch', 'tablet', 'pixel', 'ipod'],
      greet: ['E-ehm... com licença... vocês consertam celular aqui?', 'Oi... d-desculpa incomodar de novo...', 'Ah! V-você lembra de mim? Sou a Aiko...'],
      thanks: ['Ficou perfeito! Muito, muito obrigada!', 'Nossa... você é incrível. Sério.'],
      angry: ['Ah... tudo bem... eu acho...', 'Ele tá... meio estranho ainda...'],
    },
    {
      id: 'bia', name: 'Bia', full: 'Bia Rocha', role: 'influencer',
      spec: { skin: '#ffd9c2', hair: '#ff8fab', hairBack: 'bob', hairFront: 'side', eyes: '#3a86ff', outfit: 'idol', outfitColor: '#ffc8dd', outfitColor2: '#ff006e', acc: ['bow', 'star'], bowColor: '#ff006e', alwaysBlush: true },
      wealth: 1.3, patience: 0.4, haggle: 0.1, tip: 0.25, devices: ['notch', 'redphone', 'galaxy', 'instax', 'jbl'],
      greet: ['Oiêê! Socorro, meu celular é minha VIDA! Tenho live em duas horas!', 'Voltei, amore! Adivinha? Deixei cair de novo! Hihi~', 'Oi oi! Meus seguidores tão esperando, anda logo tá?'],
      thanks: ['AAAH! Vou te marcar nos stories! Você é demais!', 'Perfeito! Vou recomendar pra todo mundo!'],
      angry: ['Sério isso? Vou falar mal de vocês na live...', 'Hmpf. Demorou demais, viu?'],
    },
    {
      id: 'kenji', name: 'Kenji', full: 'Kenji Sato', role: 'gamer',
      spec: { skin: '#f6d5b8', hair: '#22223b', hairBack: 'short', hairFront: 'messy', eyes: '#2ec4b6', eyeStyle: 'sharp', male: true, outfit: 'hoodie', outfitColor: '#2a9d8f', outfitColor2: '#e9c46a', acc: ['headphones'], phonesColor: '#3a0ca3' },
      wealth: 0.9, patience: 0.6, haggle: 0.6, tip: 0.05, devices: ['ds', 'dslite', 'moto', 'switch', 'xpad', 'gameboy'],
      greet: ['Fala, chefe. Meu console morreu no meio da ranked. Tem como salvar?', 'E aí! Voltei. Dessa vez juro que não taquei na parede.', 'Yo. Preciso disso funcionando pro campeonato de amanhã.'],
      thanks: ['GG! Ficou top. Valeu mesmo!', 'Caraca, tá melhor que novo. Respeito.'],
      angry: ['Sério? Isso aqui tá pior que lag...', 'Ah mano... que vacilo.'],
    },
    {
      id: 'cida', name: 'Dona Cida', full: 'Aparecida Moraes', role: 'vovó simpática',
      spec: { skin: '#f3d0b6', hair: '#c9c9d6', hairBack: 'bun', hairFront: 'bun', eyes: '#6b8f71', eyeStyle: 'old', old: true, outfit: 'cardigan', outfitColor: '#b5838d', outfitColor2: '#fff1e6', acc: ['glasses', 'earrings'], glassesColor: '#8d6e63' },
      wealth: 0.8, patience: 1.0, haggle: 0.3, tip: 0.3, devices: ['watch', 'lumia', 'moto', 'rotary', 'calc'],
      greet: ['Bom dia, meu filho! Meu neto disse que você é bom com essas maquininhas.', 'Olá, querido! Trouxe um bolinho de fubá pra você. E um probleminha...', 'Ai, ai... essas tecnologias, viu? Pode me ajudar?'],
      thanks: ['Deus te abençoe, meu filho! Ficou lindo!', 'Que capricho! Vou contar pras minhas amigas do bingo!'],
      angry: ['Hmm... não era bem isso, né, querido?', 'Na minha época as coisas duravam mais...'],
    },
    {
      id: 'marcos', name: 'Dr. Marcos', full: 'Marcos Vale', role: 'executivo apressado',
      spec: { skin: '#e8c4a0', hair: '#5c4033', hairBack: 'short', hairFront: 'parted', eyes: '#4a4e69', eyeStyle: 'sharp', male: true, outfit: 'suit', outfitColor: '#2b2d42', outfitColor2: '#9d0208', acc: ['glasses'], glassesColor: '#222' },
      wealth: 1.8, patience: 0.3, haggle: 0.05, tip: 0.1, devices: ['galaxy', 'tablet', 'notch', 'mac'],
      greet: ['Tenho uma reunião em uma hora. Isso precisa funcionar. Agora.', 'De novo aqui. Meu tempo vale muito, entendeu?', 'Pago o dobro se ficar pronto rápido. Sem enrolação.'],
      thanks: ['Eficiente. Gosto disso. Fique com o troco.', 'Bom trabalho. Vou lembrar do seu nome.'],
      angry: ['Inaceitável. Esperava mais profissionalismo.', 'Vou pensar duas vezes antes de voltar.'],
    },
    {
      id: 'luna', name: 'Luna', full: 'Luna Ferraz', role: 'gótica misteriosa',
      spec: { skin: '#fbe8e0', hair: '#1b1b2f', hairBack: 'long', hairFront: 'straight', eyes: '#d00000', outfit: 'goth', outfitColor: '#1b1b2f', outfitColor2: '#9d4edd', acc: ['choker'], lips: '#5a189a' },
      wealth: 1.1, patience: 0.9, haggle: 0.4, tip: 0.2, devices: ['redphone', 'phone_iphone', 'watch', 'vr', 'instax'],
      greet: ['...As cartas disseram que eu viria aqui hoje.', 'Você de novo. O destino tem senso de humor.', 'Dizem que a sorte sorri pra quem arrisca à noite... você arrisca?'],
      thanks: ['Hm. Você tem mãos abençoadas.', 'A lua está satisfeita. Eu também.'],
      angry: ['Que energia pesada nesse conserto...', 'Os astros avisaram. Eu não ouvi.'],
    },
    {
      id: 'rafa', name: 'Rafa', full: 'Rafael Souza', role: 'entregador',
      spec: { skin: '#c68b59', hair: '#3d2817', hairBack: 'short', hairFront: 'short', eyes: '#6f4518', male: true, outfit: 'jacket', outfitColor: '#e63946', outfitColor2: '#1d3557', acc: ['cap', 'bandaid'], capColor: '#f4a261' },
      wealth: 0.85, patience: 0.5, haggle: 0.5, tip: 0.1, devices: ['moto', 'lumia', 'galaxy', 'walkie', 'pixel'],
      greet: ['Salve! Sem celular eu não trabalho, parceiro. Me salva aí!', 'Opa! Passei correndo entre uma entrega e outra.', 'Fala, chefia! Meu app de entregas nem abre mais...'],
      thanks: ['Valeu demais, parceiro! Tamo junto!', 'Aí sim! Bora que tem entrega!'],
      angry: ['Pô, parceiro... assim fica difícil.', 'Perdi três entregas esperando...'],
    },
    {
      id: 'mei', name: 'Mei', full: 'Mei Lin', role: 'estudante competitiva',
      spec: { skin: '#fde2cf', hair: '#ffd166', hairBack: 'twintails', hairFront: 'side', eyes: '#06d6a0', outfit: 'uniform', outfitColor: '#264653', outfitColor2: '#ef476f', acc: ['bow'], bowColor: '#ef476f' },
      wealth: 1.0, patience: 0.5, haggle: 0.7, tip: 0.05, devices: ['phone_iphone', 'ds', 'notch', 'switch', 'shuffle'],
      greet: ['N-não é como se eu precisasse da sua ajuda, tá?! ...Mas conserta isso.', 'Hmpf! Voltei só porque é perto, não pense besteira!', 'Anda logo, baka! Quer dizer... por favor.'],
      thanks: ['...T-tá bom. Ficou legal. Obrigada. Pronto, falei!', 'Hmpf! Até que você é bom nisso...'],
      angry: ['Eu sabia! Você é um desastre!', 'Nunca mais volto! ...Talvez.'],
    },
    {
      id: 'otavio', name: 'Seu Otávio', full: 'Otávio Mendes', role: 'aposentado',
      spec: { skin: '#e0b98e', hair: '#e5e5e5', hairBack: 'short', hairFront: 'short', eyes: '#577590', eyeStyle: 'old', old: true, male: true, outfit: 'cardigan', outfitColor: '#606c38', outfitColor2: '#fefae0', acc: ['mustache', 'glasses'], glassesColor: '#6c584c' },
      wealth: 0.9, patience: 0.9, haggle: 0.6, tip: 0.2, devices: ['watch', 'lumia', 'tablet', 'rotary', 'boombox', 'digiwatch'],
      greet: ['Boa tarde, rapaz. Esse relógio foi do meu pai. Tem jeito?', 'Olha eu aqui de novo! Minha neta me deu esse aparelho e...', 'Hmm, você é o moço do conserto? Vim pechinchar, viu?'],
      thanks: ['Serviço de primeira! Como antigamente!', 'Muito bem, rapaz. Muito bem mesmo.'],
      angry: ['Isso aqui não tá certo, não.', 'No meu tempo, conserto era conserto!'],
    },
    {
      id: 'yumi', name: 'Yumi', full: 'Yumi Hoshino', role: 'cantora idol',
      spec: { skin: '#ffe8d6', hair: '#48cae4', hairBack: 'ponytail', hairFront: 'parted', eyes: '#f15bb5', outfit: 'idol', outfitColor: '#caf0f8', outfitColor2: '#f15bb5', acc: ['star', 'earrings'] },
      wealth: 1.5, patience: 0.6, haggle: 0.15, tip: 0.3, devices: ['tablet', 'notch', 'galaxy', 'jbl', 'ipod'],
      greet: ['Konnichiwa~! Meu celular guarda todas as minhas músicas!', 'Yumi voltou~! Tenho show hoje à noite, me ajuda?', 'Oi oi! Você é o técnico famoso? Kyaa~!'],
      thanks: ['Arigatou~! Vou dedicar uma música pra você!', 'Kyaa! Ficou brilhando! Obrigada!'],
      angry: ['Mouu... não era isso que eu esperava...', 'Snif... meu show vai ser um desastre...'],
    },
    {
      id: 'nina', name: 'Nina', full: 'Nina Albuquerque', role: 'cientista maluca',
      spec: { skin: '#ffe6d5', hair: '#8d5524', hairBack: 'braid', hairFront: 'parted', eyes: '#43aa8b', outfit: 'labcoat', outfitColor: '#ffffff', outfitColor2: '#ff6392', acc: ['glasses', 'goggles'], glassesColor: '#6d4c41' },
      wealth: 1.2, patience: 0.7, haggle: 0.3, tip: 0.2, devices: ['drone', 'minidrone', 'mac', 'vr'],
      greet: ['Olá! Meu experimento... quer dizer, meu aparelho, sofreu um pequeno acidente. Uma explosãozinha.', 'Voltei! Dessa vez a culpa foi da gravidade, juro.', 'Hipótese: você consegue consertar isso. Vamos testar?'],
      thanks: ['Fascinante! Resultado reproduzível e perfeito!', 'Vou citar você no meu próximo artigo!'],
      angry: ['Hmm, isso invalida todo o experimento...', 'Os dados não mentem: ficou pior.'],
    },
    {
      id: 'zeca', name: 'Tio Zeca', full: 'José Carlos', role: 'tio do churrasco',
      spec: { skin: '#d4a373', hair: '#3c2f2f', hairBack: 'bald', hairFront: 'bald', eyes: '#5c4033', eyeStyle: 'sharp', male: true, outfit: 'chef', outfitColor: '#ffffff', outfitColor2: '#d62828', acc: ['beard'] },
      wealth: 1.0, patience: 0.8, haggle: 0.8, tip: 0.3, devices: ['boombox', 'jbl', 'rotary', 'pixel'],
      greet: ['Ô de casa! O som do churrasco parou bem na hora do pagode, rapaz!', 'Voltei, campeão! Vim pechinchar de novo, hein!', 'Fala, meu querido! Traz aí um desconto de amigo!'],
      thanks: ['Show de bola! No domingo tem picanha pra você!', 'Isso aí, rapaz! Mão boa demais!'],
      angry: ['Pô, meu querido... assim não dá, né?', 'Vou ter que pedir pro meu cunhado olhar isso...'],
    },
    {
      id: 'kiara', name: 'Kiara', full: 'Kiara Nakamura', role: 'streamer gamer',
      spec: { skin: '#ffe0cc', hair: '#c77dff', hairBack: 'buns', hairFront: 'side', eyes: '#4cc9f0', outfit: 'hoodie', outfitColor: '#ffafcc', outfitColor2: '#7209b7', acc: ['catears', 'star'], alwaysBlush: true },
      wealth: 1.1, patience: 0.4, haggle: 0.3, tip: 0.25, devices: ['xpad', 'switch', 'notebook', 'cubepad'],
      greet: ['Nyaa~! Chat, olha que loja fofa! ...Ah, oi! Meu controle tá doido!', 'Voltei com o chat inteiro assistindo! Sem pressão, tá? Hehe~', 'Meu setup quebrou no meio da live, SOCORRO!'],
      thanks: ['Chat, deem follow nesse técnico MARAVILHOSO! Nyaa~!', 'Perfeito! Vou dar raid no seu canal... ah, você não tem canal.'],
      angry: ['Chat, vocês viram isso? Que vergonha...', 'Nyaa... meu controle tá chorando...'],
    },
    {
      id: 'dante', name: 'Dante', full: 'Dante "Kurogane" Silva', role: 'chuunibyou',
      spec: { skin: '#f8e1d0', hair: '#e5e5f0', hairBack: 'short', hairFront: 'spiky', eyes: '#e63946', eyeStyle: 'sharp', male: true, outfit: 'punk', outfitColor: '#1b1b1b', outfitColor2: '#9d0208', acc: ['eyepatch'] },
      wealth: 0.9, patience: 0.6, haggle: 0.5, tip: 0.15, devices: ['vr', 'gameboy', 'cubepad', 'nes'],
      greet: ['Kukuku... Mortal. Meu artefato sagrado foi amaldiçoado. Purifique-o.', 'Nos encontramos de novo, ferreiro das almas digitais...', 'Não olhe diretamente pro meu olho selado. É para a sua segurança.'],
      thanks: ['O selo foi restaurado! Você possui o Toque Divino...', 'Kukuku... Aceite esta oferenda, ó mestre.'],
      angry: ['Maldição! As trevas se espalharam ainda mais!', 'Meu olho demoníaco está furioso...'],
    },
    {
      id: 'jessica', name: 'Jéssica', full: 'Jéssica Oliveira', role: 'fotógrafa',
      spec: { skin: '#8d5524', hair: '#2b1b17', hairBack: 'afro', hairFront: 'afro', eyes: '#6f4518', outfit: 'overalls', outfitColor: '#3a6ea5', outfitColor2: '#ffbe0b', acc: ['earrings', 'flower'] },
      wealth: 1.2, patience: 0.7, haggle: 0.35, tip: 0.25, devices: ['dslr', 'instax', 'drone', 'tab2'],
      greet: ['Oi, amor! Tenho um ensaio amanhã e minha câmera resolveu dar piti.', 'Voltei! Trouxe foto sua do mês passado, ficou linda!', 'Luz, câmera... cadê a câmera? Ah, tá quebrada. Me ajuda?'],
      thanks: ['Ficou impecável! Posso fotografar sua loja pro meu portfólio?', 'Que capricho! Você é um artista também!'],
      angry: ['Hmm... o foco tá errado aqui, viu?', 'Vou ter que remarcar o ensaio... que pena.'],
    },
    {
      id: 'lurdes', name: 'Vó Lurdes', full: 'Maria de Lourdes', role: 'vovó estilosa',
      spec: { skin: '#f1d3bc', hair: '#b388eb', hairBack: 'bob', hairFront: 'curly', eyes: '#577590', eyeStyle: 'old', old: true, outfit: 'turtleneck', outfitColor: '#f4acb7', outfitColor2: '#ffd23f', acc: ['glasses', 'earrings'], glassesColor: '#c9184a' },
      wealth: 0.9, patience: 0.95, haggle: 0.5, tip: 0.35, devices: ['rotarypink', 'calc', 'tamago', 'digiwatch'],
      greet: ['Oi, meu anjo! Pintei o cabelo de roxo, gostou? E o telefone parou...', 'Voltei, querido! Minha netinha deixou o bichinho virtual morrer de novo.', 'Ai, que moço bonito! Olha o que o gato fez com minha calculadora...'],
      thanks: ['Que maravilha! Toma um docinho de leite, meu anjo!', 'Perfeito! Vou te indicar pro grupo da igreja!'],
      angry: ['Ah, querido... não ficou muito bom, não.', 'Meu falecido Arlindo consertava melhor...'],
    },
    {
      id: 'leo', name: 'Léo', full: 'Leonardo Batista', role: 'estudante de engenharia',
      spec: { skin: '#c68b59', hair: '#1b1b1b', hairBack: 'short', hairFront: 'curly', eyes: '#3d2817', male: true, outfit: 'sporty', outfitColor: '#264653', outfitColor2: '#e9c46a', acc: ['headband'], headbandColor: '#e9c46a' },
      wealth: 0.7, patience: 0.6, haggle: 0.7, tip: 0.05, devices: ['calc', 'mac', 'tab2', 'pixel'],
      greet: ['Salve! Prova de cálculo amanhã e minha calculadora morreu. Desespero total.', 'E aí! Voltei. Sou estudante, então... dá um descontinho?', 'Opa! Tentei consertar sozinho vendo tutorial. Deu ruim.'],
      thanks: ['Valeu demais! Agora eu passo em Cálculo 3!', 'Brabo! Vou te chamar de professor agora.'],
      angry: ['Putz... vou reprovar de novo...', 'Acho que o tutorial fazia melhor, hein.'],
    },
    {
      id: 'sora', name: 'Sora', full: 'Sora Duarte', role: 'skatista punk',
      spec: { skin: '#fde2cf', hair: '#80ed99', hairBack: 'short', hairFront: 'undercut', eyes: '#f15bb5', outfit: 'punk', outfitColor: '#3c096c', outfitColor2: '#80ed99', acc: ['piercing', 'bandaid'] },
      wealth: 0.8, patience: 0.5, haggle: 0.45, tip: 0.1, devices: ['ipod', 'walkie', 'shuffle', 'jbl'],
      greet: ['Yo. Caí de skate em cima do meu player. Ele não sobreviveu. Eu sim.', 'Voltei. Não, não caí de novo. ...Tá, caí.', 'E aí. Sem minhas músicas eu não ando de skate. Resolve?'],
      thanks: ['Irado! Vou botar um adesivo da sua loja no meu shape!', 'Sinistro. Ficou perfeito.'],
      angry: ['Que vacilo, hein...', 'Tá pior que meu joelho ralado.'],
    },
    {
      id: 'kaito', name: 'Kaito', full: 'Kaito Yamada', role: 'chef de lámen',
      spec: { skin: '#f6d5b8', hair: '#3a3a3a', hairBack: 'short', hairFront: 'messy', eyes: '#1d3557', eyeStyle: 'sharp', male: true, outfit: 'chef', outfitColor: '#ffffff', outfitColor2: '#e63946', acc: ['headband'], headbandColor: '#e63946' },
      wealth: 1.1, patience: 0.5, haggle: 0.2, tip: 0.3, devices: ['tab2', 'jbl', 'pixel', 'switch'],
      greet: ['Irasshaimase! Caiu caldo de lámen no meu aparelho. De novo.', 'Voltei! A cozinha é um campo de batalha para eletrônicos.', 'Sumimasen! Preciso disso pra anotar os pedidos. Rápido!'],
      thanks: ['Oishii! Lámen grátis pra você esta semana!', 'Arigatou! Trabalho de mestre!'],
      angry: ['Hmm... falta tempero nesse conserto.', 'Até meu caldo queimado ficou melhor que isso.'],
    },
  ];

  const HOSTESS = {
    id: 'rubi', name: 'Rubi', full: 'Madame Rubi', role: 'anfitriã do cassino',
    spec: { skin: '#ffe0d0', hair: '#d62828', hairBack: 'verylong', hairFront: 'side', eyes: '#ffba08', outfit: 'goth', outfitColor: '#9d0208', outfitColor2: '#ffba08', acc: ['earrings', 'choker'], lips: '#d00000', alwaysBlush: true },
  };

  const CLERK = {
    id: 'tati', name: 'Tati', full: 'Tatiana "Tati" Moura', role: 'caixa do mercadinho',
    spec: { skin: '#ffe0cc', hair: '#ff8c42', hairBack: 'ponytail', hairFront: 'side', eyes: '#2a9d8f', outfit: 'overalls', outfitColor: '#2a9d8f', outfitColor2: '#fff1e6', acc: ['cap', 'freckles'], capColor: '#e63946' },
  };

  // ---------- HISTÓRIA ----------
  const STORY = {
    neide: { id: 'neide', name: 'Tia Neide', spec: { skin: '#f3d0b6', hair: '#d9d9e0', hairBack: 'bun', hairFront: 'bun', eyes: '#6b8f71', eyeStyle: 'old', old: true, outfit: 'cardigan', outfitColor: '#2a9d8f', outfitColor2: '#fefae0', acc: ['glasses', 'earrings'], glassesColor: '#8d6e63' } },
    vitor: { id: 'vitor', name: 'Vitor Valadares', spec: { skin: '#f1c9a5', hair: '#d4a017', hairBack: 'short', hairFront: 'parted', eyes: '#1d3557', eyeStyle: 'sharp', male: true, outfit: 'suit', outfitColor: '#14213d', outfitColor2: '#29f3ff', acc: ['glasses'], glassesColor: '#111' } },
    olga: { id: 'olga', name: 'Dona Olga', spec: { skin: '#f6dcc6', hair: '#f1f1f1', hairBack: 'bob', hairFront: 'curly', eyes: '#6a4c93', eyeStyle: 'old', old: true, outfit: 'turtleneck', outfitColor: '#6a4c93', outfitColor2: '#ffd23f', acc: ['earrings', 'glasses'], glassesColor: '#c9a227', lips: '#9d0208' } },
    beto: { id: 'beto', name: 'Beto', spec: { skin: '#c68b59', hair: '#2b2d42', hairBack: 'short', hairFront: 'short', eyes: '#3d2817', male: true, outfit: 'tshirt', outfitColor: '#29a3ff', outfitColor2: '#ffffff', acc: ['cap'], capColor: '#29a3ff' } },
    zeesperto: { id: 'zeesperto', name: 'Zé Esperto', spec: { skin: '#d4a373', hair: '#222222', hairBack: 'short', hairFront: 'messy', eyes: '#222222', eyeStyle: 'sharp', male: true, outfit: 'jacket', outfitColor: '#6b705c', outfitColor2: '#ffb703', acc: ['cap', 'mustache'], capColor: '#111111' } },
    juninho: { id: 'juninho', name: 'Juninho', height: 2.1, spec: { skin: '#ffe0cc', hair: '#6f4518', hairBack: 'short', hairFront: 'messy', eyes: '#3a86ff', male: true, outfit: 'tshirt', outfitColor: '#ffbe0b', outfitColor2: '#3a86ff', acc: ['bandaid', 'freckles'] } },
    marcela: { id: 'marcela', name: 'Marcela', spec: { skin: '#e0ac69', hair: '#4a2c2a', hairBack: 'long', hairFront: 'side', eyes: '#6f4518', outfit: 'sporty', outfitColor: '#e76f51', outfitColor2: '#ffffff', acc: ['earrings'] } },
    rodrigo: { id: 'rodrigo', name: 'Rodrigo', spec: { skin: '#e0ac69', hair: '#1b1b1b', hairBack: 'short', hairFront: 'short', eyes: '#3d2817', male: true, outfit: 'tshirt', outfitColor: '#264653', outfitColor2: '#e9c46a', acc: ['beard'] } },
    cris: { id: 'cris', name: 'Cris Notícia', spec: { skin: '#8d5524', hair: '#1b1b1b', hairBack: 'ponytail', hairFront: 'parted', eyes: '#6f4518', outfit: 'jacket', outfitColor: '#d62828', outfitColor2: '#ffffff', acc: ['glasses', 'earrings'], glassesColor: '#333333' } },
    toninho: { id: 'toninho', name: 'Seu Toninho', spec: { skin: '#e0b98e', hair: '#8d8d8d', hairBack: 'bald', hairFront: 'bald', eyes: '#577590', eyeStyle: 'old', old: true, male: true, outfit: 'overalls', outfitColor: '#3a6ea5', outfitColor2: '#fefae0', acc: ['mustache'] } },
  };
  // ---------- CLIENTES LENDÁRIOS (a cada 5 dias) ----------
  const B = (o) => Object.assign({ wealth: 3.2, patience: .6, haggle: .35, tip: .4, boss: true }, o);
  const BOSSES = [
    B({ id: 'aurelio', name: 'Sr. Aurélio', title: 'O Colecionador', spec: { skin: '#f1d3bc', hair: '#ececec', hairBack: 'short', hairFront: 'parted', eyes: '#3a3a3a', eyeStyle: 'old', old: true, male: true, outfit: 'suit', outfitColor: '#5e3023', outfitColor2: '#ffd23f', acc: ['mustache', 'glasses'], glassesColor: '#b08d57' }, devices: ['rotary', 'nes', 'gameboy', 'boombox'],
      greet: ['Boa tarde. Coleciono relíquias eletrônicas. Esta aqui é única no mundo.'], thanks: ['Magnífico. Uma restauração digna de museu.'], angry: ['Uma relíquia... arruinada. Inaceitável.'] }),
    B({ id: 'cleo', name: 'Cléo Diamante', title: 'A Estrela da TV', spec: { skin: '#ffe0d0', hair: '#f15bb5', hairBack: 'verylong', hairFront: 'side', eyes: '#9b5de5', outfit: 'idol', outfitColor: '#ffd6ff', outfitColor2: '#b5179e', acc: ['star', 'earrings'], alwaysBlush: true, lips: '#d00000' }, devices: ['notch', 'galaxy', 'dslr', 'tablet'],
      greet: ['Amor, eu entro AO VIVO em uma hora e meu aparelho morreu. Me salva que eu te faço famoso!'], thanks: ['PERFEITO! Vou falar da sua loja no programa de domingo!'], angry: ['Que vexame nacional! Nunca mais!'] }),
    B({ id: 'monteiro', name: 'Sr. Monteiro', title: 'O Magnata', spec: { skin: '#e8c4a0', hair: '#3c2f2f', hairBack: 'short', hairFront: 'parted', eyes: '#1d3557', eyeStyle: 'sharp', male: true, outfit: 'suit', outfitColor: '#111111', outfitColor2: '#ffd23f', acc: ['beard', 'glasses'], glassesColor: '#ffd23f' }, devices: ['mac', 'drone', 'vr', 'switch'],
      greet: ['Tenho dez empresas e nenhum técnico de confiança. Vamos ver se você é diferente.'], thanks: ['Excelente. Pessoas competentes são raras. Guarde meu cartão.'], angry: ['Dinheiro jogado fora. Que decepção.'] }),
    B({ id: 'pixel', name: 'Pixel', title: 'A Hacker', spec: { skin: '#fde2cf', hair: '#80ffdb', hairBack: 'bob', hairFront: 'undercut', eyes: '#72efdd', outfit: 'hoodie', outfitColor: '#1b1b2f', outfitColor2: '#80ffdb', acc: ['headphones', 'piercing'], phonesColor: '#80ffdb' }, devices: ['notebook', 'mac', 'pixel', 'tab2'],
      greet: ['Sem perguntas. Conserta e esquece que me viu. O pagamento é generoso.'], thanks: ['Nada mal pra um analógico. Te devo uma.'], angry: ['Tsc. Vou ter que te hackear de raiva.'] }),
  ];

  window.CHARS = { drawCharacter, ROSTER, HOSTESS, CLERK, STORY, BOSSES, shade };
})();
