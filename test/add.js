QUnit.test('Closed Way', assert => {
  const jsdom = require("jsdom");
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let parser = new DOMParser();
  let xmlData = jsdom.JSDOM(way);
  assert.true(BuildingShapeUtils.isClosed(xmlData));
});
