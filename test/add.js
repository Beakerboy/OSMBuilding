Qunit.module('qunit testing', function () {
  QUnit.test('Closed Way', assert => {
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom
    var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
    let parser = new JSDOM.window.DOMParser();
    let xmlData = parser(way);
    assert.true(BuildingShapeUtils.isClosed(xmlData));
  });
});
