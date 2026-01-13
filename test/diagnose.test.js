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
<tag k="addr:city" v="Glasgow"/>
<tag k="addr:country" v="GB"/>
<tag k="addr:housenumber" v="183"/>
<tag k="addr:postcode" v="G51 4DJ"/>
<tag k="addr:street" v="Shieldhall Road"/>
<tag k="amenity" v="fast_food"/>
<tag k="brand" v="Greggs"/>
<tag k="brand:wikidata" v="Q3403981"/>
<tag k="brand:wikipedia" v="en:Greggs"/>
<tag k="building" v="yes"/>
<tag k="building:levels" v="2"/>
<tag k="contact:website" v="https://www.greggs.co.uk/shop-finder?shop-code=1884"/>
<tag k="cuisine" v="sandwich;bakery"/>
<tag k="fhrs:id" v="47551"/>
<tag k="name" v="Greggs"/>
<tag k="ref:GB:uprn" v="906700381676"/>
<tag k="takeaway" v="yes"/>
</way>
</osm>
`;

// Step 2: get the bounding box data for the buiding from the API
const mapData = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="openstreetmap-cgimap 2.1.0 (1885089 spike-08.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
 <bounds minlat="55.8550736" minlon="4.3312518" maxlat="55.8551787" maxlon="4.3313915"/>
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
  expect(global.fetch.mock.calls[1][0]).toBe(urlBase + 'map?bbox=125.7416897,39.0269534,125.7420811,39.0272423');
  // get building part
  const parts = building.parts;
  // let found = false;
  for (const part of parts){
    // Get the building part
    if (part.id === '1426868384'){
      const shape = part.shape;
      const points = shape.extractPoints().shape;
      //const options = {
      //  angle: (360 - part.options.roof.direction) / 360 * 2 * Math.PI,
      //  depth: part.options.roof.height,
      //  pitch: part.options.roof.angle / 180 * Math.PI,
      //};
      //expect(options).toBe({});
      expect(points).toBe([]);
      //expect(shape.toJSON()).toBe('');
      // found = true;
    }
  }
  // expect(found).toBeTrue();
  // dump outer shape
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
