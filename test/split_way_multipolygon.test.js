/**
 * @jest-environment jsdom
 */

import { Shape, Mesh } from 'three';
import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;

import { Building } from '../src/building.js';
import { MultiBuildingPart } from '../src/multibuildingpart.js';

const data = `
<osm>
  <node id="12" lat="4" lon="4"/>
  <node id="11" lat="4" lon="4.001"/>
  <node id="6" lat="4.001" lon="4.001"/>
  <node id="7" lat="4.001" lon="4"/>
  <node id="8" lat="4.00025" lon="4.00025"/>
  <node id="9" lat="4.00025" lon="4.00075"/>
  <node id="10" lat="4.00075" lon="4.0005"/>
  <relation id="5">
    <member ref="1" role="outer"/>
    <member ref="3" role="outer"/>
    <member ref="2" role="inner"/>
    <tag k="type" v="multipolygon"/>
    <tag k="building" v="yes"/>
    <tag k="roof:shape" v="skillion"/>
    <tag k="roof:direction" v="0"/>
    <tag k="roof:angle" v="45"/>
  </relation>
  <way id="1">
    <nd ref="12"/>
    <nd ref="11"/>
    <nd ref="6"/>
  </way>
  <way id="2">
    <nd ref="8"/>
    <nd ref="9"/>
    <nd ref="10"/>
    <nd ref="8"/>
  </way>
  <way id="3">
    <nd ref="6"/>
    <nd ref="7"/>
    <nd ref="12"/>
  </way>
</osm>`;

test('Test Simple Multipolygon', () => {
  let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
  const nodelist = Building.buildNodeList(xmlData);
  const shape = new MultiBuildingPart('5', xmlData, nodelist);
  expect(shape.id).toBe('5');
  expect(shape.shape).toBeInstanceOf(Shape);
  // expect(shape.roof).toBeInstanceOf(Mesh);
});

window.printError = printError;

const errors = [];

function printError(txt) {
  errors.push[txt];
}
