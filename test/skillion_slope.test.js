/**
 * @jest-environment jsdom
 */

import { Shape, Mesh } from 'three';
import { TextEncoder } from 'node:util';
import {expect, test, beforeEach, describe} from '@jest/globals';
global.TextEncoder = TextEncoder;

import {apis} from '../src/apis.js';
global.apis = apis;

import { Building } from '../src/building.js';

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Step 1: get the full data for the buiding from the API
const initialData = `<osm version="0.6" generator="openstreetmap-cgimap 2.1.0 (1885079 spike-08.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
<node id="13116569240" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551787" lon="-4.3313915"/>
<node id="13116569241" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550939" lon="-4.3314236"/>
<node id="13116569242" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551585" lon="-4.3312202"/>
<node id="13116569244" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550736" lon="-4.3312518"/>
<node id="13116569245" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551741" lon="-4.3313520"/>
<node id="13116569248" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551621" lon="-4.3312507"/>
<way id="1426868383" visible="true" version="2" changeset="175381161" timestamp="2025-12-02T00:38:17Z" user="philipcullen" uid="8857">
<nd ref="13116569242"/>
<nd ref="13116569248"/>
<nd ref="13116569245"/>
<nd ref="13116569240"/>
<nd ref="13116569241"/>
<nd ref="13116569244"/>
<nd ref="13116569242"/>
<tag k="building" v="yes"/>
<tag k="building:levels" v="2"/>
</way>
</osm>`;

// Step 2: get the bounding box data for the buiding from the API
// Paste the same data as above to get the real URL and then fetch and paste that here.
const mapData = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="openstreetmap-cgimap 2.1.0 (383548 spike-06.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
 <bounds minlat="55.8550736" minlon="-4.3314236" maxlat="55.8551787" maxlon="-4.3312202"/>
 <node id="13116569240" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551787" lon="-4.3313915"/>
 <node id="13116569241" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550939" lon="-4.3314236"/>
 <node id="13116569242" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551585" lon="-4.3312202"/>
 <node id="13116569244" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8550736" lon="-4.3312518"/>
 <node id="13116569245" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551741" lon="-4.3313520"/>
 <node id="13116569246" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551254" lon="-4.3313700"/>
 <node id="13116569247" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551136" lon="-4.3312685"/>
 <node id="13116569248" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340" lat="55.8551621" lon="-4.3312507"/>
 <way id="1426868383" visible="true" version="2" changeset="175381161" timestamp="2025-12-02T00:38:17Z" user="philipcullen" uid="8857">
  <nd ref="13116569242"/>
  <nd ref="13116569248"/>
  <nd ref="13116569245"/>
  <nd ref="13116569240"/>
  <nd ref="13116569241"/>
  <nd ref="13116569244"/>
  <nd ref="13116569242"/>
  <tag k="building" v="yes"/>
  <tag k="building:levels" v="2"/>
 </way>
 <way id="1426868384" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="13116569245"/>
  <nd ref="13116569246"/>
  <nd ref="13116569247"/>
  <nd ref="13116569248"/>
  <nd ref="13116569245"/>
  <tag k="building:colour" v="lightyellow"/>
  <tag k="building:levels" v="2"/>
  <tag k="building:part" v="yes"/>
  <tag k="roof:colour" v="grey"/>
  <tag k="roof:direction" v="10"/>
  <tag k="roof:shape" v="skillion"/>
 </way>
 <way id="1426868385" visible="true" version="1" changeset="171414308" timestamp="2025-09-03T15:51:12Z" user="zuzak" uid="237340">
  <nd ref="13116569245"/>
  <nd ref="13116569240"/>
  <nd ref="13116569241"/>
  <nd ref="13116569244"/>
  <nd ref="13116569242"/>
  <nd ref="13116569248"/>
  <nd ref="13116569247"/>
  <nd ref="13116569246"/>
  <nd ref="13116569245"/>
  <tag k="building:colour" v="lightyellow"/>
  <tag k="building:levels" v="1"/>
  <tag k="building:part" v="yes"/>
  <tag k="roof:colour" v="grey"/>
  <tag k="roof:shape" v="flat"/>
 </way>
</osm>
`;

// Describe Issue
test('Diagnose Skillion Issue', async() => {
  fetch.mockResponses(
    [initialData],    // /way/1426868383/full
    [mapData],         // /map call
  );
  let wayId = '1426868383';
  const innerData = await Building.downloadDataAroundBuilding('way', wayId);
  const building = new Building(wayId, innerData);
  expect(building.id).toBe(wayId);
  const urlBase = 'https://api.openstreetmap.org/api/0.6/';
  expect(global.fetch.mock.calls[0][0]).toBe(urlBase + 'way/' + wayId + '/full');
  expect(global.fetch.mock.calls[1][0]).toBe(urlBase + 'map?bbox=-4.3314236,55.8550736,-4.3312202,55.8551787');
  // get building part
  const parts = building.parts;
  let found = false;
  for (const part of parts){
    // Get the building part of interest
    if (part.id === '1426868384'){
      expect(part.options.roof.height).toBe(5.284715476364045);
      found = true;
    }
  }
  expect(found).toBe(true);
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
