![Badge](https://github.com/Beakerboy/OSMBuilding/actions/workflows/main.yml/badge.svg)

OSM Building Viewer
=====================

### Visualize an OSM Building in 3D

Visualize an OSM Building from the live OSM data.
To visualize a building tagged with a way, use the URL:
https://beakerboy.github.io/OSMBuilding/index.html?id=[id]

If the building is a multipolygon, or a relation, use:
https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=[id]

...replacing [id] with the actual id of the way or relation.

Additional details will be displayed if "&info" is appended to the URL.

Console debug messages can be printed to the screen if "&errorBox" is appended to the url. Helpful since mobile browsers often lack any inspection capability.


Supports:
 * Ways with a building tag
 * Ways with building parts inside.
 * Building relations with way and/or multipolygon parts
 * Mulipolygon buildings

Roof Types:
 * Flat
 * Skillion
 * Dome
 * Pyramidal
 * Gabled

Examples:
 * Simple building with no parts - [Washington Monument](https://beakerboy.github.io/OSMBuilding/index.html?id=766761337)
 * Glass - [Petronas Towers](https://beakerboy.github.io/OSMBuilding/index.html?id=279944536)
 * Dome roof, Gabled roof, and Skillion ramp - [Jefferson Memorial](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=3461570)
 * Dome, Gabled, and Pyramidal Roof - [US Capitol](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=12286916)
 * [Chrysler Building](https://beakerboy.github.io/OSMBuilding/index.html?id=42500770)
 * Building Relation [Burj Khalifa](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=7584462)
 * Multipolygon with no parts - [Freer Art Gallery](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=1029355)
 * Relation with multipolygon parts - [Leaning Tower of Pisa](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=12982338)
