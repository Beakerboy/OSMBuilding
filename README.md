![Badge](https://github.com/Beakerboy/OSMBuilding/actions/workflows/main.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/Beakerboy/OSMBuilding/badge.svg?branch=main)](https://coveralls.io/github/Beakerboy/OSMBuilding?branch=main)

OSM Building Viewer
=====================

### Visualize an OSM Building in 3D

To visualize a building tagged with a way, use the URL:
https://beakerboy.github.io/OSMBuilding?id=[id]

If the building is a multipolygon, or a relation, use:
https://beakerboy.github.io/OSMBuilding?type=relation&id=[id]

...replacing [id] with the actual id of the way or relation.

Additional details will be displayed if `&info` is appended to the URL.

Console debug messages can be printed to the screen if `&errorBox` is appended to the url. Helpful since mobile browsers often lack any inspection capability.

Use the left mouse button to rotate the camera. To move, use the right one.

Supports:
 * Ways with a building tag
 * Ways with building parts inside.
 * Building relations with way and/or multipolygon parts
 * Multipolygon buildings
 * Multipolygon building with multiple open ways which combine to a closed way.

Roof Types:
 * Flat
 * Skillion
 * Dome
 * Pyramidal
 * Gabled
 * Hipped

Examples:
 * Simple building with no parts - [Washington Monument](https://beakerboy.github.io/OSMBuilding/index.html?id=766761337)
 * Glass - [Petronas Towers](https://beakerboy.github.io/OSMBuilding/index.html?id=279944536)
 * Dome roof, Gabled roof, and Skillion ramp - [Jefferson Memorial](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=3461570)
 * Dome, Gabled, Hipped, and Pyramidal Roof - [US Capitol](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=12286916)
 * [Chrysler Building](https://beakerboy.github.io/OSMBuilding/index.html?id=42500770)
 * Building Relation [Burj Khalifa](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=7584462)
 * Multipolygon with no parts - [Freer Art Gallery](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=1029355)
 * Relation with multipolygon parts - [Leaning Tower of Pisa](https://beakerboy.github.io/OSMBuilding/index.html?type=relation&id=12982338)

Specify the `osmApiUrl` parameter to use other OSM APIs. Examples:
 * [OpenHistoricalMap](https://beakerboy.github.io/OSMBuilding/?id=2826540&osmApiUrl=https://api.openhistoricalmap.org/api/0.6&type=relation)
 * [OpenGeofiction](https://beakerboy.github.io/OSMBuilding/?id=461819&osmApiUrl=https://opengeofiction.net/api/0.6&type=relation)
