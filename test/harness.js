// Generates redscript from test designs that use every element type and option,
// and writes each into its own scratch r6/scripts folder for the game's compiler.
const fs = require('fs');
const path = require('path');
const gen = require('../generator.js');

const outRoot = process.argv[2];

const full = {
  name: 'Test Dash', className: 'RedlineTestDash', module: 'RedlineTest',
  width: 640, height: 320, anchor: 'BottomCenter', offsetX: 0, offsetY: -40, scale: 1,
  hook: 'stock', hideStock: true, units: 'kmh', speedMax: 260, rpmMax: 8000, rpmFromCar: true,
  gearMap: 'stock',
  elements: [
    { id: 'e1', type: 'rect', name: 'Backplate', x: 20, y: 20, w: 600, h: 280, rotation: 0, color: '#0b1014', opacity: 0.7 },
    { id: 'e2', type: 'line', name: 'Divider', x1: 40, y1: 250, x2: 600, y2: 250, thickness: 2, color: '#3a4a55', opacity: 1 },
    { id: 'e3', type: 'arc', name: 'Tach arc', cx: 320, cy: 210, r: 150, start: 150, sweep: 240, segments: 48,
      thickness: 14, gap: 2, colorOn: '#e8f4ff', colorOff: '#24323b', colorRedOn: '#ff3b3b', colorRedOff: '#4a1414',
      redFrom: 0.85, source: 'rpm', opacity: 1 },
    { id: 'e4', type: 'arc', name: 'Deco ring', cx: 320, cy: 210, r: 128, start: 150, sweep: 240, segments: 24,
      thickness: 2, gap: 4, colorOn: '#3a4a55', colorOff: '#1a2228', colorRedOn: '#3a4a55', colorRedOff: '#1a2228',
      redFrom: 1, source: 'static', staticFraction: 1, opacity: 1 },
    { id: 'e5', type: 'bar', name: 'Fuel bar', x: 60, y: 270, w: 200, h: 12, segments: 10, gap: 3, direction: 'right',
      colorOn: '#8fd18f', colorOff: '#1c2a1c', colorRedOn: '#ff9f43', colorRedOff: '#2a1c0c', redFrom: 1,
      source: 'fuel', opacity: 1 },
    { id: 'e6', type: 'bar', name: 'Boost bar', x: 600, y: 60, w: 12, h: 160, segments: 16, gap: 2, direction: 'up',
      colorOn: '#7ad3ff', colorOff: '#13232c', colorRedOn: '#ff3b3b', colorRedOff: '#2c1313', redFrom: 0.8,
      source: 'value', valueName: 'boost', opacity: 1 },
    { id: 'e7', type: 'needle', name: 'Speed needle', cx: 320, cy: 210, length: 120, thickness: 4,
      start: 150, sweep: 240, color: '#ff6a3d', source: 'speed', opacity: 1 },
    { id: 'e8', type: 'needle', name: 'Static pointer', cx: 100, cy: 100, length: 40, thickness: 3,
      start: 180, sweep: 180, color: '#ffffff', source: 'static', staticFraction: 0.5, opacity: 1 },
    { id: 'e9', type: 'text', name: 'Speed', x: 250, y: 160, w: 140, h: 70, content: 'speed', font: 'digital',
      style: 'Regular', size: 64, align: 'center', color: '#ffffff', opacity: 1 },
    { id: 'e10', type: 'text', name: 'Units', x: 270, y: 228, w: 100, h: 24, content: 'units', textMetric: 'km/h',
      textImperial: 'mph', locKeyMetric: 'RedlineTest-Kmh', locKeyImperial: 'RedlineTest-Mph', font: 'raj',
      style: 'Medium', size: 20, align: 'center', color: '#9fb3c0', opacity: 1 },
    { id: 'e11', type: 'text', name: 'Gear', x: 520, y: 200, w: 60, h: 60, content: 'gear', font: 'raj',
      style: 'Bold', size: 48, align: 'center', color: '#ffffff', opacity: 1 },
    { id: 'e12', type: 'text', name: 'Rpm readout', x: 40, y: 40, w: 120, h: 30, content: 'rpm1000', font: 'raj',
      style: 'Semi-Bold', size: 24, align: 'left', color: '#ffffff', opacity: 1 },
    { id: 'e13', type: 'text', name: 'Rpm raw', x: 40, y: 70, w: 120, h: 30, content: 'rpm', font: 'raj',
      style: 'Regular', size: 20, align: 'right', color: '#ffffff', opacity: 1 },
    { id: 'e14', type: 'text', name: 'Fuel pct', x: 270, y: 262, w: 80, h: 24, content: 'fuelPct', font: 'raj',
      style: 'Regular', size: 18, align: 'left', color: '#8fd18f', opacity: 1 },
    { id: 'e15', type: 'text', name: 'Fuel label', x: 20, y: 262, w: 40, h: 24, content: 'static', text: 'FUEL "A"\\B',
      locKey: 'RedlineTest-Fuel', font: 'raj', style: 'Medium', size: 16, align: 'left', color: '#9fb3c0', opacity: 1 },
    { id: 'e16', type: 'text', name: 'TC light', x: 40, y: 200, w: 50, h: 30, content: 'static', text: 'TC', font: 'raj',
      style: 'Bold', size: 22, align: 'center', color: '#ffb020', opacity: 1,
      light: { when: 'flag', flag: 'traction', effect: 'flash', period: 0.5 } },
    { id: 'e17', type: 'rect', name: 'Shift light', x: 300, y: 30, w: 40, h: 10, rotation: 0, color: '#2a0a0a', opacity: 1,
      light: { when: 'rpmAbove', threshold: 0.92, effect: 'color', onColor: '#ff2020' } },
    { id: 'e18', type: 'image', name: 'Engine icon', x: 100, y: 200, w: 32, h: 32, rotation: 0, color: '#ffb020',
      opacity: 1, atlas: 'base/gameplay/gui/common/icons/mappin_icons.inkatlas', part: 'engine',
      light: { when: 'flag', flag: 'engine', effect: 'show' } },
    { id: 'e19', type: 'image', name: 'Placeholder icon', x: 140, y: 200, w: 32, h: 32, rotation: 15, color: '#ffffff',
      opacity: 0.8, atlas: '', part: '', light: { when: 'fuelBelow', threshold: 0.15, effect: 'show' } },
    { id: 'e20', type: 'line', name: 'Overspeed bar', x1: 200, y1: 40, x2: 240, y2: 60, thickness: 3, color: '#ff2020',
      opacity: 1, light: { when: 'speedAbove', threshold: 200, effect: 'hide' } },
    { id: 'e21', type: 'needle', name: 'Rpm needle', cx: 320, cy: 210, length: 100, thickness: 3,
      start: 150, sweep: 240, color: '#ffffff', source: 'rpm', opacity: 1,
      light: { when: 'flag', flag: 'needlelight', effect: 'flash', period: 0.4 } },
    { id: 'e22', type: 'needle', name: 'Fuel needle', cx: 500, cy: 280, length: 30, thickness: 2,
      start: 180, sweep: 90, color: '#ffffff', source: 'fuel', opacity: 1 },
    { id: 'e23', type: 'needle', name: 'Boost needle', cx: 560, cy: 280, length: 30, thickness: 2,
      start: 180, sweep: 90, color: '#ffffff', source: 'value', valueName: 'boost', opacity: 1 },
    { id: 'e24', type: 'arc', name: 'Speed arc', cx: 320, cy: 210, r: 170, start: 150, sweep: -240, segments: 12,
      thickness: 4, gap: 1, colorOn: '#ff6a3d', colorOff: '#2a1810', colorRedOn: '#ff6a3d', colorRedOff: '#2a1810',
      redFrom: 1, source: 'speed', opacity: 1 },
    { id: 'e25', type: 'bar', name: 'Left bar', x: 300, y: 300, w: 100, h: 8, segments: 5, gap: 1, direction: 'left',
      colorOn: '#ffffff', colorOff: '#222222', colorRedOn: '#ffffff', colorRedOff: '#222222', redFrom: 1,
      source: 'static', staticFraction: 0.6, opacity: 1 },
    { id: 'e26', type: 'bar', name: 'Down bar', x: 10, y: 10, w: 8, h: 50, segments: 5, gap: 1, direction: 'down',
      colorOn: '#ffffff', colorOff: '#222222', colorRedOn: '#ffffff', colorRedOff: '#222222', redFrom: 1,
      source: 'rpm', opacity: 1 },
    { id: 'e28', type: 'arc', name: 'Shift ring', cx: 320, cy: 210, r: 190, start: 150, sweep: 240, segments: 12,
      thickness: 10, gap: 4, colorOn: '#7fd38a', colorOff: '#18291b', colorRedOn: '#ff3d3d', colorRedOff: '#4a1616',
      redFrom: 0.67, source: 'rpm', rangeFrom: 0.75, rangeTo: 0.95, opacity: 1,
      light: { when: 'rpmAbove', threshold: 0.95, effect: 'blinkSteady', rate: 4 } },
    { id: 'e29', type: 'bar', name: 'Speed warning bar', x: 400, y: 300, w: 100, h: 6, segments: 8, gap: 1, direction: 'right',
      colorOn: '#ffffff', colorOff: '#222222', colorRedOn: '#ffffff', colorRedOff: '#222222', redFrom: 1,
      source: 'speed', rangeFrom: 0.5, rangeTo: 1, opacity: 1, light: { when: 'speedAbove', threshold: 200, effect: 'color', onColor: '#ff2020' } },
    { id: 'e30', type: 'arc', name: 'Fading ring', cx: 100, cy: 100, r: 30, start: 0, sweep: 360, segments: 8,
      thickness: 3, gap: 2, colorOn: '#ffffff', colorOff: '#222222', colorRedOn: '#ffffff', colorRedOff: '#222222',
      redFrom: 1, source: 'static', staticFraction: 1, opacity: 1, light: { when: 'fuelBelow', threshold: 0.15, effect: 'flash', period: 0.5 } },
    { id: 'e31', type: 'numbers', name: 'Speed numbers', cx: 320, cy: 210, r: 100, start: 150, sweep: 240, source: 'speed',
      step: 20, turn: 'upright', font: 'raj', style: 'Medium', size: 16, color: '#ffffff', colorRed: '#ff3b3b', redFrom: 1, opacity: 1 },
    { id: 'e32', type: 'numbers', name: 'Tach numbers', cx: 320, cy: 210, r: 130, start: 150, sweep: 240, source: 'rpm', step: 1,
      turn: 'along', font: 'raj', style: 'Bold', size: 14, color: '#e8f4ff', colorRed: '#ff3b3b', redFrom: 0.85, opacity: 1,
      light: { when: 'rpmAbove', threshold: 0.95, effect: 'blink', rate: 4 } },
    { id: 'e33', type: 'numbers', name: 'Fuel labels', cx: 500, cy: 280, r: 40, start: 180, sweep: 90, source: 'labels',
      labels: 'E, 1/2, F', turn: 'along', font: 'digital', style: 'Regular', size: 12, color: '#ffffff', colorRed: '#ff3b3b',
      redFrom: 1, opacity: 0.8, light: { when: 'flag', flag: 'dial', effect: 'flash', period: 0.5 } },
    { id: 'e27', type: 'text', name: 'Speed', x: 0, y: 0, w: 10, h: 10, content: 'speed', font: 'raj',
      style: 'Bogus', size: 10, align: 'center', color: 'not-a-color', opacity: 2 },
  ],
};

const plain = {
  name: '3 minimal dash', className: '', module: '', offLights: 'hidden',
  width: 400, height: 200, anchor: 'TopRight', offsetX: -20, offsetY: 30, scale: 0.8,
  hook: 'none', hideStock: false, units: 'mph', speedMax: 160, rpmMax: 7000, rpmFromCar: false,
  gearMap: 'plain',
  elements: [
    { id: 'a1', type: 'text', name: 'Speed', x: 10, y: 10, w: 200, h: 80, content: 'speed', font: 'raj',
      style: 'Bold', size: 72, align: 'right', color: '#ffffff', opacity: 1 },
    { id: 'a2', type: 'text', name: 'Gear', x: 220, y: 10, w: 60, h: 80, content: 'gear', font: 'raj',
      style: 'Bold', size: 72, align: 'center', color: '#ffffff', opacity: 1 },
    { id: 'a3', type: 'bar', name: 'Tach', x: 10, y: 100, w: 380, h: 20, segments: 30, gap: 2, direction: 'right',
      colorOn: '#ffffff', colorOff: '#333333', colorRedOn: '#ff0000', colorRedOff: '#440000', redFrom: 0.9,
      source: 'rpm', opacity: 1 },
  ],
};

const empty = { name: 'Empty', className: 'RedlineEmptyDash', module: 'RedlineEmpty', width: 100, height: 100,
  hook: 'stock', elements: [] };

// Fed from D.O.P.E.: every D.O.P.E. lamp with every effect, D.O.P.E.'s icons, dark without power, the stock
// gauges hidden. It imports CarTuning and uses Codeware, so compile it with D.O.P.E.'s scripts and Codeware.
const lampEls = gen.CT_LAMPS.map((lamp, i) => ({ id: 'c' + i, type: 'text', name: lamp.label + ' light', x: 20 + (i % 5) * 120,
  y: 20 + Math.floor(i / 5) * 40, w: 110, h: 30, content: 'static', text: lamp.key, font: 'raj', style: 'Bold', size: 16,
  align: 'center', color: '#ff9e14', opacity: 1,
  light: { when: 'ct', lamp: lamp.key, effect: ['show', 'hide', 'color', 'blink', 'flash'][i % 5], onColor: '#ffffff',
    rate: 3, period: 0.5 } }));
const carTuning = {
  name: 'D.O.P.E. dash', className: 'RedlineCarTuningDash', module: '',
  width: 640, height: 320, anchor: 'BottomCenter', offsetX: 0, offsetY: -30, scale: 1,
  hook: 'carTuning', hideStock: true, darkWithoutPower: true, units: 'kmh', speedMax: 260, rpmMax: 8000,
  rpmFromCar: true, gearMap: 'stock',
  elements: lampEls.concat([
    { id: 'n1', type: 'needle', name: 'Speed needle', cx: 320, cy: 200, length: 120, thickness: 4, start: 140, sweep: 260,
      color: '#c04d2a', source: 'speed', opacity: 1, light: { when: 'ct', lamp: 'headlights', effect: 'color', onColor: '#ff6b3d' } },
    { id: 'i1', type: 'image', name: 'TC icon', x: 240, y: 230, w: 42, h: 54, rotation: 0, color: '#ff9e14', opacity: 1,
      atlas: 'oitenk/car_tuning/tc_light.inkatlas', part: 'tc_light', light: { when: 'ct', lamp: 'traction', effect: 'show' } },
    { id: 'i2', type: 'image', name: 'Wrong part', x: 300, y: 230, w: 42, h: 54, rotation: 0, color: '#ff9e14', opacity: 1,
      atlas: 'oitenk/car_tuning/tc_light.inkatlas', part: 'traction' },
    { id: 'r1', type: 'arc', name: 'Power ring', cx: 320, cy: 200, r: 160, start: 150, sweep: 240, segments: 24, thickness: 6,
      gap: 2, colorOn: '#ffffff', colorOff: '#222222', colorRedOn: '#ffffff', colorRedOff: '#222222', redFrom: 1, source: 'rpm',
      rangeFrom: 0.8, rangeTo: 0.6, opacity: 1, light: { when: 'ct', lamp: 'headlights', effect: 'color', onColor: '#ff6b3d' } },
    { id: 'b1', type: 'bar', name: 'Fuel bar', x: 60, y: 290, w: 160, h: 10, segments: 10, gap: 2, direction: 'right',
      colorOn: '#45ff6e', colorOff: '#123018', colorRedOn: '#45ff6e', colorRedOff: '#123018', redFrom: 1, source: 'fuel', opacity: 1 },
    { id: 'd1', type: 'numbers', name: 'Speed numbers', cx: 320, cy: 200, r: 96, start: 140, sweep: 260, source: 'speed', step: 20,
      turn: 'along', font: 'raj', style: 'Medium', size: 16, color: '#8fa3af', colorRed: '#ff3d3d', redFrom: 1, opacity: 1,
      light: { when: 'ct', lamp: 'headlights', effect: 'color', onColor: '#ff6b3d' } },
    { id: 'd2', type: 'numbers', name: 'Tach numbers', cx: 320, cy: 200, r: 140, start: 150, sweep: 240, source: 'rpm', step: 2,
      turn: 'upright', font: 'raj', style: 'Bold', size: 14, color: '#ffffff', colorRed: '#ff3d3d', redFrom: 0.8, opacity: 1,
      light: { when: 'ct', lamp: 'power', effect: 'show' } },
    { id: 'o1', type: 'text', name: 'Odometer', x: 400, y: 280, w: 160, h: 28, content: 'odometer', font: 'digital',
      style: 'Regular', size: 24, align: 'right', color: '#ffffff', opacity: 1 },
    { id: 'o2', type: 'text', name: 'Trip', x: 400, y: 300, w: 160, h: 24, content: 'trip', font: 'digital',
      style: 'Regular', size: 20, align: 'right', color: '#8fa3af', opacity: 1, light: { when: 'ct', lamp: 'headlights', effect: 'color', onColor: '#ff6b3d' } },
    { id: 'o3', type: 'text', name: 'Distance units', x: 565, y: 280, w: 40, h: 28, content: 'distUnits', font: 'raj',
      style: 'Medium', size: 18, align: 'left', color: '#8fa3af', opacity: 1 },
    { id: 'o4', type: 'text', name: 'Drive mode', x: 260, y: 20, w: 120, h: 28, content: 'driveMode', modeComfort: '',
      modeSport: 'SPORT "S"', modeTrack: 'TRACK\\R', font: 'raj', style: 'Bold', size: 20, align: 'center', color: '#ffb020', opacity: 1,
      light: { when: 'ct', lamp: 'engine', effect: 'show' } },
  ]),
};
// A design that uses D.O.P.E. lights without the D.O.P.E. feed, and a flag holding code: the checks catch both.
const misfed = { name: 'Misfed', className: 'RedlineMisfedDash', module: 'RedlineMisfed', width: 100, height: 100, hook: 'stock',
  elements: [{ id: 'm1', type: 'rect', name: 'Lamp', x: 0, y: 0, w: 10, h: 10, color: '#ffffff', opacity: 1,
    light: { when: 'ct', lamp: 'battery', effect: 'show' } },
  { id: 'm2', type: 'rect', name: 'Coded flag', x: 0, y: 0, w: 10, h: 10, color: '#ffffff', opacity: 1,
    light: { when: 'flag', flag: 'this.m_lowBeam.SetVisible(lights >= 1);', effect: 'show' } },
  { id: 'm3', type: 'numbers', name: 'No labels', cx: 50, cy: 50, r: 30, start: 150, sweep: 240, source: 'labels', labels: ' , ',
    turn: 'upright', font: 'raj', style: 'Medium', size: 10, color: '#ffffff', colorRed: '#ff0000', redFrom: 1, opacity: 1 },
  { id: 'm4', type: 'numbers', name: 'Too many', cx: 50, cy: 50, r: 30, start: 150, sweep: 240, source: 'speed', step: 1,
    turn: 'along', font: 'raj', style: 'Medium', size: 10, color: '#ffffff', colorRed: '#ff0000', redFrom: 0.9, opacity: 1 },
  { id: 'm5', type: 'text', name: 'Odometer', x: 0, y: 0, w: 60, h: 20, content: 'odometer', font: 'raj', style: 'Medium',
    size: 10, align: 'left', color: '#ffffff', opacity: 1 },
  { id: 'm6', type: 'text', name: 'Mode', x: 0, y: 0, w: 60, h: 20, content: 'driveMode', font: 'raj', style: 'Medium',
    size: 10, align: 'left', color: '#ffffff', opacity: 1 }] };

// One lamp hidden while off, against the design's unlit lights.
lampEls[3].light.offLook = 'hidden';
// The same, hidden without power instead of unlit.
const carTuningHidden = Object.assign({}, carTuning, { name: 'D.O.P.E. hidden dash', className: 'RedlineHiddenDash', powerOff: 'hidden' });
const cases = { full, plain, empty, carTuning, carTuningHidden, misfed };
for (const [key, design] of Object.entries(cases)) {
  const dir = path.join(outRoot, key, 'r6', 'scripts', gen.installFolderFor(design));
  fs.mkdirSync(dir, { recursive: true });
  const code = gen.generate(design, { date: '2026-10-17' });
  fs.writeFileSync(path.join(dir, gen.fileNameFor(design)), code);
  console.log(key + ': ' + gen.fileNameFor(design) + ' in ' + gen.installFolderFor(design) + ', '
    + code.split('\n').length + ' lines; checks: ' + JSON.stringify(gen.check(design)));
}
