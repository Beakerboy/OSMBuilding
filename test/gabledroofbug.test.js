/**
 * @jest-environment jsdom
 */
import {jest} from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import { Building } from '../src/building.js';
import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
import { TextEncoder } from 'node:util';

const data = `<?xml version='1.0' encoding='UTF-8'?>
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

beforeEach(() => {
  fetchMock.resetMocks();
  errors = [];
});

test ('Factory', async() => {
  fetch.mockResponses(
    [data],
    [data],
    [data],
  );
  Building.downloadDataAroundBuilding('way', '31361386');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[0][0]).toBe('/api/data');
});

// compare the object rendered from the requested way data to that rendered
// from the requested map data to see if one errors and one does not.
test('Constructor', () => {
  const bldg = new Building('31361386', data);
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
