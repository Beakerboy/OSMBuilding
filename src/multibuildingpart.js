import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
import {BuildingPart} from './buildingpart.js';
/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  /**
   * Create the shape of the outer relation.
   *
   * @return {THREE.Shape} shape - the shape
   */
  buildShape() {
    this.type = 'multipolygon';
    const innerMembers = this.way.querySelectorAll('member[role="inner"][type="way"]');
    const outerMembers = this.way.querySelectorAll('member[role="outer"][type="way"]');
    const innerShapes = [];
    const shapes = [];
    for (let i = 0; i < innerMembers.length; i++) {
      const wayID = innerMembers[i].getAttribute('ref');
      const way = this.fullXmlData.getElementById(wayID);
      if (way) {
        innerShapes.push(BuildingShapeUtils.createShape(way, this.nodelist, this.augmentedNodelist));
      } else {
        window.printError(`Missing way ${wayID} for relation ${this.id} for inner members`);
        innerShapes.push(BuildingShapeUtils.createShape(this.augmentedWays[wayID], this.nodelist, this.augmentedNodelist));
      }
    }
    const ways = [];
    for (let j = 0; j < outerMembers.length; j++) {
      const wayID = outerMembers[j].getAttribute('ref');
      const way = this.fullXmlData.getElementById(wayID);
      if (way) {
        ways.push(way);
      } else {
        window.printError(`Missing way ${wayID} for relation ${this.id}`);
        ways.push(this.augmentedWays[wayID]);
      }
    }
    const closedWays = BuildingShapeUtils.combineWays(ways);
    for (let k = 0; k < closedWays.length; k++) {
      const shape = BuildingShapeUtils.createShape(closedWays[k], this.nodelist, this.augmentedNodelist);
      shape.holes.push(...innerShapes);
      shapes.push(shape);
    }
    if (closedWays.length === 1) {
      return shapes[0];
    }
    // Multiple outer members
    return shapes;
  }

  getWidth() {
    var xy = [[], []];
    for (let i = 0; i < this.shape.length; i++){
      const shape = this.shape[i];
      const newXy = BuildingShapeUtils.combineCoordinates(shape);
      xy[0] = xy[0].concat(newXy[0]);
      xy[1] = xy[1].concat(newXy[1]);
    }

    const x = xy[0];
    const y = xy[1];
    window.printError('Multibuilding x: ' + x);
    window.printError('Multibuilding y: ' + y);
    const widths = Math.max(Math.max(...x) - Math.min(...x), Math.max(...y) - Math.min(...y));
    window.printError('Multibuilding Width: ' + widths);
    return widths;
  }
}
export {MultiBuildingPart};
