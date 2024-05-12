/**
 * @jest-environment jsdom
 */

import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;

import { MultiBuildingPart } from '../src/multibuildingpart.js';

test('Test Simple Multipolygon', () => {
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let parser = new window.DOMParser();
  let xmlData = parser.parseFromString(way, 'text/xml');
  expect(BuildingShapeUtils.isClosed(xmlData)).toBe(true);
});
