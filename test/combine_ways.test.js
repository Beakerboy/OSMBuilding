/**
 * @jest-environment jsdom
 */

import {toBeDeepCloseTo} from 'jest-matcher-deep-close-to';
expect.extend({toBeDeepCloseTo});

import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;

import { Shape } from 'three';

import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
// import { JSDOM } from 'jsdom';

/**test('Test no combining necessary. one open way', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1]);
  expect(result.length).toBe(0);
});
*/
test('Test combining 2 ways 1->2', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  var way3 = '<way id="3"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  var way4 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2]);
  expect(result.length).toBe(1);
  expect(result[0].outerHTML).toBe(way4);
});

test('Test combining 3 ways 2->1->3', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="1"/></way>';
  var way3 = '<way id="3"><nd ref="2"/><nd ref="3"/></way>';
  var way4 = '<way id="2"><nd ref="3"/><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let xml3 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2, xml3]);
  expect(result.length).toBe(1);
  expect(result[0].outerHTML).toBe(way4);
});

test('Test combining 2 unaligned ways', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="2"/></way>';
  var way2 = '<way id="3"><nd ref="3"/><nd ref="1"/></way>';
  var way4 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let xml3 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2, xml3]);
  expect(result.length).toBe(1);
  expect(result[0].outerHTML).toBe(way4);
});

test('Test combining 3 ways 1->2->3', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/></way>';
  var way2 = '<way id="2"><nd ref="1"/><nd ref="3"/></way>';
  var way3 = '<way id="3"><nd ref="2"/><nd ref="3"/></way>';
  var way4 = '<way id="2"><nd ref="3"/><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let xml3 = parser.parseFromString(way3, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2, xml3]);
  expect(result.length).toBe(1);
  expect(result[0].outerHTML).toBe(way4);
});

/**
test('Test combining 4 ways', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="5"/></way>';
  var way3 = '<way id="3"><nd ref="6"/><nd ref="5"/></way>';
  var way4 = '<way id="4"><nd ref="6"/><nd ref="1"/><nd ref="1"/></way>';
  var way5 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="6"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let xml3 = parser.parseFromString(way3, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2, xml3]);
  expect(result.length).toBe(1);
  expect(result[0].outerHTML).toBe(way4);
});
*/
