import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
import {BuildingPart} from './buildingpart.js';
/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  buildShape() {
    this.type = 'multipolygon';
    const innerMembers = this.way.querySelectorAll('member[role="inner"]');
    const outerMembers = this.way.querySelectorAll('member[role="outer"]');
    const innerShapes = [];
    var shapes = [];
    window.printError('Inner members: ' + innerMembers.length);
    for (let i = 0; i < innerMembers.length; i++) {
      const way = this.fullXmlData.getElementById(innerMembers[i].getAttribute('ref'));
      innerShapes.push(BuildingShapeUtils.createShape(way, this.nodelist));
    }
    window.printError('Outer members: ' + outerMembers.length);
    for (let j = 0; j < outerMembers.length; j++) {
      const way = this.fullXmlData.getElementById(outerMembers[j].getAttribute('ref'));
      const shape = BuildingShapeUtils.createShape(way, this.nodelist);
      shape.holes.push(...innerShapes);
      shapes.push(shape);
    }
    if (outerMembers.length === 1) {
      return shapes[0];
    }
    // Multiple outer members
    return shapes;
  }

 getWidth() {
    return BuildingShapeUtils.getWidth(this.shapes[0]);
  }
}
export {MultiBuildingPart};
