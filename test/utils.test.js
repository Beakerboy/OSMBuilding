/**
 * @jest-environment jsdom
 */

import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;

import { Shape } from 'three';

import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
// import { JSDOM } from 'jsdom';

test('Test Closed Way', () => {
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let parser = new window.DOMParser();
  let xmlData = parser.parseFromString(way, 'text/xml');
  expect(BuildingShapeUtils.isClosed(xmlData)).toBe(true);
});

test('Test Open Way', () => {
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="6"/></way>';
  let parser = new window.DOMParser();
  let xmlData = parser.parseFromString(way, 'text/xml');
  expect(BuildingShapeUtils.isClosed(xmlData)).toBe(false);
});

test('Test joining 2 ways', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  var way3 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.joinWays(xml1, xml2);
  expect(result.outerHTML).toBe(way3);
});

test('Test combining 2 ways', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  var way3 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml1, xml2]);
  expect(result.length).toBe(1);
  let expected = parser.parseFromString(way3, 'text/xml');
  expect(result[0].outerHTML).toBe(way3);
});

test('Extents no rotation', () => {
  const shape = new Shape();
  shape.moveTo(1, 1);
  shape.lineTo(1, -1);
  shape.lineTo(-1, 1);
  expect(BuildingShapeUtils.extents(shape)).toStrictEqual([-1, -1, 1, 1]);
  const angle = 45 / 360 * 2 * 3.1415926535;
  const sqrt2 = 1.41421356;
  expect(BuildingShapeUtils.extents(shape, angle)).toStrictEqual([-sqrt2, 0, sqrt2, sqrt2]);
});
