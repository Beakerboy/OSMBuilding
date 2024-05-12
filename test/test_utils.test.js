/**
 * @jest-environment jsdom
 */

import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;



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
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="1"/></way>';
  var way3 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  const elements = xml2.getElementsByTagName('nd');
  expect(elements.length).toBe(4);
  let result = BuildingShapeUtils.joinWays(xml1, xml2);
  expect(result.getElementsByTagName('nd').length).toBe(6);
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
  expect(result[0].isEqualNode(expected)).toBe(true);
});
