const building_shape_utils = require('../src/extras/BuildingShapeUtils');
const jsdom = require('jsdom');

test('Test Closed Way', () => {
  const { JSDOM } = jsdom;
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let parser = new JSDOM.window.DOMParser();
  let parser = new document.DOMParser();
  let xmlData = parser(way);
  expect(building_shape_utils.isClosed(xmlData)).toBe(true);
  
});
