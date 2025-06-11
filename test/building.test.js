/**
 * @jest-environment jsdom
 */
import {toBeDeepCloseTo} from 'jest-matcher-deep-close-to';
expect.extend({toBeDeepCloseTo});

import { Shape, Mesh } from 'three';
import { TextEncoder } from 'node:util';
import {expect, test, beforeEach, describe} from '@jest/globals';
global.TextEncoder = TextEncoder;

import {apis} from '../src/apis.js';
global.apis = apis;

import { Building } from '../src/building.js';

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

const data = `
<osm version="0.6" generator="openstreetmap-cgimap 2.0.1 (3529586 spike-06.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
<node id="349300285" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5833130" lon="11.0155721"/>
<node id="349300289" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5834188" lon="11.0154519"/>
<node id="349300292" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5833130" lon="11.0154519"/>
<node id="349300295" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5834188" lon="11.0155721"/>
<way id="31361386" visible="true" version="7" changeset="103461964" timestamp="2021-04-23T08:01:35Z" user="hans007" uid="376477">
<nd ref="349300292"/>
<nd ref="349300289"/>
<nd ref="349300295"/>
<nd ref="349300285"/>
<nd ref="349300292"/>
<tag k="addr:city" v="Erlangen"/>
<tag k="addr:country" v="DE"/>
<tag k="addr:housenumber" v="30"/>
<tag k="addr:postcode" v="91052"/>
<tag k="addr:street" v="Badstraße"/>
<tag k="building" v="detached"/>
<tag k="building:levels" v="1"/>
<tag k="roof:levels" v="2"/>
<tag k="roof:shape" v="gabled"/>
</way>
</osm>`;

beforeEach(() => {
  fetchMock.resetMocks();
  errors = [];
});

describe.each([
  [['way', -1], ['', { status: 404 }], /^The way -1 was not found on the server.\nURL: /],
  [['way', -1], ['', { status: 410 }], /^The way -1 was deleted.\nURL: /],
  [['way', -1], ['', { status: 509 }], /^HTTP 509.\nURL: /],
  [['relation', -1], ['', { status: 404 }], /^The relation -1 was not found on the server.\nURL: /],
  [['relation', -1], ['', { status: 410 }], /^The relation -1 was deleted.\nURL: /],
  [['relation', -1], ['', { status: 509 }], /^HTTP 509.\nURL: /],
])('Test API error handling', (args, response, matcher) => {
  test(`Test API error for ${args[0]} ${args[1]} with HTTP ${response[1].status}`, async() => {
    fetch.mockResponses(response);
    await expect(Building.downloadDataAroundBuilding(...args)).rejects.toMatch(matcher);
  });
});

test('Test data validation open outline', () => {
  const data = `
  <way id="1">
    <nd ref="2"/>
    <nd ref="3"/>
    <nd ref="4"/>
    <tag k="building" v="yes"/>
  </way>`;
  expect(() => new Building('1', data))
    .toThrow(new Error('Rendering of way 1 is not possible. Error: Way 1 is not a closed way. 2 !== 4.'));
});

test('Test data validation with not building', () => {
  const data = `
  <way id="1">
    <nd ref="2"/>
    <nd ref="3"/>
    <nd ref="4"/>
    <nd ref="2"/>
    <tag k="not:building" v="yes"/>
  </way>`;
  expect(() => new Building('1', data))
    .toThrow(new Error('Rendering of way 1 is not possible. Error: Outer way is not a building'));
});

test('Test data validation with empty way', () => {
  const data = `
  <way id="1">
    <tag k="building" v="yes"/>
  </way>`;
  expect(() => new Building('1', data))
    .toThrow(new Error('Rendering of way 1 is not possible. Error: Way 1 has no nodes.'));
});

test('Test Constructor', async() => {
  const bldg = new Building('31361386', data);
  expect(bldg.home).toBeDeepCloseTo([11.015512, 49.5833659], 10);
  expect(bldg.parts.length).toBe(0);
  expect(bldg.nodelist['349300285']).toStrictEqual([4.332747472106493, -5.882209888874915]);
  expect(bldg.nodelist['349300289']).toStrictEqual([-4.332738077015795, 5.88221335051411]);
  expect(errors.length).toBe(0);
});

test('Create Nodelist', () => {
  let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
  const list = Building.buildNodeList(xmlData);
  expect(Object.keys(list).length).toBe(4);
  // Long / Lat
  expect(list['349300285']).toStrictEqual(['11.0155721', '49.5833130']);
  expect(errors.length).toBe(0);
});


test('Invisible Outer Building', () => {
  const bldg = new Building('31361386', data);
  bldg.parts = [bldg.outerElement];
  const mesh = bldg.render();
  //expect outer building and roof to not be visible
  expect(mesh[0].visible).toBe(false);
  expect(bldg.outerElement.options.building.visible).toBe(false);
  expect(mesh[1].visible).toBe(false);
});

test('Visible Outer Building', () => {
  const bldg = new Building('31361386', data);
  const mesh = bldg.render();
  //expect outer building and roof to be visible
  expect(mesh[0].visible).toBe(true);
  expect(mesh[1].visible).toBe(true);
});


test('Test with neighboring incomplete building:part relation', () => {
  const data = `<?xml version="1.0" encoding="UTF-8"?>
<osm>
 <node id="1" lat="59.9297360" lon="30.4883115"/>
 <node id="2" lat="59.9293517" lon="30.4883115"/>
 <node id="3" lat="59.9293516" lon="30.4892180"/>
 <node id="4" lat="59.9297360" lon="30.4892179"/>
 <node id="5" lat="59.9279610" lon="30.4840202"/>
 <node id="6" lat="59.9295379" lon="30.4879181"/>
 <node id="7" lat="59.9283455" lon="30.4831137"/>
 <way id="222">
  <nd ref="3"/>
  <nd ref="4"/>
  <nd ref="1"/>
 </way>
 <way id="333">
  <nd ref="1"/>
  <nd ref="2"/>
  <nd ref="3"/>
 </way>
 <way id="444">
  <nd ref="5"/>
  <nd ref="6"/>
  <nd ref="7"/>
 </way>
 <relation id="42">
  <member type="way" ref="222" role="outer"/>
  <member type="way" ref="333" role="outer"/>
  <tag k="building" v="apartments"/>
  <tag k="type" v="multipolygon"/>
 </relation>
 <relation id="40">
  <member type="way" ref="444" role="outer"/>
  <member type="way" ref="1000" role="outer"/>
  <tag k="building:part" v="yes"/>
  <tag k="type" v="multipolygon"/>
 </relation>
</osm>
`;
  expect(new Building('42', data).id).toBe('42');
});

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
const typeBuildingRelationFullResponse = `<?xml version='1.0' encoding='UTF-8'?>
<osm version="0.6">
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
const outlineRelationFullResponse = `<?xml version='1.0' encoding='UTF-8'?>
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
</osm>
`;

test('Test downloading type=building with multipolygon outline and multiple inner ways', async() => {
  fetch.mockResponses(
    [typeBuildingRelationFullResponse],    // /relation/42/full
    [outlineRelationFullResponse],         // /relation/40/full
    [typeBuildingWithMultipolygonOutline], // /map call
  );
  const innerData = await Building.downloadDataAroundBuilding('relation', '42');
  const building = new Building('42', innerData);
  expect(building.id).toBe('42');
  expect(building.outerElement.shape.holes.length).toBe(1);
  const urlBase = 'https://api.openstreetmap.org/api/0.6/';
  expect(global.fetch.mock.calls[0][0]).toBe(urlBase + 'relation/42/full');
  expect(global.fetch.mock.calls[1][0]).toBe(urlBase + 'relation/40/full');
  expect(global.fetch.mock.calls[2][0]).toBe(urlBase + 'map?bbox=30.4980057,59.9380365,30.4993839,59.9385087');
});

test('Part must be within outline', () => {
  const data = `<?xml version="1.0" encoding="UTF-8"?>
<osm>
 <node id="1" lat="0.001" lon="0.001"/>
 <node id="2" lat="0.001" lon="0"/>
 <node id="3" lat="0" lon="0"/>
 <node id="4" lat="0" lon=".0005"/>
 <node id="5" lat="0" lon=".001"/>
 <node id="6" lat=".0001" lon=".001"/>
 <node id="7" lat=".0001" lon="0.005"/>
 <way id="11">
  <nd ref="1"/>
  <nd ref="2"/>
  <nd ref="3"/>
  <nd ref="1"/>
  <tag k="building" v="apartments"/>
 </way>
 <way id="22">
  <nd ref="4"/>
  <nd ref="5"/>
  <nd ref="6"/>
  <nd ref="7"/>
  <nd ref="4"/>
  <tag k="building:part" v="yes"/>
 </way>
</osm>
`;
  expect(new Building('11', data).parts.length).toBe(0);
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
