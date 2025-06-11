/**
 * @jest-environment jsdom
 */

import {expect, test, beforeEach, describe} from '@jest/globals';

import { Building } from '../src/building.js';

test('Hipped Roof Exception', () => {
  const data = `<osm version="0.6" generator="openstreetmap-cgimap 2.0.1 (2514269 spike-07.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
<node id="1028052161" visible="true" version="3" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9515658" lon="30.7065509"/>
<node id="1028052187" visible="true" version="3" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9514342" lon="30.7055416"/>
<node id="1028052218" visible="true" version="3" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9515417" lon="30.7054858"/>
<node id="1028052228" visible="true" version="3" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9516732" lon="30.7064950"/>
<node id="4675313421" visible="true" version="3" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9514484" lon="30.7055343">
<tag k="amenity" v="telephone"/>
<tag k="operator" v="Россвязь"/>
<tag k="payment:telephone_cards" v="yes"/>
<tag k="phone" v="+7 81370 75189"/>
</node>
<node id="12149699806" visible="true" version="2" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9514791" lon="30.7058858">
<tag k="addr:flats" v="7-12"/>
<tag k="entrance" v="staircase"/>
<tag k="ref" v="2"/>
</node>
<node id="12149699816" visible="true" version="2" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9515445" lon="30.7063876">
<tag k="addr:flats" v="19-24"/>
<tag k="entrance" v="staircase"/>
<tag k="ref" v="4"/>
</node>
<node id="12149699817" visible="true" version="2" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9515196" lon="30.7061964">
<tag k="addr:flats" v="13-18"/>
<tag k="entrance" v="staircase"/>
<tag k="ref" v="3"/>
</node>
<node id="12149699818" visible="true" version="2" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027" lat="59.9514544" lon="30.7056962">
<tag k="addr:flats" v="1-6"/>
<tag k="entrance" v="staircase"/>
<tag k="ref" v="1"/>
</node>
<way id="88514597" visible="true" version="4" changeset="156067245" timestamp="2024-09-01T18:20:50Z" user="masmirnov" uid="16256027">
<nd ref="1028052187"/>
<nd ref="12149699818"/>
<nd ref="12149699806"/>
<nd ref="12149699817"/>
<nd ref="12149699816"/>
<nd ref="1028052161"/>
<nd ref="1028052228"/>
<nd ref="1028052218"/>
<nd ref="4675313421"/>
<nd ref="1028052187"/>
<tag k="addr:city" v="Воейково"/>
<tag k="addr:housenumber" v="1"/>
<tag k="addr:place" v="Воейково"/>
<tag k="building" v="apartments"/>
<tag k="building:cladding" v="brick"/>
<tag k="building:levels" v="3"/>
<tag k="roof:shape" v="hipped"/>
</way>
</osm>`;
  const bldg = (new Building('88514597', data);
  const meshes = bldg.render();
  expect(meshes.length).toBe(1);
});
