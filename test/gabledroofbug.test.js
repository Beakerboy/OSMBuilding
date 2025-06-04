/**
 * @jest-environment jsdom
 */
import {jest} from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import { Building } from '../src/building.js';
import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
import { TextEncoder } from 'node:util';

const typeWayFullResponse = `<?xml version='1.0' encoding='UTF-8'?>
<osm version="0.6" generator="openstreetmap-cgimap 2.0.1 (2514279 spike-07.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <node id="8091790599" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208920" lon="7.1707447"/>
  <node id="8091790600" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208175" lon="7.1706533"/>
  <node id="8091790601" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208577" lon="7.1708150"/>
  <node id="8091790604" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9207832" lon="7.1707235"/>
  <node id="12004717375" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208780" lon="7.1707275"/>
  <way id="868101951" visible="true" version="7" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792">
    <nd ref="8091790600"/>
    <nd ref="8091790604"/>
    <nd ref="8091790601"/>
    <nd ref="8091790599"/>
    <nd ref="12004717375"/>
    <nd ref="8091790600"/>
    <tag k="addr:city" v="Rösrath"/>
    <tag k="addr:housenumber" v="25a"/>
    <tag k="addr:postcode" v="51503"/>
    <tag k="addr:street" v="Mühlenweg"/>
    <tag k="building" v="semidetached_house"/>
    <tag k="building:levels" v="2"/>
    <tag k="roof:direction" v="across"/>
    <tag k="roof:levels" v="1.5"/>
    <tag k="roof:shape" v="gabled"/>
  </way>
</osm>
`;

const outlineRelationFullResponse = `<?xml version='1.0' encoding='UTF-8'?>
<osm version="0.6">
  <node id="8091790599" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208920" lon="7.1707447"/>
  <node id="8091790600" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208175" lon="7.1706533"/>
  <node id="8091790601" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208577" lon="7.1708150"/>
  <node id="8091790604" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9207832" lon="7.1707235"/>
  <node id="12004717375" visible="true" version="2" changeset="153088398" timestamp="2024-06-23T22:54:13Z" user="canavan" uid="2603792" lat="50.9208780" lon="7.1707275"/>
  <way id="868101951">
    <nd ref="8091790600"/>
    <nd ref="8091790604"/>
    <nd ref="8091790601"/>
    <nd ref="8091790599"/>
    <nd ref="12004717375"/>
    <nd ref="8091790600"/>
  </way>
</osm>
`;

const typeBuildingWithMultipolygonOutline = `<?xml version='1.0' encoding='UTF-8'?>
<osm version="0.6">
  <node id="1" lat="59.938127" lon="30.4980057"/>
  <node id="2" lat="59.9380365" lon="30.4992843"/>
  <node id="3" lat="59.9384134" lon="30.4993839"/>
  <node id="4" lat="59.9385087" lon="30.4981066"/>
  <node id="5" lat="59.9381203" lon="30.4989364"/>
  <node id="6" lat="59.93838" lon="30.499005"/>
  <node id="7" lat="59.9384221" lon="30.498439"/>
  <node id="8" lat="59.9381551" lon="30.4983684"/>
  <way id="20">
    <nd ref="4"/>
    <nd ref="3"/>
    <nd ref="2"/>
    <nd ref="1"/>
  </way>
  <way id="21">
    <nd ref="1"/>
    <nd ref="4"/>
  </way>
  <way id="22">
    <nd ref="6"/>
    <nd ref="7"/>
  </way>
  <way id="23">
    <nd ref="5"/>
    <nd ref="6"/>
  </way>
  <way id="24">
    <nd ref="8"/>
    <nd ref="5"/>
  </way>
  <way id="25">
    <nd ref="7"/>
    <nd ref="8"/>
  </way>
  <relation id="40">
    <member type="way" ref="20" role="outer"/>
    <member type="way" ref="21" role="outer"/>
    <member type="way" ref="22" role="inner"/>
    <member type="way" ref="23" role="inner"/>
    <member type="way" ref="24" role="inner"/>
    <member type="way" ref="25" role="inner"/>
    <tag k="building" v="school"/>
    <tag k="building:levels" v="3"/>
    <tag k="roof:shape" v="flat"/>
    <tag k="type" v="multipolygon"/>
  </relation>
  <relation id="42">
    <member type="relation" ref="40" role="outline"/>
    <tag k="type" v="building"/>
  </relation>
</osm>
`;

beforeEach(() => {
  fetchMock.resetMocks();
  errors = [];
});

test ('Factory', async() => {
  fetch.mockResponses(
    [typeWayFullResponse],    // /relation/42/full
    [outlineRelationFullResponse],         // /relation/40/full
    [typeBuildingWithMultipolygonOutline], // /map call

  );
  Building.downloadDataAroundBuilding('way', '31361386');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[0][0]).toBe('/api/data');
});

// compare the object rendered from the requested way data to that rendered
// from the requested map data to see if one errors and one does not.
test('Constructor', () => {
  const bldg = new Building('31361386', typeWayFullResponse);
  expect(bldg.parts.length).toBe(1);
  const part = bldg.parts[0];
  const meshes = part.render();
  const roofmesh = meshes[0];
  const roofGeometry = roofmesh.geometry;
  expect(roofGeometry.constructor.name).toBe('WedgeGeometry');
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
