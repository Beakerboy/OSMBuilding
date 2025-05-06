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

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
