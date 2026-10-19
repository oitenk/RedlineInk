# Changelog

## 0.1.4

- The drive mode readout can show each mode in its own colour (the preset: Comfort green, Sport amber, Track red). A
  light on the readout lights in the mode's colour.

## 0.1.3

- A drive mode readout: one text that shows D.O.P.E.'s drive mode (Comfort, Sport or Track) in your own words for
  each, with a preset and a Drive mode switch in the test drive.

## 0.1.2

- Text readouts can show the odometer, the trip meter and the distance units (km or mi), in the same units as the
  speed. D.O.P.E. sends the distances; with your own code, send them with `SetDistance(km, tripKm)`. New presets:
  Odometer and Trip meter.
- D.O.P.E.'s knock and check engine lights can be used.
- Lights for things a car does not have (traction control, hill hold, launch control, low fuel, knock) are hidden in
  that car, and the test drive can show them as not fitted.

## 0.1.1

- Online at https://oitenk.github.io/RedlineInk/.
- Car Tuning, the mod the dashboards are fed by, has its real name: D.O.P.E. (Dynamic Overhaul Physics Enhancement). The
  page says D.O.P.E. everywhere it said Car Tuning. Designs and exported dashboards are not affected.

## 0.1.0

- First version on GitHub. Draw a dashboard with panels, lines, segmented arcs and bars, needles, dial numbers, text readouts and icons; try it with the test drive; export it as a redscript mod, fed by Car Tuning, by the stock car HUD, or by your own code.
- Any part can act as a light, and lights that are off can show in a dark unlit colour.
- With Car Tuning, the dashboard stays on screen unlit while the car's power is off, and follows Car Tuning's "Dashboard size" setting.
- Designs are saved in the browser and can be exported and imported as design files.
