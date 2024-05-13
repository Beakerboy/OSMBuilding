/**
 * @jest-environment jsdom
 */

import { TextEncoder } from 'node:util';
global.TextEncoder = TextEncoder;

import { Building } from '../src/building.js';
import { MultiBuildingPart } from '../src/multibuildingpart.js';

const data = `
<?xml version="1.0" encoding="UTF-8"?>
<osm>
  <node id="3" lat="4" lon="4"/>
  <node id="5" lat="4" lon="4.001"/>
  <node id="6" lat="4.001" lon="4.001"/>
  <node id="7" lat="4.001" lon="4"/>
  <node id="8" lat="4.00025" lon="4.00025"/>
  <node id="9" lat="4.00025" lon="4.00075"/>
  <node id="10" lat="4.00075" lon="4.0005"/>
  <relation id="4">
    <member ref="1" role="outer"/>
    <member ref="2" role="inner"/>
    <tag k="type" v="multipolygon"/>
    <tag k="building" v="yes"/>
    <tag k="roof:shape" v="skillion"/>
    <tag k="roof:direction" v="0"/>
    <tag k="roof:angle" v="45"/>
  </relation>
  <way id="1">
    <nd ref="3"/>
    <nd ref="5"/>
    <nd ref="6"/>
    <nd ref="7"/>
    <nd ref="3"/>
  </way>
  <way id="2">
    <nd ref="8"/>
    <nd ref="9"/>
    <nd ref="10"/>
    <nd ref="8"/>
  </way>
</osm>`;

test('Test Simple Multipolygon', () => {
  let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
  const nodelist = Building.buildNodeList(xmlData);
  const shape = new MultiBuildingPart('4', xmlData, nodelist);
});
