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


/** Test createShape */
test('', () => {
  var way = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xmlData = parser.parseFromString(way, 'text/xml');
  let nodelist = {
    1: [1, 1],
    2: [1, -1],
    3: [-1, 1],
  };
  const shape = BuildingShapeUtils.createShape(xmlData, nodelist);
  expect(shape.extractPoints().shape.length).toBe(3);
  const points = shape.extractPoints().shape;
  expect([points[0].x, points[0].y]).toStrictEqual(nodelist[1]);
  expect([points[1].x, points[1].y]).toStrictEqual(nodelist[2]);
  expect([points[2].x, points[2].y]).toStrictEqual(nodelist[3]);
});

/** Test isClosed */
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

/** Test isSelfIntersecting */
describe.each([
  ['<way id="1"><nd ref="1"/><nd ref="2"/></way>', false, 'open non-intersecting'],
  ['<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="1"/></way>', false, 'closed non-intersecting'],
  ['<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="2"/></way>', true, 'open intersecting'],
  ['<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="3"/><nd ref="1"/></way>', true, 'closed intersecting'],
])('isSelfIntersecting', (way, expected, description) => {
  test(`${description}`, () => {
    let parser = new window.DOMParser();
    let xml = parser.parseFromString(way, 'text/xml').getElementsByTagName('way')[0];
    expect(BuildingShapeUtils.isSelfIntersecting(xml)).toBe(expected);
  });
});

/** Test joinWays */
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

/** Test joinAllWays */
test('Test joining 2 ways', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  var way3 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let xml2 = parser.parseFromString(way2, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.joinAllWays([xml1, xml2]);
  expect(result.outerHTML).toBe(way3);
});

/** Test reverseWay */
test('Reverse way', () => {
  var way1 = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>';
  var way2 = '<way id="1"><nd ref="3"/><nd ref="2"/><nd ref="1"/></way>';
  let parser = new window.DOMParser();
  let xml1 = parser.parseFromString(way1, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.reverseWay(xml1);
  expect(result.outerHTML).toBe(way2);
});

/** Test center */
test('Center', () => {
  expect(BuildingShapeUtils.center(rightTriangle)).toStrictEqual([0, 0]);
});

/** Test getWidth */
test('Get Width', () => {
  expect(BuildingShapeUtils.getWidth(rightTriangle)).toBe(2);
});

/** Test combineCoordinates */
test('Combine Coordinates', () => {
  expect(BuildingShapeUtils.combineCoordinates(rightTriangle)).toStrictEqual([[1, 1, -1], [1, -1, 1]]);
});

/** Test extents */
const rightTriangle = new Shape();
rightTriangle.moveTo(1, 1);
rightTriangle.lineTo(1, -1);
rightTriangle.lineTo(-1, 1);

const rightTriangle2 = new Shape();
rightTriangle2.moveTo(1, 1);
rightTriangle2.lineTo(-1, 1);
rightTriangle2.lineTo(1, -1);

const rectangle = new Shape();
rectangle.moveTo(-4.332738077015795, -5.882209888874915);
rectangle.lineTo(-4.332738077015795, 5.88221335051411);
rectangle.lineTo(4.332747472106493, 5.88221335051411);
rectangle.lineTo(4.332747472106493, -5.882209888874915);

const rectangle = new Shape();
rectangle.moveTo(-4.332738077015795, -5.882209888874915);
rectangle.lineTo(-4.332738077015795, 5.88221335051411);
rectangle.lineTo(4.332747472106493, 5.88221335051411);
rectangle.lineTo(4.332747472106493, -5.882209888874915);
rectangle.lineTo(-4.332738077015795, -5.882209888874915);

test('Extents no Rotation', () => {
  expect(BuildingShapeUtils.extents(rightTriangle)).toStrictEqual([-1, -1, 1, 1]);
});

test('Extents Rotation', () => {
  const angle = 45 / 360 * 2 * 3.1415926535;
  const sqrt2 = Math.sqrt(2);
  expect(BuildingShapeUtils.extents(rightTriangle, angle)).toBeDeepCloseTo([-sqrt2, 0, sqrt2, sqrt2], 10);
});

/** Test edgeLength */
test('Edge Lengths', () => {
  expect(BuildingShapeUtils.edgeLength(rightTriangle)).toBeDeepCloseTo([2, Math.sqrt(2) * 2, 2]);
});

/** Test vertexAngle */
test('Vertex Angles', () => {
  expect(BuildingShapeUtils.vertexAngle(rightTriangle)).toStrictEqual([Math.PI / 2, Math.PI / 4, Math.PI / 4]);
});

test('Vertex Angles counterclockwise', () => {
  expect(BuildingShapeUtils.vertexAngle(rightTriangle2)).toStrictEqual([-Math.PI / 2, -Math.PI / 4, -Math.PI / 4]);
});

/** Test edgeDirection */
describe.each([
  [rightTriangle, [-Math.PI / 2, 3 * Math.PI / 4, 0], 'CW'],
  [rightTriangle2, [Math.PI, -Math.PI / 4, Math.PI / 2], 'CCW'],
  [rectangle, [Math.PI / 2, 0, -Math.PI / 2, Math.PI], 'Rect'],
])('Edge Direction', (shape, expected, description) =>{
  test(`${description}`, () => {
    expect(BuildingShapeUtils.edgeDirection(shape)).toStrictEqual(expected);
  });
});

/** Test surrounds */
describe.each([
  [[-.5, -.5], false, 'Outside but crossing'],
  [[-1.5, -1.5], false, 'Outside no crossings'],
  [[1, 1], true, 'Share Node'],
  [[.5, .5], true, 'Inside'],
  [[0, 0], true, 'Border'],
])('Surrounds', (point, expected, description) => {
  test(`${description}`, () => {
    expect(BuildingShapeUtils.surrounds(rightTriangle, point)).toBe(expected);
  });
});

/** Test calculateRadius */
test('Calculate Radius', () => {
  expect(BuildingShapeUtils.calculateRadius(rightTriangle)).toBe(1);
});

/** Test longestSideAngle */
test('Longest side angle', () => {
  expect(BuildingShapeUtils.longestSideAngle(rightTriangle)).toBe(3 * Math.PI / 4);
});

/** Test repositionPoint */
test('Reposition Point', () => {
  const point = [11.0154519, 49.5834188];
  const home = [11.015512, 49.5833659];
  const expected = [-4.3327380768877335, 5.88221335051411];
  expect(BuildingShapeUtils.repositionPoint(point, home)).toStrictEqual(expected);
});
