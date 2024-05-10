/**
 * @jest-environment jsdom
 */

import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
import { JSDOM } from 'jsdom';

test('Test Closed Way', () => {
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let parser = new window.DOMParser();
  let xmlData = parser(way);
  expect(BuildingShapeUtils.isClosed(xmlData)).toBe(true);
});
