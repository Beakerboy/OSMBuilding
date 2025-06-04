import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
import {BuildingPart} from './buildingpart.js';
/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  makeRings(members) {
    const ways = [];
    for (let j = 0; j < members.length; j++) {
      const wayID = members[j].getAttribute('ref');
      const way = this.fullXmlData.getElementById(wayID);
      if (way) {
        ways.push(way.cloneNode(true));
      } else {
        window.printError(`Missing way ${wayID} for relation ${this.id}`);
        ways.push(this.augmentedWays[wayID].cloneNode(true));
      }
    }
    return BuildingShapeUtils.combineWays(ways);
  }

  /**
   * Create the shape of the outer relation.
   *
   * @return {THREE.Shape} shape - the shape
   */
  buildShape() {
    this.type = 'multipolygon';
    const innerMembers = this.way.querySelectorAll('member[role="inner"][type="way"]');
    const outerMembers = this.way.querySelectorAll('member[role="outer"][type="way"]');
    const shapes = [];
    const innerShapes = this.makeRings(innerMembers).map(ring => BuildingShapeUtils.createShape(ring, this.nodelist, this.augmentedNodelist));
    const closedOuterWays = this.makeRings(outerMembers);
    for (let k = 0; k < closedOuterWays.length; k++) {
      const shape = BuildingShapeUtils.createShape(closedOuterWays[k], this.nodelist, this.augmentedNodelist);
      shape.holes.push(...innerShapes);
      shapes.push(shape);
    }
    if (closedOuterWays.length === 1) {
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
