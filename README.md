# Redline Ink

A dashboard designer for Cyberpunk 2077. Draw a gauge cluster in your browser (arcs, bars, needles, dial numbers, readouts, icons and warning lights), try it out with a test drive, and export it as a redscript mod.

## Using it

Open it at **https://oitenk.github.io/RedlineInk/**. Nothing to download or install.

To use it offline, download this repository (**Code → Download ZIP**), unzip it and open `index.html` in Chrome, Edge or Firefox. The page still needs an internet connection for its fonts and for making the .zip.

- Your current design is kept in the browser between visits.
- **Save** puts a design in **My designs**, also in this browser.
- **Export design file** and **Import design file** (under My designs) move designs between browsers or to other people.
- **Example** loads a finished cluster to look at; **New** starts an empty one.

### Parts

| Part | What it is |
|---|---|
| Panel, Line | Plain shapes. |
| Arc, Bar | A run of segments that fills with a reading, with a red zone. An arc can cover only part of its reading, such as a shift light ring over the top of the revs. |
| Needle | Turns with a reading. |
| Numbers | Numbers around a dial: speed up to the full-scale speed, RPM in thousands (laid out again for each car's own redline), or your own labels such as E, 1/2, F. Upright, or turned along the arc. **Line up with** copies a needle's or an arc's centre and angles. |
| Text | A label, or a live readout: speed, RPM, gear, fuel percent, km/h or mph, odometer, trip, drive mode, the car's name or record name. |
| Icon | A picture from an `.inkatlas`. |

Any part can act as a light: it lights up on a D.O.P.E. light, a flag your own mod sets, RPM or speed above a value, or fuel below one, and then shows, hides, changes colour, blinks or fades. Lights that are off can stay in place in a dark "unlit" colour, as on a real dashboard, or disappear.

**Colours** (in the design settings): a palette of named colours, such as Main, Accent and Warning, that any colour field can take instead of a colour of its own. In the game, with the [Mod Settings](https://www.nexusmods.com/cyberpunk2077/mods/4885) mod installed, the exported dashboard gets a page of its own in that menu where the player picks each of these colours from a list of named ones, turns all their hues around the colour wheel and sets their brightness; the dashboard redraws with the new colours as soon as V drives. Without Mod Settings the designed colours apply.

**Test drive**, under the canvas, moves everything the way the exported script will: speed, RPM, gear, fuel, units, the D.O.P.E. lights, and **Run a pull** for a run through the gears.

### Exporting

**Export redscript** shows the script, with **Copy** and **Download .zip**. The .zip unpacks into the game's folder layout, so it installs through Vortex or by copying it into the game folder. Scripts are compiled when the game starts, so restart the game after installing a new version.

**Feed it from** (in the design settings) chooses where the dashboard gets its readings:

- **D.O.P.E.** (Dynamic Overhaul Physics Enhancement, the mod Redline Ink was first made for; its working name was Car
  Tuning): the dashboard sits in a window of its own on the HUD while V drives, fed by the car and by D.O.P.E.'s lights, fuel, odometer and drive mode. It can stay unlit while the car's power is off, and D.O.P.E.'s "Dashboard size" setting scales it. **Save to D.O.P.E.** writes it as a file into the game's `red4ext\plugins\CarTuning\dashboards` folder, which D.O.P.E. reads itself: no script, nothing to install, and it shows on the next drive (Chrome and Edge write there once you have picked the folder; other browsers download the file to put there). With several dashboards in the folder D.O.P.E. shows the one most the car's own. The player's colours for it are in D.O.P.E.'s Mod Settings (Dashboards). Needs D.O.P.E. (not released yet) and [Codeware](https://github.com/psiberx/cp2077-codeware). The redscript export is the older way, a mod of its own in `r6\scripts\CarTuning\Dashboards\<name>\`, and still works.
- **The stock car HUD**: shown inside the game's own speedometer and fed by it. Third-person view only, and clipped to the speedometer's window.
- **My own code**: for modders. Attach the dashboard to your own widget and feed it with `SetSpeed`, `SetRpm`, `SetGear`, `SetFuel`, `SetDistance`, `SetDriveMode`, `SetFlag` and `SetValue`; `SetPalette` and `SetPaletteColour` change the palette's colours.

All exports need [redscript](https://github.com/jac3km4/redscript).

Each export is a mod of its own. Give each dashboard its own class name: two exports with the same class name clash.

**Cars** (in the design settings): a dashboard can be for every car, or only for the cars its rule names: by class (sports, standard, utility, bikes), by maker, or by record name, with a picker of the game's own cars (a Text part showing the car's record name tells you a modded car's). With several D.O.P.E.-fed dashboards installed, D.O.P.E. shows the one most the car's own: one that names the car beats one for its class or maker, which beats one for every car. Stock-HUD dashboards only follow their own rule.

**Red zones at the car's redline** (in the readings): the red zones on RPM gauges and the RPM lights can sit at each car's own redline, the dial rounded up to the next thousand, instead of at a fixed share of full scale. D.O.P.E. tells the dashboard a tuned car's rev limit.

## Development

`generator.js` turns a design into redscript. The page and the tests share it, so the preview is worked out exactly as the script places things in game.

- `node test/harness.js <folder>` writes a set of test designs, one game-layout folder each, and lists what the design checks found.
- `test/compile.ps1 -Case <folder>\<case> [-Game <game folder>]` compiles one of them with the game's own script compiler (`engine\tools\scc.exe`). It copies the game's script cache into the case folder, so keep test output out of the repository.

## Credits

- The dashboard icons (the pictures in `icons/`, and the icon sheets in D.O.P.E.'s archive they stand for) were drawn by
  [fauxboxart.co.official](https://www.instagram.com/fauxboxart.co.official/) on Instagram; the hill hold light is the author's own.
- [JSZip](https://stuk.github.io/jszip/) (MIT) by Stuart Knightley and contributors makes the .zip; the page loads it from cdnjs.
- The editor's fonts come from Google Fonts: Rajdhani, Barlow, Barlow Condensed, JetBrains Mono and Share Tech Mono (SIL Open Font License). Exported dashboards use the game's own fonts.

Built it with Claude (the AI).

## License

[MIT](LICENSE)
