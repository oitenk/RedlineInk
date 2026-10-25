# Changelog

## 0.1.8

- Save to D.O.P.E.: a D.O.P.E.-fed dashboard is saved as a file straight into the game's dashboards folder
  (`red4ext\plugins\CarTuning\dashboards`), which D.O.P.E. reads itself, so a dashboard is no longer a mod of its own
  and needs no install: it shows on the next drive, and a change saved while the game runs shows too. Chrome and Edge
  write into the folder once you have picked it; other browsers download the file to put there. The redscript export
  stays for the stock HUD, for your own code, and as the older way.

## 0.1.7

- Cars: a dashboard can be for every car or only for the cars its rule names, by class (sports, standard, utility,
  bikes), by maker or by record name, with a picker of the game's own cars. With several dashboards installed, D.O.P.E.
  shows the one most the car's own: one that names the car beats one for its class or maker, which beats one for every
  car. Needs the D.O.P.E. of 2026-10-24 or later for that referee.
- The red zones on RPM gauges and the RPM lights can sit at the car's own redline, with the dial rounded up to the next
  thousand, instead of at a fixed share of full scale; and D.O.P.E. now tells the dashboard the rev limit of a car with
  an ECU tune, so a tuned car's dial grows with it.
- Text readouts: the car's name, and its record name (to put a modded car on the Cars list).

## 0.1.6

- Colour roles: the design has a palette of named colours (new designs start with Main, Accent, Warning and Dim) and any
  colour field can take one instead of its own colour. The exported dashboard keeps the palette and, with the Mod Settings
  mod, gets a page of its own in that menu: each colour as designed or one of sixteen named ones, a hue shift over all of
  them and a brightness, applied as soon as V drives. Your own code can change the colours with `SetPalette` and
  `SetPaletteColour`. Designs saved before this have no palette and export as before.

## 0.1.5

- D.O.P.E.'s whole icon set, 29 icons drawn by fauxboxart.co.official (plus the hill hold light): the icon picker lists
  them all, and each shows its real picture in the editor and the test drive, tinted as the game draws it, so a
  preview picture no longer needs uploading for them. Picking an icon that stands for one of D.O.P.E.'s lights makes it
  that light on a D.O.P.E.-fed dashboard (unless the element already acts as a light).

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
