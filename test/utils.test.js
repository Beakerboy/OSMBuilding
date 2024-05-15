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

const rightTriangle = new Shape();
rightTriangle.moveTo(1, 1);
rightTriangle.lineTo(1, -1);
rightTriangle.lineTo(-1, 1);

test('Extents no Rotation', () => {
  expect(BuildingShapeUtils.extents(rightTriangle)).toStrictEqual([-1, -1, 1, 1]);
});

test('Extents Rotation', () => {
  const angle = 45 / 360 * 2 * 3.1415926535;
  const sqrt2 = Math.sqrt(2);
  expect(BuildingShapeUtils.extents(rightTriangle, angle)).toBeDeepCloseTo([-sqrt2, 0, sqrt2, sqrt2], 10);
});

test('Edge Lengths', () => {
  expect(BuildingShapeUtils.edgeLength(rightTriangle)).toBeDeepCloseTo([2, Math.sqrt(2) * 2, 2]);
});

test('Edge Direction', () => {
  expect(BuildingShapeUtils.edgeDirection(rightTriangle)).toBeDeepCloseTo([-Math.PI / 2, -Math.PI / 4, 0]);
});

test('Longest side angle', () => {
  // A three.Shape object does not repeat the fist and last nodes.
  expect(rightTriangle.extractPoints().shape.length).toBe(3);
  expect(BuildingShapeUtils.longestSideAngle(rightTriangle)).toBe(-Math.PI / 4);
});
