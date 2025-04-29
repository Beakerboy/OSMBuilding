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

test('Test no combining necessary. one open way', () => {
  var way = '<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/></way>';
  let parser = new window.DOMParser();
  let xml = parser.parseFromString(way, 'text/xml').getElementsByTagName('way')[0];
  let result = BuildingShapeUtils.combineWays([xml]);
  expect(result.length).toBe(0);
});

describe('Combine Ways', () => {
  test.each([
    [
      [
        '<way id="1"><nd ref="1"/><nd ref="2"/></way>',
        '<way id="2"><nd ref="2"/><nd ref="3"/></way>',
        '<way id="3"><nd ref="3"/><nd ref="1"/></way>',
      ], 1, 4, 'Test combining 3 ways 1->2->3',
    ],
    [
      [
        '<way id="1"><nd ref="1"/><nd ref="2"/></way>',
        '<way id="2"><nd ref="3"/><nd ref="1"/></way>',
        '<way id="3"><nd ref="2"/><nd ref="3"/></way>',
      ], 1, 4, 'Test combining 3 ways 2->1->3',
    ],
    [
      [
        '<way id="1"><nd ref="1"/><nd ref="2"/></way>',
        '<way id="2"><nd ref="3"/><nd ref="2"/></way>',
        '<way id="3"><nd ref="3"/><nd ref="1"/></way>',
      ], 1, 4, 'Test combining tip to tip',
    ],
    [
      [
        '<way id="1"><nd ref="1"/><nd ref="2"/></way>',
        '<way id="2"><nd ref="1"/><nd ref="3"/></way>',
        '<way id="3"><nd ref="2"/><nd ref="3"/></way>',
      ], 1, 4, 'Test combining tail to tail',
    ],
    [
      [
        '<way id="1"><nd ref="1"/><nd ref="2"/></way>',
        '<way id="2"><nd ref="3"/><nd ref="4"/></way>',
        '<way id="3"><nd ref="4"/><nd ref="1"/></way>',
        '<way id="4"><nd ref="2"/><nd ref="3"/></way>',
      ], 1, 5, 'Test combining 4 ways',
    ],
  ])('${description}', (ways, length, nodes, description) => {
    let parser = new window.DOMParser();
    const xml = [];
    for (const way of ways){
      xml.push(parser.parseFromString(way, 'text/xml').getElementsByTagName('way')[0]);
    }
    let result = BuildingShapeUtils.combineWays(xml);
    expect(result.length).toBe(length);
    expect(BuildingShapeUtils.isClosed(result[0]));
    expect(BuildingShapeUtils.isSelfIntersecting(result[0])).toBe(false);
    expect(result[0].getElementsByTagName('nd').length).toBe(nodes);
  });
});
