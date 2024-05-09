QUnit.test('Closed Way', assert => {
  var way = '<way id="1"><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="5"/><nd ref="2"/></way>';
  let xmlData = new window.DOMParser().parseFromString(way, 'text/xml');
  assert.true(BuildingShapeUtils.isClosed(xmlData));
});
