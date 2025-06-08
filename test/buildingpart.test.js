/**
 * @jest-environment jsdom
 */
import { BuildingPart } from '../src/buildingpart.js';
import { BuildingShapeUtils } from '../src/extras/BuildingShapeUtils.js';
import { TextEncoder } from 'node:util';

const data = `
<osm version="0.6" generator="openstreetmap-cgimap 2.0.1 (3529586 spike-06.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
<node id="349300285" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5833130" lon="11.0155721"/>
<node id="349300289" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5834188" lon="11.0154519"/>
<node id="349300292" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5833130" lon="11.0154519"/>
<node id="349300295" visible="true" version="2" changeset="16924847" timestamp="2013-07-12T11:32:52Z" user="Oberaffe" uid="56597" lat="49.5834188" lon="11.0155721"/>
<way id="31361386" visible="true" version="7" changeset="103461964" timestamp="2021-04-23T08:01:35Z" user="hans007" uid="376477">
<nd ref="349300292"/>
<nd ref="349300289"/>
<nd ref="349300295"/>
<nd ref="349300285"/>
<nd ref="349300292"/>
<tag k="addr:city" v="Erlangen"/>
<tag k="addr:country" v="DE"/>
<tag k="addr:housenumber" v="30"/>
<tag k="addr:postcode" v="91052"/>
<tag k="addr:street" v="Badstraße"/>
<tag k="building" v="detached"/>
<tag k="building:levels" v="1"/>
<tag k="roof:levels" v="2"/>
<tag k="roof:shape" v="gabled"/>
</way>
</osm>`;

beforeEach(() => {
  errors = [];
});

test('Test Cardinal to Degree', () => {
  expect(BuildingPart.cardinalToDegree('N')).toBe(0);
  expect(BuildingPart.cardinalToDegree('sSw')).toBe(202);
  expect(BuildingPart.cardinalToDegree('Wse')).toBeUndefined();
});

test('radToDeg', () => {
  expect (BuildingPart.atanRadToCompassDeg(0)).toBe(90);
  expect (BuildingPart.atanRadToCompassDeg(Math.PI / 2)).toBe(0);
});

test('Constructor', () => {
  let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
  const nodes = {
    '349300285': [4.332747472106493, -5.882209888874915],
    '349300289': [-4.332738077015795, 5.88221335051411],
    '349300292': [-4.332738077015795, -5.882209888874915],
    '349300295': [4.332747472106493, 5.88221335051411],
  };
  const part = new BuildingPart('31361386', xmlData, nodes);
  expect(part.options.building.levels).toBe(1);
  expect(part.options.roof.levels).toBe(2);
  expect(part.options.roof.shape).toBe('gabled');

  // Gabled with unspecified orientation shal be 'along'
  expect(part.options.roof.orientation).toBe('along');

  // toDo: Mock BuildingShapeUtils and test options
  expect(BuildingShapeUtils.edgeDirection(part.shape)).toStrictEqual([1.5707963267948966, 0, -1.5707963267948966, 3.141592653589793]);
  expect(BuildingShapeUtils.longestSideAngle(part.shape)).toBe(1.5707963267948966);
  expect(part.options.roof.direction).toBe(90);
  expect(errors.length).toBe(0);
});

window.printError = printError;

var errors = [];

function printError(txt) {
  errors.push[txt];
}
