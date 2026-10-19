/* Redline Ink: turns a dashboard design into redscript.
   Shared by the editor page (as window.RedlineGen) and the Node test harness.
   The geometry functions here are used for both the preview and the export, so what
   the editor draws is computed exactly as the generated script will place it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RedlineGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEG = Math.PI / 180;
  const MPS_TO_KMH = 3.6;
  const MPS_TO_MPH = 2.2369363;

  const FONTS = {
    raj: { label: 'Rajdhani', path: 'base\\gameplay\\gui\\fonts\\raj\\raj.inkfontfamily',
      styles: ['Regular', 'Medium', 'Semi-Bold', 'Bold'] },
    digital: { label: 'Digital readout',
      path: 'base\\gameplay\\gui\\fonts\\digital_readout\\digitalreadout.inkfontfamily',
      styles: ['Regular'] },
  };

  const ANCHORS = {
    TopLeft: [0, 0], TopCenter: [0.5, 0], TopRight: [1, 0],
    Centered: [0.5, 0.5],
    BottomLeft: [0, 1], BottomCenter: [0.5, 1], BottomRight: [1, 1],
  };

  // Put before each part of an export that reaches D.O.P.E. or Codeware: without either, that part is left out when
  // the scripts compile, so a dashboard left behind does nothing instead of stopping every script mod from loading.
  const CT_GUARD = '@if(ModuleExists("CarTuning") && ModuleExists("Codeware"))';

  // D.O.P.E.'s dashboard feed (CarTuningDash, in the mod's Traction.reds): the lamps it reports: 0 off, 1 lit,
  // 2 flashing four times a second; -1 for one the car does not have at all (optional:
  // those lights are hidden then). Keep in step with the mod.
  const CT_LAMPS = [
    { key: 'traction', label: 'Traction control', flashes: true, optional: true,
      help: 'Lit while traction control is switched off; flashes while it acts. Hidden on a car without traction control.' },
    { key: 'hillHold', label: 'Hill hold armed', optional: true,
      help: 'Lit while hill hold is armed or holding. Hidden on a car without the real gearbox.' },
    { key: 'hillHoldOff', label: 'Hill hold off', optional: true,
      help: 'Lit while hill hold is switched off. Hidden on a car without the real gearbox.' },
    { key: 'launch', label: 'Launch control', flashes: true, optional: true,
      help: 'Lit while launch control is armed or staged; flashes while the car launches. Hidden on a car without the ECU tune that brings it.' },
    { key: 'headlights', label: 'Headlights on', help: 'Lit while the headlights are on, low or high beams.' },
    { key: 'highBeam', label: 'High beams', help: 'Lit while the high beams are on.' },
    { key: 'fuelLow', label: 'Low fuel', flashes: true, optional: true,
      help: 'Lit under 15% of the tank; flashes when nearly empty. Hidden with D.O.P.E.\'s fuel off.' },
    { key: 'battery', label: 'Battery', help: 'Lit with the power on and the engine off, as a real car\'s battery light.' },
    { key: 'power', label: 'Power on', help: 'Lit while the car has power.' },
    { key: 'engine', label: 'Engine running', help: 'Lit while the engine runs.' },
    { key: 'knock', label: 'Knock (fuel grade too low)', optional: true,
      help: 'Lit while the engine knocks on too low a fuel grade and so has less power. Hidden with the fuel grades off.' },
    { key: 'checkEngine', label: 'Check engine', flashes: true,
      help: 'Lit while the engine\'s health is under 80% and it has less power; flashes in limp mode, under 15%.' },
    { key: 'comfort', label: 'Comfort mode', help: 'Lit in the Comfort drive mode (D.O.P.E.\'s drive mode key, Numpad 3 to start with).' },
    { key: 'sport', label: 'Sport mode', help: 'Lit in the Sport drive mode.' },
    { key: 'track', label: 'Track mode', help: 'Lit in the Track drive mode.' },
  ];
  const ctLamp = (key) => CT_LAMPS.find((l) => l.key === key) || null;

  // D.O.P.E.'s own icons, in its CarTuning.archive, with the colours they were drawn for.
  const CT_ICONS = [
    { key: 'traction', label: 'Traction control', atlas: 'oitenk\\car_tuning\\tc_light.inkatlas', part: 'tc_light', color: '#ff9e14' },
    { key: 'headlightLow', label: 'Low beam', atlas: 'oitenk\\car_tuning\\headlight_low.inkatlas', part: 'headlight_low', color: '#45ff6e' },
    { key: 'headlightHigh', label: 'High beam', atlas: 'oitenk\\car_tuning\\headlight_high.inkatlas', part: 'headlight_high', color: '#5e9eff' },
    // the hill hold icon: lit green, and the unlit dark grey (#4d545c) while off
    { key: 'hold', label: 'Hill hold', atlas: 'oitenk\\car_tuning\\hold_light.inkatlas', part: 'hold_light', color: '#45ff6e' },
    { key: 'gasPump', label: 'Gas pump', atlas: 'oitenk\\car_tuning\\gas_pump.inkatlas', part: 'gas_pump', color: '#ffffff' },
  ];
  const atlasKey = (a) => String(a || '').trim().replace(/\//g, '\\').replace(/\\+/g, '\\').toLowerCase();
  const ctIconFor = (atlas) => CT_ICONS.find((i) => atlasKey(i.atlas) === atlasKey(atlas)) || null;

  // ---------------------------------------------------------------- geometry

  // Each segment of an arc is a short rectangle centred on the circle and turned to lie along it.
  // Angles are degrees clockwise from 3 o'clock, because screen Y points down.
  function arcSegments(el) {
    const n = Math.max(1, Math.round(num(el.segments, 1)));
    const step = num(el.sweep, 270) / n;
    const r = num(el.r, 100);
    const len = Math.max(0.5, Math.abs(step) * DEG * r - num(el.gap, 0));
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = num(el.start, 135) + step * (i + 0.5);
      out.push({ cx: num(el.cx) + r * Math.cos(a * DEG), cy: num(el.cy) + r * Math.sin(a * DEG),
        w: len, h: num(el.thickness, 8), deg: a + 90 });
    }
    return out;
  }

  // A bar is a row of segments filling its box, lit from the start edge.
  function barSegments(el) {
    const n = Math.max(1, Math.round(num(el.segments, 1)));
    const gap = Math.max(0, num(el.gap, 0));
    const x = num(el.x), y = num(el.y), w = Math.max(1, num(el.w, 100)), h = Math.max(1, num(el.h, 10));
    const out = [];
    const horizontal = el.direction === 'right' || el.direction === 'left' || !el.direction;
    if (horizontal) {
      const sw = Math.max(0.5, (w - gap * (n - 1)) / n);
      for (let i = 0; i < n; i++) {
        const k = el.direction === 'left' ? n - 1 - i : i;
        out.push({ cx: x + sw / 2 + k * (sw + gap), cy: y + h / 2, w: sw, h: h, deg: 0 });
      }
    } else {
      const sh = Math.max(0.5, (h - gap * (n - 1)) / n);
      for (let i = 0; i < n; i++) {
        const k = el.direction === 'down' ? i : n - 1 - i;
        out.push({ cx: x + w / 2, cy: y + sh / 2 + k * (sh + gap), w: w, h: sh, deg: 0 });
      }
    }
    return out;
  }

  // A line is a thin rectangle centred between its ends and turned to the angle between them.
  function lineRect(el) {
    const dx = num(el.x2) - num(el.x1), dy = num(el.y2) - num(el.y1);
    return { cx: (num(el.x1) + num(el.x2)) / 2, cy: (num(el.y1) + num(el.y2)) / 2,
      w: Math.max(0.5, Math.hypot(dx, dy)), h: Math.max(0.5, num(el.thickness, 2)),
      deg: Math.atan2(dy, dx) / DEG };
  }

  function boxRect(el) {
    const w = Math.max(1, num(el.w, 10)), h = Math.max(1, num(el.h, 10));
    return { cx: num(el.x) + w / 2, cy: num(el.y) + h / 2, w: w, h: h, deg: num(el.rotation, 0) };
  }

  function segmentsFor(el) {
    return el.type === 'arc' ? arcSegments(el) : barSegments(el);
  }

  // Numbers around a dial, each at its share of full scale on the circle: speed from 0 to the design's full-scale
  // speed, RPM in thousands up to the full-scale RPM, or the design's own labels spread evenly. Upright, or turned along
  // the circle and flipped on its lower half so none reads upside down. The export lays them out the same way in the
  // game (the Numbers class), RPM numbers again for each car's own full-scale RPM.
  const DIAL_MAX = 100;
  function dialLabels(el) {
    return String(el.labels || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, DIAL_MAX);
  }
  function dialStep(el) {
    return el.source === 'rpm' ? Math.max(1, Math.round(num(el.step, 1))) : Math.max(0.1, num(el.step, 20));
  }
  // How many numbers the design asks for (only the first DIAL_MAX are drawn).
  function dialCount(design, el) {
    if (el.source === 'labels') return dialLabels(el).length;
    const max = el.source === 'rpm' ? Math.max(500, num(design.rpmMax, 8000)) / 1000 : Math.max(1, num(design.speedMax, 260));
    return Math.floor(max / dialStep(el) + 1e-6) + 1;
  }
  function dialValues(design, el, state) {
    const out = [];
    if (el.source === 'labels') {
      const labels = dialLabels(el);
      labels.forEach((t, i) => out.push({ text: t, fraction: labels.length > 1 ? i / (labels.length - 1) : 0 }));
    } else if (el.source === 'rpm') {
      const max = rpmMax(design, state || {});
      const step = dialStep(el);
      for (let k = 0; k * 1000 <= max + 0.5 && out.length < DIAL_MAX; k += step) out.push({ text: String(k), fraction: k * 1000 / max });
    } else {
      const max = Math.max(1, num(design.speedMax, 260));
      const step = dialStep(el);
      for (let i = 0; i * step <= max + 0.001 && out.length < DIAL_MAX; i++) {
        out.push({ text: String(Math.round(i * step * 10) / 10), fraction: i * step / max });
      }
    }
    return out;
  }
  function dialTurn(deg) {
    let t = deg + 90;
    while (t >= 180) t -= 360;
    while (t < -180) t += 360;
    if (Math.abs(t) > 90) t += 180;
    return t;
  }
  function dialPlace(el, fraction) {
    const deg = num(el.start, 150) + num(el.sweep, 240) * fraction;
    const r = num(el.r, 90);
    return { cx: num(el.cx) + r * Math.cos(deg * DEG), cy: num(el.cy) + r * Math.sin(deg * DEG),
      deg: el.turn === 'along' ? dialTurn(deg) : 0 };
  }
  // The share of full scale where the red numbers start; 2 (never) with the red zone off.
  function dialRedFrom(el) {
    const r = clamp01(num(el.redFrom, 1));
    return r < 1 ? r : 2;
  }
  function dialBox(el) {
    const s = Math.max(4, num(el.size, 16));
    return { w: s * 3, h: s * 1.4 };
  }
  function dialNumbers(design, el, state) {
    const red = dialRedFrom(el);
    return dialValues(design, el, state).map((v) => Object.assign(v, dialPlace(el, v.fraction), { red: v.fraction >= red - 0.0001 }));
  }

  // ------------------------------------------------------- live values (preview)

  function displaySpeed(design, state) {
    const mps = Math.abs(num(state.speedMps));
    return (state.metric ?? design.units !== 'mph') ? mps * MPS_TO_KMH : mps * MPS_TO_MPH;
  }

  function rpmMax(design, state) {
    const v = num(state.rpmMax, num(design.rpmMax, 8000));
    return v > 0 ? v : 8000;
  }

  // An arc's or a bar's own range of its source: it starts lighting at rangeFrom and is full at rangeTo.
  function hasRange(el) {
    return (el.type === 'arc' || el.type === 'bar') && !!el.source && el.source !== 'static'
      && (clamp01(num(el.rangeFrom, 0)) > 0 || clamp01(num(el.rangeTo, 1)) < 1);
  }
  function inRange(el, fraction) {
    if (!hasRange(el)) return fraction;
    const from = clamp01(num(el.rangeFrom, 0)), to = clamp01(num(el.rangeTo, 1));
    return clamp01((fraction - from) / Math.max(0.001, to - from));
  }

  function sourceFraction(design, el, state) {
    switch (el.source) {
      case 'speed': return inRange(el, clamp01(displaySpeed(design, state) / Math.max(1, num(design.speedMax, 260))));
      case 'rpm': return inRange(el, clamp01(num(state.rpm) / rpmMax(design, state)));
      case 'fuel': return inRange(el, clamp01(num(state.fuel, 1)));
      case 'value': return inRange(el, clamp01(num((state.values || {})[el.valueName], 0)));
      default: return clamp01(num(el.staticFraction, 1));
    }
  }

  function gearText(design, gear) {
    gear = Math.round(num(gear));
    if (design.gearMap === 'plain') {
      if (gear < 0) return 'R';
      if (gear === 0) return 'N';
      return String(gear);
    }
    if (gear === 0) return 'R';
    if (gear === -1) return 'N';
    return String(gear);
  }

  function textValue(design, el, state) {
    const metric = state.metric ?? design.units !== 'mph';
    switch (el.content) {
      case 'speed': return String(Math.round(displaySpeed(design, state)));
      case 'rpm': return String(Math.round(num(state.rpm)));
      case 'rpm1000': return (num(state.rpm) / 1000).toFixed(1);
      case 'gear': return gearText(design, state.gear);
      case 'fuelPct': return Math.round(clamp01(num(state.fuel, 1)) * 100) + '%';
      case 'units': return metric ? (el.textMetric || 'km/h') : (el.textImperial || 'mph');
      case 'odometer': return distanceText(state.odometerKm, metric, false);
      case 'trip': return distanceText(state.tripKm, metric, true);
      case 'distUnits': return metric ? 'km' : 'mi';
      default: return el.text || '';
    }
  }

  // A distance in km as a dashboard shows it, in km or miles as the speed: whole units grouped (48,213), or a trip
  // to a tenth; --- before there is one (below 0).
  const KM_PER_MILE = 1.609344;
  function groupedInt(n) {
    return String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function distanceText(km, metric, tenths) {
    const v = num(km, -1);
    if (!(v >= 0)) return '---';
    const d = metric ? v : v / KM_PER_MILE;
    if (tenths) {
      const t = Math.floor(d * 10);
      return groupedInt(Math.floor(t / 10)) + '.' + (t % 10);
    }
    return groupedInt(d);
  }

  // How a light looks while it is off: 'unlit', in the design's unlit colour (dark grey) as a real dashboard's lamps, or
  // 'hidden'. Only lights that show, blink or fade a panel, a line, a text or an icon can be unlit; the light's own
  // "When off" goes before the design's "Lights that are off".
  function lightOffLook(design, el) {
    const l = el.light;
    if (!l || !l.when) return 'hidden';
    if (el.type !== 'rect' && el.type !== 'line' && el.type !== 'text' && el.type !== 'image') return 'hidden';
    const eff = l.effect || 'show';
    if (eff !== 'show' && eff !== 'blink' && eff !== 'flash') return 'hidden';
    if (l.offLook === 'unlit' || l.offLook === 'hidden') return l.offLook;
    return design.offLights === 'hidden' ? 'hidden' : 'unlit';
  }
  function unlitColorOf(design) {
    return /^#[0-9a-f]{6}$/i.test(String(design.offColor || '')) ? design.offColor : '#4d545c';
  }

  // A D.O.P.E. lamp in the preview: 0 off, 1 lit, 2 flashing.
  // -1 for a lamp the car does not have (optional lamps only).
  function lampOf(state, key) {
    const v = Math.max(-1, Math.min(2, Math.round(num((state.lamps || {})[key], 0))));
    return v < 0 && !(ctLamp(key) || {}).optional ? 0 : v;
  }

  // True while a lit light also blinks: the blink effect, or a flashing D.O.P.E. lamp shown as D.O.P.E. gives it.
  function lightBlinks(design, el, state) {
    const l = el.light;
    if (!l || !l.when || !lightOn(design, el, state)) return false;
    if (l.effect === 'blink' || l.effect === 'blinkSteady') return true;
    return l.when === 'ct' && lampOf(state, l.lamp) === 2 && (l.effect === 'show' || l.effect === 'color' || !l.effect);
  }

  function lightOn(design, el, state) {
    const l = el.light;
    if (!l || !l.when) return null;
    switch (l.when) {
      case 'ct': return lampOf(state, l.lamp) >= 1;
      case 'flag': return !!(state.flags || {})[l.flag];
      case 'rpmAbove': return num(state.rpm) >= rpmMax(design, state) * num(l.threshold, 0.9);
      case 'speedAbove': return displaySpeed(design, state) >= num(l.threshold, 100);
      case 'fuelBelow': return num(state.fuel, 1) <= num(l.threshold, 0.15);
      default: return null;
    }
  }

  function litCount(el, fraction) {
    const n = Math.max(1, Math.round(num(el.segments, 1)));
    return Math.max(0, Math.min(n, Math.round(clamp01(fraction) * n)));
  }

  function redFromIndex(el) {
    const n = Math.max(1, Math.round(num(el.segments, 1)));
    return Math.round(n * clamp01(num(el.redFrom, 1)));
  }

  // ------------------------------------------------------------- formatting

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  }
  function clamp01(v) { return Math.max(0, Math.min(1, num(v))); }

  function f(v) {
    let n = Math.round(num(v) * 1000) / 1000;
    if (Object.is(n, -0)) n = 0;
    const s = String(n);
    return /[.e]/.test(s) ? s : s + '.0';
  }

  function int(v) { return String(Math.round(num(v))); }

  function str(s) {
    return '"' + String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n') + '"';
  }

  function cname(s) {
    return 'n' + str(s);
  }

  function resref(path) {
    const p = String(path || '').trim().replace(/\//g, '\\').replace(/\\+/g, '\\');
    return 'r"' + p.replace(/\\/g, '\\\\').replace(/"/g, '') + '"';
  }

  function rgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    const v = m ? parseInt(m[1], 16) : 0xffffff;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function color(hex) {
    const [r, g, b] = rgb(hex);
    return 'new HDRColor(' + f(r / 255) + ', ' + f(g / 255) + ', ' + f(b / 255) + ', 1.0)';
  }

  function ident(s, fallback) {
    let out = String(s || '').replace(/[^A-Za-z0-9_]+/g, ' ').trim()
      .split(/\s+/).filter(Boolean)
      .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join('');
    if (!out) out = fallback || 'Dash';
    if (/^[0-9]/.test(out)) out = '_' + out;
    return out;
  }

  function pascal(s, fallback) {
    const id = ident(s, fallback);
    return id[0] === '_' ? id : id[0].toUpperCase() + id.slice(1);
  }

  // ---------------------------------------------------------------- checks

  function check(design) {
    const problems = [];
    const els = design.elements || [];
    els.forEach((el) => {
      const label = '"' + (el.name || el.type) + '"';
      if (el.type === 'image' && !String(el.atlas || '').trim()) {
        problems.push(label + ' has no atlas path, so it exports as a plain box.');
      }
      if (el.type === 'image' && String(el.atlas || '').trim() && !String(el.part || '').trim()) {
        problems.push(label + ' has an atlas but no part name.');
      }
      if ((el.type === 'arc' || el.type === 'bar' || el.type === 'needle')
        && el.source === 'value' && !String(el.valueName || '').trim()) {
        problems.push(label + ' follows a custom value but the value has no name.');
      }
      if (el.light && el.light.when === 'flag' && !String(el.light.flag || '').trim()) {
        problems.push(label + ' lights up on a flag but the flag has no name.');
      }
      if (el.light && el.light.when === 'flag' && String(el.light.flag || '').trim()
        && !/^[A-Za-z0-9_]+$/.test(String(el.light.flag).trim())) {
        problems.push(label + '\'s flag name has spaces or symbols. A flag is a short name such as lowBeam, not code.');
      }
      if (hasRange(el) && clamp01(num(el.rangeTo, 1)) <= clamp01(num(el.rangeFrom, 0))) {
        problems.push(label + ' is full before it starts lighting. Set "Full at" above "Starts at".');
      }
      if (el.light && el.light.when === 'ct' && !ctLamp(el.light.lamp)) {
        problems.push(label + ' lights up on a D.O.P.E. light, but none is picked.');
      }
      if (el.light && el.light.when === 'ct' && design.hook !== 'carTuning') {
        problems.push(label + ' follows a D.O.P.E. light, but the dashboard is not fed from D.O.P.E., so it never lights.');
      }
      if (el.type === 'image' && ctIconFor(el.atlas) && String(el.part || '').trim() !== ctIconFor(el.atlas).part) {
        problems.push(label + ' uses D.O.P.E.\'s ' + ctIconFor(el.atlas).label.toLowerCase() + ' icon; its part is '
          + ctIconFor(el.atlas).part + '.');
      }
      if (el.type === 'numbers' && el.source === 'labels' && !dialLabels(el).length) {
        problems.push(label + ' has no labels. List them with commas, such as E, 1/2, F.');
      }
      if (el.type === 'numbers' && dialCount(design, el) > DIAL_MAX) {
        problems.push(label + ' would show ' + dialCount(design, el) + ' numbers; only the first ' + DIAL_MAX
          + ' are drawn. Raise "Every".');
      }
      if (el.type === 'text' && (el.content === 'odometer' || el.content === 'trip') && design.hook !== 'carTuning'
        && design.hook !== 'none') {
        problems.push(label + ' shows a distance, but only D.O.P.E. (or your own code, with SetDistance) sends one, so it shows ---.');
      }
      if (el.type === 'text' && el.locKey && !/^[A-Za-z0-9_.\-]+$/.test(el.locKey)) {
        problems.push(label + ' has a localization key with spaces or symbols.');
      }
    });
    if (design.hook === 'carTuning' && ident(design.module || '', '') === 'CarTuning') {
      problems.push('The module is CarTuning, which is D.O.P.E.\'s own. Give the dashboard a module of its own, or none.');
    }
    return problems;
  }

  // ---------------------------------------------------------------- export

  function generate(design, opts) {
    opts = opts || {};
    const C = pascal(design.className || design.name, 'Dash');
    const mod = design.module ? ident(design.module, '') : '';
    const sysName = (mod ? mod + '.' : '') + C + 'System';
    const W = Math.max(1, num(design.width, 640)), H = Math.max(1, num(design.height, 320));
    const els = (design.elements || []).filter((e) => e && e.type);
    const anchor = ANCHORS[design.anchor] ? design.anchor : 'BottomCenter';
    const [ax, ay] = ANCHORS[anchor];
    const metricDefault = design.units !== 'mph';
    const speedMax = Math.max(1, num(design.speedMax, 260));
    const rpmDefault = Math.max(500, num(design.rpmMax, 8000));
    const hookMode = design.hook === 'none' ? 'none' : (design.hook === 'carTuning' ? 'carTuning' : 'stock');
    const hook = hookMode !== 'none';
    const ct = hookMode === 'carTuning';
    const dark = ct && design.darkWithoutPower !== false;
    // without power: unlit (dimmed, every light off) unless the design hides it
    const unlit = dark && design.powerOff !== 'hidden';
    const unlitOpacity = Math.max(0.05, Math.min(1, num(design.unlitOpacity, 0.25)));
    const lampsUsed = [...new Set(els.filter((e) => e.light && e.light.when === 'ct'
      && ctLamp(e.light.lamp)).map((e) => e.light.lamp))];
    const usesLoc = els.some((e) => e.type === 'text' && (e.locKey || e.locKeyMetric || e.locKeyImperial));

    // Field names for the elements the script has to reach again after building.
    const used = new Set();
    const field = (el, suffix) => {
      const base = 'm_' + ident(el.name, el.type + el.id);
      let nameOut = base + (suffix || '');
      let i = 2;
      while (used.has(nameOut)) { nameOut = base + i + (suffix || ''); i++; }
      used.add(nameOut);
      return nameOut;
    };

    const live = [];   // { el, field, kind, flashField }
    els.forEach((el) => {
      const isGauge = el.type === 'arc' || el.type === 'bar';
      const boundGauge = isGauge && el.source && el.source !== 'static';
      const boundNeedle = el.type === 'needle';
      const boundText = el.type === 'text' && el.content && el.content !== 'static';
      const boundNumbers = el.type === 'numbers';
      const lit = el.light && el.light.when;
      if (boundGauge || boundNeedle || boundText || boundNumbers || lit) {
        const entry = { el: el, field: field(el) };
        if (lit && el.light.effect === 'flash') entry.flashField = field(el, 'Flash');
        live.push(entry);
      }
    });
    const liveOf = (el) => live.find((l) => l.el === el);

    const L = [];
    const out = (s) => L.push(s);

    const stamp = opts.date || new Date().toISOString().slice(0, 10);
    out('// ' + C + '.reds: generated by Redline Ink on ' + stamp + ' from the design ' + str(design.name || C) + '.');
    out('// Drawn at ' + int(W) + ' x ' + int(H) + '. Change the design and export again rather than editing this file.');
    out('//');
    out('// Needs ' + (ct ? 'D.O.P.E. and Codeware' : 'nothing beyond redscript') + (usesLoc
      ? '. Localization keys resolve through your mod\'s Codeware localization when it is installed;' : '.'));
    if (usesLoc) out('// without it the English text from the design is shown.');
    out('//');
    out('// Reach the dashboard from your own scripts:');
    out('//   let dash: ref<' + C + '> = ' + C + 'System.Get(GetGameInstance()).Dash();');
    out('//   dash.SetFuel(0.42);                // 0..1');
    out('//   dash.SetFlag(n"traction", true);   // lights tied to a flag');
    out('//   dash.SetValue(n"boost", 0.6);      // gauges tied to a custom value');
    if (ct) {
      out('// Fed by D.O.P.E. (needs D.O.P.E. and Codeware): speed, RPM and gear from the car, fuel and lights from');
      out('// D.O.P.E.\'s dashboard feed, on every update while V drives (see the hook-up at the end). It shows in a');
      out('// window of its own on the game\'s HUD layer and goes as V gets out. Without D.O.P.E. or Codeware the');
      out('// hook-up is left out when the scripts compile, so a dashboard left behind does nothing and breaks nothing.');
    } else if (hook) {
      out('// Speed, RPM and gear come from the stock car HUD automatically (see the hook-up at the end).');
    } else {
      out('// Attach it with dash.Attach(parentWidget) and feed it with SetSpeed, SetRpm and SetGear.');
    }
    if (mod) { out(''); out('module ' + mod); }
    if (ct && mod !== 'CarTuning') { out(''); out(CT_GUARD); out('import CarTuning.*'); }

    // ---- segments class
    out('');
    out('// Lights a run of segments (an arc or a bar) up to a fraction of full scale.');
    out('public class ' + C + 'Segments extends IScriptable {');
    out('  public let m_parts: array<wref<inkRectangle>>;');
    out('  public let m_on: HDRColor;');
    out('  public let m_off: HDRColor;');
    out('  public let m_redOn: HDRColor;');
    out('  public let m_redOff: HDRColor;');
    out('  public let m_redFrom: Int32;');
    out('  // the container the segments are drawn in, which a light shows, hides, blinks or fades');
    out('  public let m_group: wref<inkCanvas>;');
    out('  private let m_lit: Int32;');
    out('  private let m_painted: Bool;');
    out('  private let m_fraction: Float;');
    out('  private let m_lightOn: Bool;');
    out('  private let m_lightColor: HDRColor;');
    out('');
    out('  public func Add(part: ref<inkRectangle>) -> Void {');
    out('    ArrayPush(this.m_parts, part);');
    out('  }');
    out('');
    out('  // Only segments whose state changes are recoloured.');
    out('  public func SetFraction(fraction: Float) -> Void {');
    out('    this.m_fraction = fraction;');
    out('    let count: Int32 = ArraySize(this.m_parts);');
    out('    let lit: Int32 = Clamp(RoundF(ClampF(fraction, 0.0, 1.0) * Cast<Float>(count)), 0, count);');
    out('    if this.m_painted && lit == this.m_lit {');
    out('      return;');
    out('    };');
    out('    let from: Int32 = this.m_painted ? Min(lit, this.m_lit) : 0;');
    out('    let to: Int32 = this.m_painted ? Max(lit, this.m_lit) : count;');
    out('    let i: Int32 = from;');
    out('    while i < to {');
    out('      if i < lit && this.m_lightOn {');
    out('        this.m_parts[i].SetTintColor(this.m_lightColor);');
    out('      } else if i >= this.m_redFrom {');
    out('        this.m_parts[i].SetTintColor(i < lit ? this.m_redOn : this.m_redOff);');
    out('      } else {');
    out('        this.m_parts[i].SetTintColor(i < lit ? this.m_on : this.m_off);');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('    this.m_lit = lit;');
    out('    this.m_painted = true;');
    out('  }');
    out('');
    out('  // A light changing the colour of the lit segments.');
    out('  public func SetLight(on: Bool, color: HDRColor) -> Void {');
    out('    if Equals(on, this.m_lightOn) {');
    out('      return;');
    out('    };');
    out('    this.m_lightOn = on;');
    out('    this.m_lightColor = color;');
    out('    this.m_painted = false;');
    out('    this.SetFraction(this.m_fraction);');
    out('  }');
    out('}');

    // ---- numbers class
    if (els.some((e) => e.type === 'numbers')) {
      out('');
      out('// Numbers around a dial, each at its share of full scale on the circle: upright, or turned along it and');
      out('// flipped on its lower half so none reads upside down.');
      out('public class ' + C + 'Numbers extends IScriptable {');
      out('  // the container the numbers are drawn in, which a light shows, hides, blinks or fades');
      out('  public let m_group: wref<inkCanvas>;');
      out('  public let m_cx: Float;');
      out('  public let m_cy: Float;');
      out('  public let m_r: Float;');
      out('  public let m_start: Float;');
      out('  public let m_sweep: Float;');
      out('  public let m_along: Bool;');
      out('  public let m_font: String;');
      out('  public let m_style: CName;');
      out('  public let m_size: Int32;');
      out('  public let m_w: Float;');
      out('  public let m_h: Float;');
      out('  public let m_color: HDRColor;');
      out('  public let m_redColor: HDRColor;');
      out('  public let m_redFrom: Float;');
      out('  public let m_opacity: Float;');
      out('  // the full-scale RPM the numbers were last laid out for (RPM numbers only)');
      out('  public let m_laidFor: Float;');
      out('  private let m_labels: array<wref<inkText>>;');
      out('  private let m_fractions: array<Float>;');
      out('  private let m_lightOn: Bool;');
      out('  private let m_lightColor: HDRColor;');
      out('');
      out('  // Removes every number, to lay them out again.');
      out('  public func Clear() -> Void {');
      out('    if IsDefined(this.m_group) {');
      out('      this.m_group.RemoveAllChildren();');
      out('    };');
      out('    ArrayClear(this.m_labels);');
      out('    ArrayClear(this.m_fractions);');
      out('  }');
      out('');
      out('  // A number at a share of full scale, 0..1.');
      out('  public func Add(value: String, fraction: Float) -> Void {');
      out('    if !IsDefined(this.m_group) {');
      out('      return;');
      out('    };');
      out('    let deg: Float = this.m_start + this.m_sweep * fraction;');
      out('    let label: ref<inkText> = new inkText();');
      out('    label.SetFontFamily(this.m_font);');
      out('    label.SetFontStyle(this.m_style);');
      out('    label.SetFontSize(this.m_size);');
      out('    label.SetLetterCase(textLetterCase.OriginalCase);');
      out('    label.SetAnchor(inkEAnchor.TopLeft);');
      out('    label.SetAnchorPoint(new Vector2(0.5, 0.5));');
      out('    label.SetMargin(new inkMargin(this.m_cx + this.m_r * CosF(Deg2Rad(deg)), this.m_cy + this.m_r * SinF(Deg2Rad(deg)), 0.0, 0.0));');
      out('    label.SetSize(new Vector2(this.m_w, this.m_h));');
      out('    label.SetFitToContent(false);');
      out('    label.SetHorizontalAlignment(textHorizontalAlignment.Center);');
      out('    label.SetVerticalAlignment(textVerticalAlignment.Center);');
      out('    if this.m_along {');
      out('      let turn: Float = deg + 90.0;');
      out('      while turn >= 180.0 {');
      out('        turn -= 360.0;');
      out('      };');
      out('      while turn < -180.0 {');
      out('        turn += 360.0;');
      out('      };');
      out('      if AbsF(turn) > 90.0 {');
      out('        turn += 180.0;');
      out('      };');
      out('      label.SetRotation(turn);');
      out('    };');
      out('    label.SetOpacity(this.m_opacity);');
      out('    label.SetText(value);');
      out('    label.SetInteractive(false);');
      out('    label.Reparent(this.m_group);');
      out('    ArrayPush(this.m_labels, label);');
      out('    ArrayPush(this.m_fractions, fraction);');
      out('    this.Paint(ArraySize(this.m_labels) - 1);');
      out('  }');
      out('');
      out('  // A light changing the colour of the numbers; the red ones stay red.');
      out('  public func SetLight(on: Bool, color: HDRColor) -> Void {');
      out('    if Equals(on, this.m_lightOn) {');
      out('      return;');
      out('    };');
      out('    this.m_lightOn = on;');
      out('    this.m_lightColor = color;');
      out('    let i: Int32 = 0;');
      out('    let count: Int32 = ArraySize(this.m_labels);');
      out('    while i < count {');
      out('      this.Paint(i);');
      out('      i += 1;');
      out('    };');
      out('  }');
      out('');
      out('  private func Paint(i: Int32) -> Void {');
      out('    if this.m_fractions[i] >= this.m_redFrom - 0.0001 {');
      out('      this.m_labels[i].SetTintColor(this.m_redColor);');
      out('    } else {');
      out('      this.m_labels[i].SetTintColor(this.m_lightOn ? this.m_lightColor : this.m_color);');
      out('    };');
      out('  }');
      out('}');
    }

    // ---- dashboard class
    out('');
    out('public class ' + C + ' extends IScriptable {');
    out('  private let m_root: wref<inkCanvas>;');
    out('  private let m_parent: wref<inkCompoundWidget>;');
    out('  private let m_vehicle: wref<VehicleObject>;');
    out('  private let m_ready: Bool;');
    out('  private let m_speed: Float;');
    out('  private let m_rpm: Float;');
    out('  private let m_rpmMax: Float;');
    out('  private let m_gear: Int32;');
    out('  private let m_fuel: Float;');
    out('  private let m_odometer: Float;');
    out('  private let m_trip: Float;');
    out('  private let m_metric: Bool;');
    out('  private let m_flags: array<CName>;');
    out('  private let m_valueNames: array<CName>;');
    out('  private let m_values: array<Float>;');
    out('  private let m_lampNames: array<CName>;');
    out('  private let m_lampStates: array<Int32>;');
    out('  private let m_sizeFactor: Float;');
    out('  private let m_powered: Bool;');
    live.forEach((l) => {
      const el = l.el;
      let type = 'wref<inkRectangle>';
      if (el.type === 'arc' || el.type === 'bar') type = 'ref<' + C + 'Segments>';
      else if (el.type === 'numbers') type = 'ref<' + C + 'Numbers>';
      else if (el.type === 'text') type = 'wref<inkText>';
      else if (el.type === 'image') type = String(el.atlas || '').trim() ? 'wref<inkImage>' : 'wref<inkRectangle>';
      out('  private let ' + l.field + ': ' + type + ';' + '  // ' + (el.name || el.type));
      if (l.flashField) out('  private let ' + l.flashField + ': ref<inkAnimProxy>;');
    });

    // defaults
    out('');
    out('  private func Defaults() -> Void {');
    out('    if this.m_ready {');
    out('      return;');
    out('    };');
    out('    this.m_ready = true;');
    out('    this.m_rpmMax = ' + f(rpmDefault) + ';');
    out('    this.m_fuel = 1.0;');
    out('    this.m_odometer = -1.0;');
    out('    this.m_trip = -1.0;');
    out('    this.m_gear = 1;');
    out('    this.m_metric = ' + (metricDefault ? 'true' : 'false') + ';');
    out('    this.m_powered = true;');
    out('  }');

    // attach / detach
    out('');
    out('  public func IsAttachedTo(parent: ref<inkCompoundWidget>) -> Bool {');
    out('    return IsDefined(this.m_root) && IsDefined(this.m_parent) && this.m_parent == parent;');
    out('  }');
    out('');
    out('  // Builds the dashboard inside parent. Does nothing if it is already there.');
    out('  public func Attach(parent: ref<inkCompoundWidget>) -> Void {');
    out('    if !IsDefined(parent) || this.IsAttachedTo(parent) {');
    out('      return;');
    out('    };');
    out('    this.Defaults();');
    out('    this.Detach();');
    out('    let root: ref<inkCanvas> = new inkCanvas();');
    out('    root.SetName(' + cname(C) + ');');
    out('    root.SetAnchor(inkEAnchor.' + anchor + ');');
    out('    root.SetAnchorPoint(new Vector2(' + f(ax) + ', ' + f(ay) + '));');
    out('    root.SetSize(new Vector2(' + f(W) + ', ' + f(H) + '));');
    out('    root.SetTranslation(new Vector2(' + f(design.offsetX) + ', ' + f(design.offsetY) + '));');
    const sc = num(design.scale, 1) || 1;
    out('    // scaled from the anchored corner, so a larger dashboard grows away from the screen\'s edge');
    out('    root.SetRenderTransformPivot(new Vector2(' + f(ax) + ', ' + f(ay) + '));');
    out('    let size: Float = ' + f(sc) + ' * (this.m_sizeFactor > 0.0 ? this.m_sizeFactor : 1.0);');
    out('    root.SetScale(new Vector2(size, size));');
    out('    root.SetInteractive(false);');
    out('    root.Reparent(parent);');
    out('    this.m_root = root;');
    out('    this.m_parent = parent;');
    out('    this.Build(root);');
    out('    this.RefreshAll();');
    out('    this.ShowPower();');
    out('  }');
    out('');
    out('  public func Detach() -> Void {');
    out('    if IsDefined(this.m_root) && IsDefined(this.m_parent) {');
    out('      this.m_parent.RemoveChild(this.m_root);');
    out('    };');
    out('    this.m_root = null;');
    out('    this.m_parent = null;');
    out('  }');
    out('');
    out('  public func DetachFrom(parent: ref<inkCompoundWidget>) -> Void {');
    out('    if this.IsAttachedTo(parent) {');
    out('      this.Detach();');
    out('    };');
    out('  }');

    // setters
    out('');
    out('  // Speed as the game reports it, in metres per second; shown in km/h or mph.');
    out('  public func SetSpeed(metersPerSecond: Float) -> Void {');
    out('    this.Defaults();');
    out('    this.m_speed = AbsF(metersPerSecond);');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshSpeed();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  public func SetRpm(rpm: Float) -> Void {');
    out('    this.Defaults();');
    out('    this.m_rpm = MaxF(0.0, rpm);');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshRpm();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  // The RPM at full scale on RPM gauges.');
    out('  public func SetRpmMax(rpm: Float) -> Void {');
    out('    this.Defaults();');
    out('    if rpm > 0.0 {');
    out('      this.m_rpmMax = rpm;');
    out('    };');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshRpm();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  public func SetGear(gear: Int32) -> Void {');
    out('    this.Defaults();');
    out('    this.m_gear = gear;');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshGear();');
    out('    };');
    out('  }');
    out('');
    out('  // Fuel left, 0..1.');
    out('  public func SetFuel(fraction: Float) -> Void {');
    out('    this.Defaults();');
    out('    this.m_fuel = ClampF(fraction, 0.0, 1.0);');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshFuel();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  // The distance on the car and its trip, in km (below 0: none yet). Shown in km or miles, as the speed.');
    out('  public func SetDistance(odometerKm: Float, tripKm: Float) -> Void {');
    out('    this.Defaults();');
    out('    this.m_odometer = odometerKm;');
    out('    this.m_trip = tripKm;');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshDistance();');
    out('    };');
    out('  }');
    out('');
    out('  // true shows km/h, false shows mph.');
    out('  public func SetMetric(metric: Bool) -> Void {');
    out('    this.Defaults();');
    out('    this.m_metric = metric;');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshSpeed();');
    out('      this.RefreshUnits();');
    out('      this.RefreshDistance();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  // A custom value for gauges and needles set to follow it, 0..1.');
    out('  public func SetValue(name: CName, fraction: Float) -> Void {');
    out('    this.Defaults();');
    out('    let i: Int32 = 0;');
    out('    let count: Int32 = ArraySize(this.m_valueNames);');
    out('    while i < count {');
    out('      if Equals(this.m_valueNames[i], name) {');
    out('        this.m_values[i] = ClampF(fraction, 0.0, 1.0);');
    out('        this.RefreshIfShown();');
    out('        return;');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('    ArrayPush(this.m_valueNames, name);');
    out('    ArrayPush(this.m_values, ClampF(fraction, 0.0, 1.0));');
    out('    this.RefreshIfShown();');
    out('  }');
    out('');
    out('  // A D.O.P.E. lamp for the lights that follow it: 0 off, 1 lit, 2 flashing. Call Tick() after setting them.');
    out('  public func SetLamp(name: CName, state: Int32) -> Void {');
    out('    let i: Int32 = 0;');
    out('    let count: Int32 = ArraySize(this.m_lampNames);');
    out('    while i < count {');
    out('      if Equals(this.m_lampNames[i], name) {');
    out('        this.m_lampStates[i] = state;');
    out('        return;');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('    ArrayPush(this.m_lampNames, name);');
    out('    ArrayPush(this.m_lampStates, state);');
    out('  }');
    out('');
    out('  // Brings the lights up to date; call it on every update so blinking lights blink.');
    out('  public func Tick() -> Void {');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  // The player\'s size on top of the designed scale (D.O.P.E.\'s "Dashboard size"): 1 is as designed.');
    out('  public func SetSizeFactor(factor: Float) -> Void {');
    out('    if factor <= 0.0 || factor == this.m_sizeFactor {');
    out('      return;');
    out('    };');
    out('    this.m_sizeFactor = factor;');
    out('    if IsDefined(this.m_root) {');
    out('      let size: Float = ' + f(num(design.scale, 1) || 1) + ' * factor;');
    out('      this.m_root.SetScale(new Vector2(size, size));');
    out('    };');
    out('  }');
    out('');
    out(unlit ? '  // The whole dashboard lit, or unlit without the car\'s power: dimmed, with every light off.'
      : '  // The whole dashboard shown, or hidden without the car\'s power.');
    out('  public func SetPowered(on: Bool) -> Void {');
    out('    this.Defaults();');
    out('    let changed: Bool = NotEquals(on, this.m_powered);');
    out('    this.m_powered = on;');
    out('    this.ShowPower();');
    out('    if changed && IsDefined(this.m_root) {');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');
    out('');
    out('  private func ShowPower() -> Void {');
    out('    if !IsDefined(this.m_root) {');
    out('      return;');
    out('    };');
    if (unlit) {
      out('    let opacity: Float = this.m_powered ? 1.0 : ' + f(unlitOpacity) + ';');
      out('    if this.m_root.GetOpacity() != opacity {');
      out('      this.m_root.SetOpacity(opacity);');
      out('    };');
    } else {
      out('    if NotEquals(this.m_root.IsVisible(), this.m_powered) {');
      out('      this.m_root.SetVisible(this.m_powered);');
      out('    };');
    }
    out('  }');
    out('');
    out('  // Turns a named flag on or off for the lights that follow it.');
    out('  public func SetFlag(name: CName, on: Bool) -> Void {');
    out('    this.Defaults();');
    out('    let has: Bool = ArrayContains(this.m_flags, name);');
    out('    if on && !has {');
    out('      ArrayPush(this.m_flags, name);');
    out('    };');
    out('    if !on && has {');
    out('      ArrayRemove(this.m_flags, name);');
    out('    };');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');

    // stock HUD helpers
    out('');
    out('  // Reads the full-scale RPM from the car\'s engine data when the car changes.');
    out('  public func UseVehicle(vehicle: ref<VehicleObject>) -> Void {');
    out('    if !IsDefined(vehicle) || this.m_vehicle == vehicle {');
    out('      return;');
    out('    };');
    out('    this.m_vehicle = vehicle;');
    if (design.rpmFromCar !== false) {
      out('    let record = vehicle.GetRecord();');
      out('    if IsDefined(record) && IsDefined(record.VehEngineData()) {');
      out('      let maxRpm: Float = record.VehEngineData().MaxRPM();');
      out('      if maxRpm > 500.0 && maxRpm < 30000.0 {');
      out('        this.SetRpmMax(maxRpm);');
      out('      };');
      out('    };');
    }
    out('  }');
    out('');
    out('  // Hides everything else in the parent widget (the stock gauges), keeping only this dashboard.');
    out('  public func HideOthers() -> Void {');
    out('    if !IsDefined(this.m_parent) {');
    out('      return;');
    out('    };');
    out('    let count: Int32 = this.m_parent.GetNumChildren();');
    out('    let i: Int32 = 0;');
    out('    while i < count {');
    out('      let child: ref<inkWidget> = this.m_parent.GetWidgetByIndex(i);');
    out('      if IsDefined(child) && !Equals(child.GetName(), ' + cname(C) + ') && child.GetOpacity() != 0.0 {');
    out('        child.SetOpacity(0.0);');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('  }');

    // value helpers
    out('');
    out('  private func DisplaySpeed() -> Float {');
    out('    return this.m_metric ? this.m_speed * ' + f(MPS_TO_KMH) + ' : this.m_speed * ' + f(MPS_TO_MPH) + ';');
    out('  }');
    out('');
    out('  // A distance in km as the dash shows it, in km or miles as the speed: whole units grouped (48,213), or a trip');
    out('  // to a tenth; --- before there is one.');
    out('  private func DistanceText(km: Float, tenths: Bool) -> String {');
    out('    if km < 0.0 {');
    out('      return "---";');
    out('    };');
    out('    let distance: Float = this.m_metric ? km : km / ' + f(KM_PER_MILE) + ';');
    out('    if tenths {');
    out('      let t: Int32 = FloorF(distance * 10.0);');
    out('      return this.Grouped(t / 10) + "." + IntToString(t % 10);');
    out('    };');
    out('    return this.Grouped(FloorF(distance));');
    out('  }');
    out('');
    out('  private func Grouped(n: Int32) -> String {');
    out('    let rest: Int32 = Max(n, 0);');
    out('    let text: String = "";');
    out('    while rest >= 1000 {');
    out('      let group: Int32 = rest % 1000;');
    out('      let pad: String = group < 10 ? "00" : (group < 100 ? "0" : "");');
    out('      text = "," + pad + IntToString(group) + text;');
    out('      rest = rest / 1000;');
    out('    };');
    out('    return IntToString(rest) + text;');
    out('  }');
    out('');
    out('  private func GetValue(name: CName) -> Float {');
    out('    let i: Int32 = 0;');
    out('    let count: Int32 = ArraySize(this.m_valueNames);');
    out('    while i < count {');
    out('      if Equals(this.m_valueNames[i], name) {');
    out('        return this.m_values[i];');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('    return 0.0;');
    out('  }');
    out('');
    out('  private func HasFlag(name: CName) -> Bool {');
    out('    return ArrayContains(this.m_flags, name);');
    out('  }');
    out('');
    out('  private func Lamp(name: CName) -> Int32 {');
    out('    let i: Int32 = 0;');
    out('    let count: Int32 = ArraySize(this.m_lampNames);');
    out('    while i < count {');
    out('      if Equals(this.m_lampNames[i], name) {');
    out('        return this.m_lampStates[i];');
    out('      };');
    out('      i += 1;');
    out('    };');
    out('    return 0;');
    out('  }');
    out('');
    if (els.some((e) => e.type === 'numbers' && e.source === 'rpm')) {
      out('  // RPM numbers in thousands up to the full-scale RPM, laid out again when it changes (each car has its own).');
      out('  private func RpmNumbers(numbers: ref<' + C + 'Numbers>, step: Int32) -> Void {');
      out('    if !IsDefined(numbers) || numbers.m_laidFor == this.m_rpmMax {');
      out('      return;');
      out('    };');
      out('    numbers.Clear();');
      out('    numbers.m_laidFor = this.m_rpmMax;');
      out('    let k: Int32 = 0;');
      out('    let n: Int32 = 0;');
      out('    while Cast<Float>(k) * 1000.0 <= this.m_rpmMax + 0.5 && n < ' + DIAL_MAX + ' {');
      out('      numbers.Add(IntToString(k), Cast<Float>(k) * 1000.0 / this.m_rpmMax);');
      out('      k += step;');
      out('      n += 1;');
      out('    };');
      out('  }');
      out('');
    }
    out('  // A gauge\'s own range of its source: from starts it lighting, to has it full.');
    out('  private func InRange(fraction: Float, from: Float, to: Float) -> Float {');
    out('    return ClampF((fraction - from) / MaxF(to - from, 0.001), 0.0, 1.0);');
    out('  }');
    out('');
    out('  // A lamp as D.O.P.E. gives it: steady while lit, four flashes a second while flashing.');
    out('  private func LampOn(name: CName) -> Bool {');
    out('    let state: Int32 = this.Lamp(name);');
    out('    return state == 1 || (state == 2 && this.Blink(4.0));');
    out('  }');
    out('');
    out('  // On for the first half of each of rate blinks a second, by the game\'s clock.');
    out('  private func Blink(rate: Float) -> Bool {');
    out('    let now: Float = EngineTime.ToFloat(GameInstance.GetTimeSystem(GetGameInstance()).GetSimTime());');
    out('    return FloorF(now * rate * 2.0) % 2 == 0;');
    out('  }');
    out('');
    if (design.gearMap === 'plain') {
      out('  // -1 is reverse and 0 is neutral.');
      out('  private func GearText(gear: Int32) -> String {');
      out('    if gear < 0 {');
      out('      return "R";');
      out('    };');
      out('    if gear == 0 {');
      out('      return "N";');
      out('    };');
      out('    return IntToString(gear);');
      out('  }');
    } else {
      out('  // As the stock HUD reports gears: 0 is reverse and -1 is neutral.');
      out('  private func GearText(gear: Int32) -> String {');
      out('    if gear == 0 {');
      out('      return "R";');
      out('    };');
      out('    if gear == -1 {');
      out('      return "N";');
      out('    };');
      out('    return IntToString(gear);');
      out('  }');
    }
    out('');
    out('  // Text from your mod\'s localization; the design\'s English text when the key is missing.');
    out('  private func Loc(key: CName, fallback: String) -> String {');
    out('    let text: String = GetLocalizedTextByKey(key);');
    out('    if Equals(text, "") || Equals(text, NameToString(key)) {');
    out('      return fallback;');
    out('    };');
    out('    return text;');
    out('  }');
    out('');
    out('  private func SetLabel(label: wref<inkText>, value: String) -> Void {');
    out('    if IsDefined(label) && NotEquals(label.GetText(), value) {');
    out('      label.SetText(value);');
    out('    };');
    out('  }');

    // widget factories
    out('');
    out('  private func Rect(parent: ref<inkCompoundWidget>, cx: Float, cy: Float, w: Float, h: Float,');
    out('    deg: Float, color: HDRColor, opacity: Float) -> ref<inkRectangle> {');
    out('    let rect: ref<inkRectangle> = new inkRectangle();');
    out('    rect.SetAnchor(inkEAnchor.TopLeft);');
    out('    rect.SetAnchorPoint(new Vector2(0.5, 0.5));');
    out('    rect.SetMargin(new inkMargin(cx, cy, 0.0, 0.0));');
    out('    rect.SetSize(new Vector2(w, h));');
    out('    rect.SetRotation(deg);');
    out('    rect.SetTintColor(color);');
    out('    rect.SetOpacity(opacity);');
    out('    rect.SetInteractive(false);');
    out('    rect.Reparent(parent);');
    out('    return rect;');
    out('  }');
    out('');
    out('  private func Image(parent: ref<inkCompoundWidget>, cx: Float, cy: Float, w: Float, h: Float,');
    out('    deg: Float, color: HDRColor, opacity: Float) -> ref<inkImage> {');
    out('    let image: ref<inkImage> = new inkImage();');
    out('    image.SetAnchor(inkEAnchor.TopLeft);');
    out('    image.SetAnchorPoint(new Vector2(0.5, 0.5));');
    out('    image.SetMargin(new inkMargin(cx, cy, 0.0, 0.0));');
    out('    image.SetSize(new Vector2(w, h));');
    out('    image.SetRotation(deg);');
    out('    image.SetTintColor(color);');
    out('    image.SetOpacity(opacity);');
    out('    image.SetInteractive(false);');
    out('    image.Reparent(parent);');
    out('    return image;');
    out('  }');
    out('');
    out('  // A container the size of the dashboard, for the segments of one arc or bar.');
    out('  private func Group(parent: ref<inkCompoundWidget>) -> ref<inkCanvas> {');
    out('    let group: ref<inkCanvas> = new inkCanvas();');
    out('    group.SetAnchor(inkEAnchor.TopLeft);');
    out('    group.SetSize(new Vector2(' + f(W) + ', ' + f(H) + '));');
    out('    group.SetInteractive(false);');
    out('    group.Reparent(parent);');
    out('    return group;');
    out('  }');
    out('');
    out('  // The needle\'s base is both where it is placed and what it turns around.');
    out('  private func Needle(parent: ref<inkCompoundWidget>, cx: Float, cy: Float, length: Float,');
    out('    thickness: Float, color: HDRColor, opacity: Float) -> ref<inkRectangle> {');
    out('    let needle: ref<inkRectangle> = new inkRectangle();');
    out('    needle.SetAnchor(inkEAnchor.TopLeft);');
    out('    needle.SetAnchorPoint(new Vector2(0.0, 0.5));');
    out('    needle.SetRenderTransformPivot(new Vector2(0.0, 0.5));');
    out('    needle.SetMargin(new inkMargin(cx, cy, 0.0, 0.0));');
    out('    needle.SetSize(new Vector2(length, thickness));');
    out('    needle.SetTintColor(color);');
    out('    needle.SetOpacity(opacity);');
    out('    needle.SetInteractive(false);');
    out('    needle.Reparent(parent);');
    out('    return needle;');
    out('  }');
    out('');
    out('  private func Text(parent: ref<inkCompoundWidget>, x: Float, y: Float, w: Float, h: Float,');
    out('    value: String, font: String, style: CName, size: Int32, align: Int32, color: HDRColor,');
    out('    opacity: Float) -> ref<inkText> {');
    out('    let text: ref<inkText> = new inkText();');
    out('    text.SetFontFamily(font);');
    out('    text.SetFontStyle(style);');
    out('    text.SetFontSize(size);');
    out('    text.SetLetterCase(textLetterCase.OriginalCase);');
    out('    text.SetAnchor(inkEAnchor.TopLeft);');
    out('    text.SetMargin(new inkMargin(x, y, 0.0, 0.0));');
    out('    text.SetSize(new Vector2(w, h));');
    out('    text.SetFitToContent(false);');
    out('    if align == 0 {');
    out('      text.SetHorizontalAlignment(textHorizontalAlignment.Left);');
    out('    } else {');
    out('      if align == 2 {');
    out('        text.SetHorizontalAlignment(textHorizontalAlignment.Right);');
    out('      } else {');
    out('        text.SetHorizontalAlignment(textHorizontalAlignment.Center);');
    out('      };');
    out('    };');
    out('    text.SetVerticalAlignment(textVerticalAlignment.Center);');
    out('    text.SetTintColor(color);');
    out('    text.SetOpacity(opacity);');
    out('    text.SetText(value);');
    out('    text.SetInteractive(false);');
    out('    text.Reparent(parent);');
    out('    return text;');
    out('  }');
    out('');
    out('  // Fades the widget in and out while on; hides it while off.');
    out('  private func Flash(widget: ref<inkWidget>, on: Bool, period: Float, opacity: Float,');
    out('    proxy: ref<inkAnimProxy>) -> ref<inkAnimProxy> {');
    out('    if !IsDefined(widget) {');
    out('      return null;');
    out('    };');
    out('    if on {');
    out('      widget.SetVisible(true);');
    out('      if IsDefined(proxy) && proxy.IsPlaying() {');
    out('        return proxy;');
    out('      };');
    out('      let fade: ref<inkAnimTransparency> = new inkAnimTransparency();');
    out('      fade.SetStartTransparency(opacity);');
    out('      fade.SetEndTransparency(opacity * 0.15);');
    out('      fade.SetDuration(MaxF(0.05, period * 0.5));');
    out('      let anim: ref<inkAnimDef> = new inkAnimDef();');
    out('      anim.AddInterpolator(fade);');
    out('      let options: inkAnimOptions;');
    out('      options.loopType = inkanimLoopType.PingPong;');
    out('      options.loopInfinite = true;');
    out('      return widget.PlayAnimationWithOptions(anim, options);');
    out('    };');
    out('    if IsDefined(proxy) {');
    out('      proxy.Stop();');
    out('    };');
    out('    widget.SetOpacity(opacity);');
    out('    widget.SetVisible(false);');
    out('    return null;');
    out('  }');

    // build
    out('');
    out('  private func Build(root: ref<inkCanvas>) -> Void {');
    const needsSeg = els.some((e) => e.type === 'arc' || e.type === 'bar');
    if (needsSeg) {
      out('    let segments: ref<' + C + 'Segments>;');
      out('    let group: ref<inkCanvas>;');
    }
    if (els.some((e) => e.type === 'numbers')) out('    let numbers: ref<' + C + 'Numbers>;');
    els.forEach((el) => {
      const l = liveOf(el);
      const op = f(clamp01(num(el.opacity, 1)));
      const title = '    // ' + (el.name || el.type) + describe(el);
      out('');
      out(title);
      if (el.type === 'rect' || (el.type === 'image' && !String(el.atlas || '').trim())) {
        const b = boxRect(el);
        const call = 'this.Rect(root, ' + f(b.cx) + ', ' + f(b.cy) + ', ' + f(b.w) + ', ' + f(b.h) + ', '
          + f(b.deg) + ', ' + color(el.color) + ', ' + op + ')';
        out('    ' + (l ? 'this.' + l.field + ' = ' : '') + call + ';');
      } else if (el.type === 'image') {
        const b = boxRect(el);
        const v = l ? 'this.' + l.field : 'image' + el.id;
        if (!l) out('    let ' + v + ': ref<inkImage> = this.Image(root, ' + f(b.cx) + ', ' + f(b.cy) + ', '
          + f(b.w) + ', ' + f(b.h) + ', ' + f(b.deg) + ', ' + color(el.color) + ', ' + op + ');');
        else out('    ' + v + ' = this.Image(root, ' + f(b.cx) + ', ' + f(b.cy) + ', ' + f(b.w) + ', '
          + f(b.h) + ', ' + f(b.deg) + ', ' + color(el.color) + ', ' + op + ');');
        out('    ' + v + '.SetAtlasResource(' + resref(el.atlas) + ');');
        if (String(el.part || '').trim()) out('    ' + v + '.SetTexturePart(' + cname(String(el.part).trim()) + ');');
      } else if (el.type === 'line') {
        const b = lineRect(el);
        const call = 'this.Rect(root, ' + f(b.cx) + ', ' + f(b.cy) + ', ' + f(b.w) + ', ' + f(b.h) + ', '
          + f(b.deg) + ', ' + color(el.color) + ', ' + op + ')';
        out('    ' + (l ? 'this.' + l.field + ' = ' : '') + call + ';');
      } else if (el.type === 'arc' || el.type === 'bar') {
        out('    segments = new ' + C + 'Segments();');
        out('    segments.m_on = ' + color(el.colorOn) + ';');
        out('    segments.m_off = ' + color(el.colorOff) + ';');
        out('    segments.m_redOn = ' + color(el.colorRedOn) + ';');
        out('    segments.m_redOff = ' + color(el.colorRedOff) + ';');
        out('    segments.m_redFrom = ' + int(redFromIndex(el)) + ';');
        out('    group = this.Group(root);');
        out('    segments.m_group = group;');
        segmentsFor(el).forEach((s) => {
          out('    segments.Add(this.Rect(group, ' + f(s.cx) + ', ' + f(s.cy) + ', ' + f(s.w) + ', ' + f(s.h)
            + ', ' + f(s.deg) + ', ' + color(el.colorOff) + ', ' + op + '));');
        });
        if (l) out('    this.' + l.field + ' = segments;');
        if (!el.source || el.source === 'static') out('    segments.SetFraction(' + f(clamp01(num(el.staticFraction, 1))) + ');');
      } else if (el.type === 'needle') {
        out('    this.' + l.field + ' = this.Needle(root, ' + f(el.cx) + ', ' + f(el.cy) + ', ' + f(el.length)
          + ', ' + f(el.thickness) + ', ' + color(el.color) + ', ' + op + ');');
        if (!el.source || el.source === 'static') {
          out('    this.' + l.field + '.SetRotation(' + f(num(el.start, 135) + num(el.sweep, 270)
            * clamp01(num(el.staticFraction, 0))) + ');');
        }
      } else if (el.type === 'text') {
        const font = FONTS[el.font] ? el.font : 'raj';
        const style = FONTS[font].styles.includes(el.style) ? el.style : 'Regular';
        const align = el.align === 'left' ? 0 : el.align === 'right' ? 2 : 1;
        let value;
        if (!el.content || el.content === 'static') {
          value = el.locKey ? 'this.Loc(' + cname(el.locKey) + ', ' + str(el.text) + ')' : str(el.text);
        } else {
          value = '""';
        }
        const call = 'this.Text(root, ' + f(el.x) + ', ' + f(el.y) + ', ' + f(el.w) + ', ' + f(el.h) + ', '
          + value + ', ' + str(FONTS[font].path) + ', ' + cname(style) + ', ' + int(el.size) + ', '
          + align + ', ' + color(el.color) + ', ' + op + ')';
        out('    ' + (l ? 'this.' + l.field + ' = ' : '') + call + ';');
      } else if (el.type === 'numbers') {
        const font = FONTS[el.font] ? el.font : 'raj';
        const style = FONTS[font].styles.includes(el.style) ? el.style : 'Regular';
        const box = dialBox(el);
        out('    numbers = new ' + C + 'Numbers();');
        out('    numbers.m_group = this.Group(root);');
        out('    numbers.m_cx = ' + f(el.cx) + ';');
        out('    numbers.m_cy = ' + f(el.cy) + ';');
        out('    numbers.m_r = ' + f(num(el.r, 90)) + ';');
        out('    numbers.m_start = ' + f(num(el.start, 150)) + ';');
        out('    numbers.m_sweep = ' + f(num(el.sweep, 240)) + ';');
        out('    numbers.m_along = ' + (el.turn === 'along' ? 'true' : 'false') + ';');
        out('    numbers.m_font = ' + str(FONTS[font].path) + ';');
        out('    numbers.m_style = ' + cname(style) + ';');
        out('    numbers.m_size = ' + int(Math.max(4, num(el.size, 16))) + ';');
        out('    numbers.m_w = ' + f(box.w) + ';');
        out('    numbers.m_h = ' + f(box.h) + ';');
        out('    numbers.m_color = ' + color(el.color) + ';');
        out('    numbers.m_redColor = ' + color(el.colorRed) + ';');
        out('    numbers.m_redFrom = ' + f(dialRedFrom(el)) + ';');
        out('    numbers.m_opacity = ' + op + ';');
        out('    this.' + l.field + ' = numbers;');
        if (el.source === 'rpm') out('    // laid out for the full-scale RPM in RefreshRpm');
        else dialValues(design, el, {}).forEach((v) => out('    numbers.Add(' + str(v.text) + ', ' + f(v.fraction) + ');'));
      }
      if (l && l.flashField) out('    this.' + l.flashField + ' = null;');
    });
    out('  }');

    // refreshers
    const bySource = (src) => live.filter((l) => {
      const el = l.el;
      if (el.type === 'text') return el.content === src
        || (src === 'speed' && el.content === 'speed') || (src === 'rpm' && el.content === 'rpm1000');
      return (el.type === 'arc' || el.type === 'bar' || el.type === 'needle') && el.source === src;
    });

    const gaugeLine = (l, fraction) => {
      const el = l.el;
      if (el.type === 'needle') {
        return '    this.' + l.field + '.SetRotation(' + f(el.start) + ' + ' + f(el.sweep)
          + ' * ClampF(' + fraction + ', 0.0, 1.0));';
      }
      if (hasRange(el)) {
        fraction = 'this.InRange(' + fraction + ', ' + f(clamp01(num(el.rangeFrom, 0))) + ', ' + f(clamp01(num(el.rangeTo, 1))) + ')';
      }
      return '    this.' + l.field + '.SetFraction(' + fraction + ');';
    };

    out('');
    out('  private func RefreshAll() -> Void {');
    ['Speed', 'Rpm', 'Gear', 'Fuel', 'Units', 'Distance', 'Values', 'Lights'].forEach((n) => out('    this.Refresh' + n + '();'));
    out('  }');

    out('');
    out('  private func RefreshIfShown() -> Void {');
    out('    if IsDefined(this.m_root) {');
    out('      this.RefreshValues();');
    out('      this.RefreshLights();');
    out('    };');
    out('  }');

    out('');
    out('  private func RefreshSpeed() -> Void {');
    bySource('speed').forEach((l) => {
      if (l.el.type === 'text') out('    this.SetLabel(this.' + l.field + ', IntToString(RoundF(this.DisplaySpeed())));');
      else out(gaugeLine(l, 'this.DisplaySpeed() / ' + f(speedMax)));
    });
    out('  }');

    out('');
    out('  private func RefreshRpm() -> Void {');
    live.filter((l) => (l.el.type === 'text' && (l.el.content === 'rpm' || l.el.content === 'rpm1000'))
      || ((l.el.type === 'arc' || l.el.type === 'bar' || l.el.type === 'needle') && l.el.source === 'rpm'))
      .forEach((l) => {
        if (l.el.type === 'text' && l.el.content === 'rpm') out('    this.SetLabel(this.' + l.field + ', IntToString(RoundF(this.m_rpm)));');
        else if (l.el.type === 'text') out('    this.SetLabel(this.' + l.field + ', FloatToStringPrec(this.m_rpm / 1000.0, 1));');
        else out(gaugeLine(l, 'this.m_rpm / this.m_rpmMax'));
      });
    live.filter((l) => l.el.type === 'numbers' && l.el.source === 'rpm')
      .forEach((l) => out('    this.RpmNumbers(this.' + l.field + ', ' + int(dialStep(l.el)) + ');'));
    out('  }');

    out('');
    out('  private func RefreshGear() -> Void {');
    live.filter((l) => l.el.type === 'text' && l.el.content === 'gear')
      .forEach((l) => out('    this.SetLabel(this.' + l.field + ', this.GearText(this.m_gear));'));
    out('  }');

    out('');
    out('  private func RefreshFuel() -> Void {');
    live.filter((l) => (l.el.type === 'text' && l.el.content === 'fuelPct')
      || ((l.el.type === 'arc' || l.el.type === 'bar' || l.el.type === 'needle') && l.el.source === 'fuel'))
      .forEach((l) => {
        if (l.el.type === 'text') out('    this.SetLabel(this.' + l.field + ', IntToString(RoundF(this.m_fuel * 100.0)) + "%");');
        else out(gaugeLine(l, 'this.m_fuel'));
      });
    out('  }');

    out('');
    out('  private func RefreshUnits() -> Void {');
    live.filter((l) => l.el.type === 'text' && l.el.content === 'units').forEach((l) => {
      const el = l.el;
      const m = el.locKeyMetric ? 'this.Loc(' + cname(el.locKeyMetric) + ', ' + str(el.textMetric || 'km/h') + ')' : str(el.textMetric || 'km/h');
      const i = el.locKeyImperial ? 'this.Loc(' + cname(el.locKeyImperial) + ', ' + str(el.textImperial || 'mph') + ')' : str(el.textImperial || 'mph');
      out('    this.SetLabel(this.' + l.field + ', this.m_metric ? ' + m + ' : ' + i + ');');
    });
    live.filter((l) => l.el.type === 'text' && l.el.content === 'distUnits')
      .forEach((l) => out('    this.SetLabel(this.' + l.field + ', this.m_metric ? "km" : "mi");'));
    out('  }');

    out('');
    out('  private func RefreshDistance() -> Void {');
    live.filter((l) => l.el.type === 'text' && (l.el.content === 'odometer' || l.el.content === 'trip'))
      .forEach((l) => out('    this.SetLabel(this.' + l.field + ', this.DistanceText('
        + (l.el.content === 'trip' ? 'this.m_trip, true' : 'this.m_odometer, false') + '));'));
    out('  }');

    out('');
    out('  private func RefreshValues() -> Void {');
    live.filter((l) => (l.el.type === 'arc' || l.el.type === 'bar' || l.el.type === 'needle') && l.el.source === 'value')
      .forEach((l) => out(gaugeLine(l, 'this.GetValue(' + cname(String(l.el.valueName || 'value').trim()) + ')')));
    out('  }');

    out('');
    out('  private func RefreshLights() -> Void {');
    const lights = live.filter((l) => l.el.light && l.el.light.when);
    if (lights.length) out('    let on: Bool;');
    lights.forEach((l) => {
      const el = l.el, lt = el.light;
      let cond;
      const asHud = lt.effect === 'show' || lt.effect === 'hide' || lt.effect === 'color' || !lt.effect;
      const lampKey = lt.when === 'ct' ? (ctLamp(lt.lamp) ? lt.lamp : 'traction') : '';
      if (lt.when === 'ct') {
        const lamp = cname(lampKey);
        cond = asHud ? 'this.LampOn(' + lamp + ')' : 'this.Lamp(' + lamp + ') >= 1';
      } else if (lt.when === 'flag') cond = 'this.HasFlag(' + cname(String(lt.flag || 'flag').trim()) + ')';
      else if (lt.when === 'rpmAbove') cond = 'this.m_rpm >= this.m_rpmMax * ' + f(num(lt.threshold, 0.9));
      else if (lt.when === 'speedAbove') cond = 'this.DisplaySpeed() >= ' + f(num(lt.threshold, 100));
      else cond = 'this.m_fuel <= ' + f(num(lt.threshold, 0.15));
      out('    on = ' + (dark ? 'this.m_powered && ' + (/ [|&?]/.test(cond) ? '(' + cond + ')' : cond) : cond) + ';  // ' + (el.name || el.type));
      const seg = el.type === 'arc' || el.type === 'bar' || el.type === 'numbers';
      const w = 'this.' + l.field + (seg ? '.m_group' : '');
      // a D.O.P.E. lamp the car may not have at all (-1): the part hidden then, whatever its effect
      const optional = lt.when === 'ct' && !!(ctLamp(lampKey) || {}).optional;
      const p = optional ? '      ' : '    ';
      if (optional) {
        out('    if this.Lamp(' + cname(lampKey) + ') < 0 {');
        out('      ' + w + '.SetVisible(false);  // not on this car');
        out('    } else {');
        out('      ' + w + '.SetVisible(true);');
      }
      if (lightOffLook(design, el) === 'unlit') {
        // shown in the unlit colour while off, as a real dashboard's lamps
        const lit = color(el.color), dim = color(unlitColorOf(design));
        if (lt.effect === 'flash') {
          out(p + 'this.' + l.flashField + ' = this.Flash(' + w + ', on, ' + f(num(lt.period, 0.6)) + ', '
            + f(clamp01(num(el.opacity, 1))) + ', this.' + l.flashField + ');');
          out(p + w + '.SetVisible(true);');
          out(p + w + '.SetTintColor(on ? ' + lit + ' : ' + dim + ');');
        } else if (lt.effect === 'blink') {
          out(p + w + '.SetTintColor(on && this.Blink(' + f(Math.max(0.5, num(lt.rate, 4))) + ') ? ' + lit + ' : ' + dim + ');');
        } else {
          out(p + w + '.SetTintColor(on ? ' + lit + ' : ' + dim + ');');
        }
      } else if (lt.effect === 'hide') out(p + w + '.SetVisible(!on);');
      else if (lt.effect === 'color' && seg) {
        out(p + 'this.' + l.field + '.SetLight(on, ' + color(lt.onColor) + ');');
      } else if (lt.effect === 'color') {
        out(p + w + '.SetTintColor(on ? ' + color(lt.onColor) + ' : ' + color(el.color) + ');');
      } else if (lt.effect === 'flash') {
        out(p + 'this.' + l.flashField + ' = this.Flash(' + w + ', on, ' + f(num(lt.period, 0.6)) + ', '
          + f(clamp01(num(el.opacity, 1))) + ', this.' + l.flashField + ');');
      } else if (lt.effect === 'blink') {
        out(p + w + '.SetVisible(on && this.Blink(' + f(Math.max(0.5, num(lt.rate, 4))) + '));');
      } else if (lt.effect === 'blinkSteady') {
        out(p + w + '.SetVisible(!on || this.Blink(' + f(Math.max(0.5, num(lt.rate, 4))) + '));');
      } else out(p + w + '.SetVisible(on);');
      if (optional) out('    }');
    });
    out('  }');
    out('}');

    // ---- system
    out('');
    out('// Holds the dashboard so any script can reach it.');
    out('public class ' + C + 'System extends ScriptableSystem {');
    out('  private let m_dash: ref<' + C + '>;');
    out('');
    out('  public func Dash() -> ref<' + C + '> {');
    out('    if !IsDefined(this.m_dash) {');
    out('      this.m_dash = new ' + C + '();');
    out('    };');
    out('    return this.m_dash;');
    out('  }');
    out('');
    out('  public static func Get(game: GameInstance) -> ref<' + C + 'System> {');
    out('    return GameInstance.GetScriptableSystemsContainer(game).Get(' + cname(sysName) + ') as ' + C + 'System;');
    out('  }');
    out('}');

    // ---- hook-up
    if (ct) {
      const F = C + 'ForCarTuning';
      out('');
      out('// ---- Hook-up (D.O.P.E.): the dashboard in a window of its own on the game\'s HUD layer, fed on every');
      out('// update while V drives: speed, RPM and gear from the car, fuel and lights from D.O.P.E.\'s dashboard feed');
      out('// (CarTuningDash). It goes as V gets out. Each part is left out without D.O.P.E. or Codeware.');
      out('');
      out(CT_GUARD);
      out('public func ' + F + '(vehicle: ref<VehicleObject>) -> Void {');
      out('  if !IsDefined(vehicle) {');
      out('    return;');
      out('  };');
      out('  let game: GameInstance = vehicle.GetGame();');
      out('  let system: ref<' + C + 'System> = ' + C + 'System.Get(game);');
      out('  let layer = GameInstance.GetInkSystem().GetLayer(n"inkHUDLayer");');
      out('  if !IsDefined(system) || !IsDefined(layer) {');
      out('    return;');
      out('  };');
      out('  let dash: ref<' + C + '> = system.Dash();');
      out('  dash.SetSizeFactor(CarTuningDash.Value(game, n"size"));');
      out('  dash.Attach(layer.GetVirtualWindow());');
      out('  dash.UseVehicle(vehicle);');
      out('  let board: ref<IBlackboard> = vehicle.GetBlackboard();');
      out('  dash.SetSpeed(Vector4.Length(vehicle.GetLinearVelocity()));');
      out('  dash.SetRpm(board.GetFloat(GetAllBlackboardDefs().Vehicle.RPMValue));');
      out('  dash.SetGear(board.GetInt(GetAllBlackboardDefs().Vehicle.GearValue));');
      out('  let fuel: Float = CarTuningDash.Value(game, n"fuel");');
      out('  if fuel >= 0.0 {');
      out('    dash.SetFuel(fuel);');
      out('  };');
      if (els.some((e) => e.type === 'text' && (e.content === 'odometer' || e.content === 'trip'))) {
        out('  dash.SetDistance(CarTuningDash.Value(game, n"odometer"), CarTuningDash.Value(game, n"trip"));');
      }
      lampsUsed.forEach((k) => out('  dash.SetLamp(' + cname(k) + ', CarTuningDash.Lamp(game, ' + cname(k) + '));'));
      if (dark) out('  dash.SetPowered(CarTuningDash.Lamp(game, n"power") >= 1);');
      out('  dash.Tick();');
      out('}');
      ['DriveEvents', 'DriverCombatEvents'].forEach((cls) => {
        out('');
        out(CT_GUARD);
        out('@wrapMethod(' + cls + ')');
        out('public func OnUpdate(timeDelta: Float, stateContext: ref<StateContext>, scriptInterface: ref<StateGameScriptInterface>) -> Void {');
        out('  wrappedMethod(timeDelta, stateContext, scriptInterface);');
        out('  ' + F + '(scriptInterface.owner as VehicleObject);');
        out('}');
      });
      out('');
      out('// Gone as V gets out.');
      out(CT_GUARD);
      out('@wrapMethod(VehicleComponent)');
      out('protected cb func OnUnmountingEvent(evt: ref<UnmountingEvent>) -> Bool {');
      out('  let result: Bool = wrappedMethod(evt);');
      out('  let vehicle: wref<VehicleObject> = this.GetVehicle();');
      out('  if IsDefined(vehicle) {');
      out('    let child: ref<GameObject> = GameInstance.FindEntityByID(vehicle.GetGame(), evt.request.lowLevelMountingInfo.childId) as GameObject;');
      out('    let system: ref<' + C + 'System> = ' + C + 'System.Get(vehicle.GetGame());');
      out('    if IsDefined(child) && child.IsPlayer() && IsDefined(system) {');
      out('      system.Dash().Detach();');
      out('    };');
      out('  };');
      out('  return result;');
      out('}');
      if (design.hideStock !== false) {
        out('');
        out('// The stock gauges hidden: the game shows them while V drives in third person.');
        [['OnSpeedValueChanged', 'speedValue', 'Float'], ['OnRpmValueChanged', 'rpmValue', 'Float'],
          ['OnGearValueChanged', 'gearValue', 'Int32']].forEach(([m, p, ty]) => {
          out(CT_GUARD);
          out('@wrapMethod(hudCarController)');
          out('protected cb func ' + m + '(' + p + ': ' + ty + ') -> Bool {');
          out('  this.GetRootWidget().SetOpacity(0.0);');
          out('  return wrappedMethod(' + p + ');');
          out('}');
          out('');
        });
        L.pop();
      }
    } else if (hook) {
      out('');
      out('// ---- Hook-up: shows the dashboard inside the stock car HUD and feeds it speed, RPM and gear.');
      out('');
      out('public func ' + C + 'ForStockHud(root: ref<inkCompoundWidget>, vehicle: ref<VehicleObject>) -> ref<' + C + '> {');
      out('  let system: ref<' + C + 'System> = ' + C + 'System.Get(GetGameInstance());');
      out('  if !IsDefined(system) || !IsDefined(root) {');
      out('    return null;');
      out('  };');
      out('  let dash: ref<' + C + '> = system.Dash();');
      out('  dash.Attach(root);');
      if (design.hideStock !== false) out('  dash.HideOthers();');
      out('  dash.UseVehicle(vehicle);');
      out('  return dash;');
      out('}');
      out('');
      out('@wrapMethod(hudCarController)');
      out('protected cb func OnInitialize() -> Bool {');
      out('  let result: Bool = wrappedMethod();');
      out('  ' + C + 'ForStockHud(this.GetRootCompoundWidget(), this.m_activeVehicle);');
      out('  return result;');
      out('}');
      out('');
      out('@wrapMethod(hudCarController)');
      out('protected cb func OnUninitialize() -> Bool {');
      out('  let system: ref<' + C + 'System> = ' + C + 'System.Get(GetGameInstance());');
      out('  if IsDefined(system) {');
      out('    system.Dash().DetachFrom(this.GetRootCompoundWidget());');
      out('  };');
      out('  return wrappedMethod();');
      out('}');
      out('');
      out('// The stock HUD reports speed in metres per second.');
      out('@wrapMethod(hudCarController)');
      out('protected cb func OnSpeedValueChanged(speedValue: Float) -> Bool {');
      out('  let result: Bool = wrappedMethod(speedValue);');
      out('  let dash: ref<' + C + '> = ' + C + 'ForStockHud(this.GetRootCompoundWidget(), this.m_activeVehicle);');
      out('  if IsDefined(dash) {');
      out('    dash.SetSpeed(speedValue);');
      out('  };');
      out('  return result;');
      out('}');
      out('');
      out('@wrapMethod(hudCarController)');
      out('protected cb func OnRpmValueChanged(rpmValue: Float) -> Bool {');
      out('  let result: Bool = wrappedMethod(rpmValue);');
      out('  let dash: ref<' + C + '> = ' + C + 'ForStockHud(this.GetRootCompoundWidget(), this.m_activeVehicle);');
      out('  if IsDefined(dash) {');
      out('    dash.SetRpm(rpmValue);');
      out('  };');
      out('  return result;');
      out('}');
      out('');
      out('@wrapMethod(hudCarController)');
      out('protected cb func OnGearValueChanged(gearValue: Int32) -> Bool {');
      out('  let result: Bool = wrappedMethod(gearValue);');
      out('  let dash: ref<' + C + '> = ' + C + 'ForStockHud(this.GetRootCompoundWidget(), this.m_activeVehicle);');
      out('  if IsDefined(dash) {');
      out('    dash.SetGear(gearValue);');
      out('  };');
      out('  return result;');
      out('}');
    }
    out('');
    return L.join('\n');
  }

  function describe(el) {
    const parts = [];
    if (el.type === 'arc' || el.type === 'bar' || el.type === 'needle') {
      const src = { speed: 'speed', rpm: 'RPM', fuel: 'fuel', value: 'value "' + (el.valueName || '') + '"' }[el.source];
      if (src) parts.push('follows ' + src);
    }
    if (el.type === 'text' && el.content && el.content !== 'static') parts.push('shows ' + el.content);
    if (el.type === 'numbers') {
      parts.push(el.source === 'labels' ? 'labels ' + dialLabels(el).join(' ')
        : el.source === 'rpm' ? 'RPM in thousands, every ' + dialStep(el) : 'speed, every ' + dialStep(el));
    }
    if (el.light && el.light.when) {
      const w = el.light.when === 'ct' ? 'D.O.P.E. light "' + ((ctLamp(el.light.lamp) || {}).label || el.light.lamp || '') + '"'
        : el.light.when === 'flag' ? 'flag "' + (el.light.flag || '') + '"'
        : el.light.when === 'rpmAbove' ? 'RPM above ' + Math.round(num(el.light.threshold, 0.9) * 100) + '%'
          : el.light.when === 'speedAbove' ? 'speed above ' + num(el.light.threshold, 100)
            : 'fuel below ' + Math.round(num(el.light.threshold, 0.15) * 100) + '%';
      parts.push(el.light.effect + ' on ' + w);
    }
    return parts.length ? ': ' + parts.join(', ') : '';
  }

  function fileNameFor(design) {
    return pascal(design.className || design.name, 'Dash') + '.reds';
  }

  function folderFor(design) {
    return design.module ? ident(design.module, 'Dash') : pascal(design.className || design.name, 'Dash');
  }

  // Where the export goes under r6/scripts: a dashboard fed from D.O.P.E. goes into D.O.P.E.'s Dashboards folder
  // (it still installs as a mod of its own); any other in a folder of its own.
  function installFolderFor(design) {
    return (design.hook === 'carTuning' ? 'CarTuning/Dashboards/' : '') + folderFor(design);
  }

  return {
    FONTS, ANCHORS, MPS_TO_KMH, MPS_TO_MPH, CT_LAMPS, CT_ICONS, ctLamp, ctIconFor, lampOf, lightBlinks,
    arcSegments, barSegments, lineRect, boxRect, segmentsFor,
    DIAL_MAX, dialNumbers, dialValues, dialPlace, dialTurn, dialBox, dialLabels, dialStep, dialCount,
    displaySpeed, rpmMax, sourceFraction, inRange, hasRange, textValue, gearText, lightOn, litCount, redFromIndex,
    lightOffLook, unlitColorOf,
    generate, check, fileNameFor, folderFor, installFolderFor, pascal, ident, rgb,
  };
});
