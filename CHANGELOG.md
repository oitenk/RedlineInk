# Changelog

## 0.1.18

NEW! Tyre pressure readouts for each tyre, a tyre pressure unit readout and its toggle (Enter switches between the speed's unit, psi,
bar and kPa), and the D.O.P.E. light for low tyre pressure: picking the tyre pressure icon on a D.O.P.E. dashboard makes it that
light. The test drive shows them. Needs "Save to D.O.P.E." and D.O.P.E. 0.5.25 or later.

## 0.1.17

NEW! Launch rpm readout and toggle: shows the revs launch control holds for a staged start, with your own word for the limiter
(MAX to start with). Made the Launch rpm toggle, the player highlights it on the info screen, presses Enter, then sets it with the
up and down arrows and presses Enter again. The test drive does the same. Needs "Save to D.O.P.E." and D.O.P.E. 0.5.22 or later.

## 0.1.16

NEW! Radio artist and radio song title readouts: the game's "Artist - Title" split in two. The radio song readout with both stays.

NEW! "When it is too long" on a text readout: cut off as before, or scroll along. In the game a scrolling text that is wider than
its box slides along and back to the start; the editor shows the start. Needs D.O.P.E. 0.5.19 or later.

## 0.1.15

NEW! Info screen pages: give any part a page number (0 shows it always). In the game, D.O.P.E.'s info screen keys turn the pages,
the arrow keys to start with; the test drive has Previous and Next buttons. Selecting a part shows its page.

NEW! Toggles on the info screen: make a text a toggle for traction control, hill hold or launch control. In the game the up and
down arrows highlight a toggle and Enter switches it for the drive. The highlighted toggle takes a colour and a mark of its own
(design settings, Info screen).

NEW! Readouts for the radio station and song, the time of day, and traction control, hill hold and launch control on or off in
your own words.

All of these need "Save to D.O.P.E." and D.O.P.E. 0.5.18 or later.

## 0.1.14

NEW! D.O.P.E. light for the parking brake. Picking the parking brake icon on a D.O.P.E. dashboard makes it that light. Needs
D.O.P.E. 0.5.9 or later.

The driver and passenger door icons are now layers, with a new "car body" layer: put all three at the same place and size.
The body lights while any door is open, and each door while it is open.

## 0.1.13

NEW! Three more D.O.P.E. icons: fog lights, driver door open and passenger door open.

NEW! D.O.P.E. lights for the driver's door, the passenger's door, any door, the hood and the trunk being open, and for the fog
(utility) lights. Picking the doors, hood, trunk or fog light icon on a D.O.P.E. dashboard makes it that light. Needs D.O.P.E.
0.5.7 or later.

## 0.1.12

The traction control light's help no longer says D.O.P.E. doesn't flash it: from D.O.P.E. 0.3.110 it flashes while traction
control is cutting the power.

## 0.1.11

The odometer and trip meter are no longer marked "not in D.O.P.E. yet": D.O.P.E. 0.3.108 sends them. Your own cars count
from zero, any other car V gets into already has a used car's mileage, and every car has a trip from zero.

## 0.1.10

The hill hold and launch control lights are no longer marked "not in D.O.P.E. yet": D.O.P.E. sends them now. Hill hold
lights while it is armed or holding, its off light while it is not armed, and launch control lights while armed and
flashes while the car launches.

## 0.1.9

Save to D.O.P.E. now writes into D.O.P.E.'s new dashboards folder, `red4ext\plugins\DopeLab\dashboards`. The page asks
for the folder once more, so dashboards stop going to the earlier build's folder.

The lights, gauges and readouts D.O.P.E. does not send yet are marked in the pickers: the fuel reads full, and the
odometer, trip meter, drive mode, hill hold, launch control, low fuel, knock and check engine wait for later. A light for
one of those stays hidden in the game.

The full-scale speed explains that the speed follows D.O.P.E.'s "True speed on the speedometer": the game's own figure
reads up to about twice the true speed, so a dial needs room for it.

The redscript export for a D.O.P.E.-fed dashboard is for the earlier build only. D.O.P.E. reads dashboards as files now.

## 0.1.8

NEW! Save to D.O.P.E.: a D.O.P.E.-fed dashboard is saved as a file straight into the game's dashboards folder
(`red4ext\plugins\CarTuning\dashboards`), which D.O.P.E. reads itself, so a dashboard is no longer a mod of its own
and needs no install: it shows on the next drive, and a change saved while the game runs shows too. Chrome and Edge
write into the folder once you have picked it; other browsers download the file to put there. The redscript export
stays for the stock HUD, for your own code, and as the older way.

## 0.1.7

NEW! Cars: a dashboard can be for every car or only for the cars its rule names, by class (sports, standard, utility,
bikes), by maker or by record name, with a picker of the game's own cars. With several dashboards installed, D.O.P.E.
shows the one most the car's own: one that names the car beats one for its class or maker, which beats one for every
car. Needs the D.O.P.E. of 2026-10-24 or later for that referee.

NEW! The red zones on RPM gauges and the RPM lights can sit at the car's own redline, with the dial rounded up to the next
thousand, instead of at a fixed share of full scale; and D.O.P.E. now tells the dashboard the rev limit of a car with
an ECU tune, so a tuned car's dial grows with it.

NEW! Text readouts: the car's name, and its record name (to put a modded car on the Cars list).

## 0.1.6

NEW! Colour roles: the design has a palette of named colours (new designs start with Main, Accent, Warning and Dim) and any
colour field can take one instead of its own colour. The exported dashboard keeps the palette and, with the Mod Settings
mod, gets a page of its own in that menu: each colour as designed or one of sixteen named ones, a hue shift over all of
them and a brightness, applied as soon as V drives. Your own code can change the colours with `SetPalette` and
`SetPaletteColour`. Designs saved before this have no palette and export as before.

## 0.1.5

NEW! D.O.P.E.'s whole icon set, 29 icons drawn by fauxboxart.co.official (plus the hill hold light): the icon picker lists
them all, and each shows its real picture in the editor and the test drive, tinted as the game draws it, so a
preview picture no longer needs uploading for them. Picking an icon that stands for one of D.O.P.E.'s lights makes it
that light on a D.O.P.E.-fed dashboard (unless the element already acts as a light).

## 0.1.4

NEW! The drive mode readout can show each mode in its own colour (the preset: Comfort green, Sport amber, Track red). A
light on the readout lights in the mode's colour.

## 0.1.3

NEW! A drive mode readout: one text that shows D.O.P.E.'s drive mode (Comfort, Sport or Track) in your own words for
each, with a preset and a Drive mode switch in the test drive.

## 0.1.2

NEW! Text readouts can show the odometer, the trip meter and the distance units (km or mi), in the same units as the
speed. D.O.P.E. sends the distances; with your own code, send them with `SetDistance(km, tripKm)`. New presets:
Odometer and Trip meter.

NEW! D.O.P.E.'s knock and check engine lights can be used.

Lights for things a car does not have (traction control, hill hold, launch control, low fuel, knock) are hidden in
that car, and the test drive can show them as not fitted.

## 0.1.1

Online at https://oitenk.github.io/RedlineInk/.

Car Tuning, the mod the dashboards are fed by, has its real name: D.O.P.E. (Dynamic Overhaul Physics Enhancement). The
page says D.O.P.E. everywhere it said Car Tuning. Designs and exported dashboards are not affected.

## 0.1.0

First version on GitHub. Draw a dashboard with panels, lines, segmented arcs and bars, needles, dial numbers, text readouts and icons; try it with the test drive; export it as a redscript mod, fed by Car Tuning, by the stock car HUD, or by your own code.

Any part can act as a light, and lights that are off can show in a dark unlit colour.

With Car Tuning, the dashboard stays on screen unlit while the car's power is off, and follows Car Tuning's "Dashboard size" setting.

Designs are saved in the browser and can be exported and imported as design files.
