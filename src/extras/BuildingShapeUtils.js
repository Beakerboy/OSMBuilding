import {
  Shape,
  ShapeUtils,
} from 'three';

class BuildingShapeUtils extends ShapeUtils {

  /**
   * Create the shape of this way.
   *
   * @param {DOM.Element} way - OSM XML way element.
   * @param {[number, number]} nodelist - list of all nodes
   *
   * @return {THREE.Shape} shape - the shape
   */
  static createShape(way, nodelist) {
    // Initialize objects
    const shape = new Shape();
    var ref;
    var node = [];

    // Get all the nodes in the way of interest
    const elements = way.getElementsByTagName('nd');

    // Get the coordinates of all the nodes and add them to the shape outline.
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute('ref');
      node = nodelist[ref];
      // The first node requires a differnet function call.
      if (i === 0) {
        shape.moveTo(parseFloat(node[0]), parseFloat(node[1]));
      } else {
        shape.lineTo(parseFloat(node[0]), parseFloat(node[1]));
      }
    }
    return shape;
  }

  /**
   * Check if a way is a closed shape.
   *
   * @param {DOM.Element} way - OSM XML way element.
   *
   * @return {boolean}
   */
  static isClosed(way) {
    // Get all the nodes in the way of interest
    const elements = way.getElementsByTagName('nd');
    return elements[0].getAttribute('ref') === elements[elements.length - 1].getAttribute('ref');
  }

  /**
   * Check if a way is self-intersecting.
   *
   * @param {DOM.Element} way - OSM XML way element.
   *
   * @return {boolean}
   */
  static isSelfIntersecting(way) {
    const nodes = Array.from(way.getElementsByTagName('nd'));
    if (BuildingShapeUtils.isClosed(way)){
      nodes.pop();
    }
    const refs = new Set();
    for (const node of nodes) {
      const ref = node.getAttribute('ref');
      if (refs.has(ref)){
        return true;
      }
      refs.add(ref);
    }
    return false;
  }

  /**
   * Walk through an array and seperate any closed ways.
   * Attempt to find matching open ways to enclose them.
   *
   * @param {[DOM.Element]} array - list of OSM XML way elements.
   *
   * @return {[DOM.Element]} array of closed ways.
   */
  static combineWays(ways) {
    var closedWays = [];
    var openWays = [];
    var changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < ways.length - 1; i++) {
        if (BuildingShapeUtils.isClosed(ways[i])) {
          closedWays.push(ways[i]);
        } else {
          // These are HTMLCollections of nodes, not ways.
          const way1 = ways[i].getElementsByTagName('nd');
          const way2 = ways[i + 1].getElementsByTagName('nd');

          // If the first node of way2 is the same as the last in way one, they can be combined
          // Or if the first node of way1 is the same as the last in way2
          // Need to extend this to tip-to-tip connections as well.
          // Need to add a "reverse way" function somewhere.
          if (way2[0].getAttribute('ref') === way1[way1.length - 1].getAttribute('ref')) {
            const result = BuildingShapeUtils.joinWays(ways[i], ways[i + 1]);
            openWays.push(result);
            i++;
            changed = true;
          } else if (way1[0].getAttribute('ref') === way2[way2.length - 1].getAttribute('ref')) {
            const result = BuildingShapeUtils.joinWays(ways[i + 1], ways[i]);
            openWays.push(result);
            i++;
            changed = true;
          } else if (way1[way1.length - 1].getAttribute('ref') === way2[way2.length - 1].getAttribute('ref')) {
            const tempway = BuildingShapeUtils.reverseWay(ways[i + 1]);
            const result = BuildingShapeUtils.joinWays(ways[i], tempway);
            openWays.push(result);
            i++;
            changed = true;
          } else if (way1[0].getAttribute('ref') === way2[0].getAttribute('ref')) {
            const tempway = BuildingShapeUtils.reverseWay(ways[i+1]);
            const result = BuildingShapeUtils.joinWays(tempway, ways[i]);
            openWays.push(result);
            i++;
            changed = true;
          } else {
            openWays.push(ways[i]);
          }
        }
      }
      const lastWay = ways[ways.length - 1];
      if (BuildingShapeUtils.isClosed(lastWay)) {
        closedWays.push(lastWay);
      } else {
        openWays.push(lastWay);
      }
      ways = openWays;
      openWays = [];
    }
    return closedWays;
  }

  /**
   * Append the nodes from one way into another.
   *
   * @param {DOM.Element} way1 - an open, non self-intersecring way
   * @param {DOM.Element} way2
   *
   * @return {DOM.Element} way
   */
  static joinWays(way1, way2) {
    const elements = way2.getElementsByTagName('nd');
    for (let i = 1; i < elements.length; i++) {
      let elem = elements[i].cloneNode();
      way1.appendChild(elem);
    }
    return way1;
  }

  /**
   * Reverse the order of nodes in a way.
   *
   * @param {DOM.Element} way - a way
   *
   * @return {DOM.Element} way
   */
  static reverseWay(way) {
    const elements = way.getElementsByTagName('nd');
    const newWay = way.cloneNode(true);
    newWay.innerHTML = '';
    for (let i = 0; i < elements.length; i++) {
      let elem = elements[elements.length - 1 - i].cloneNode();
      newWay.appendChild(elem);
    }
    return newWay;
  }

  /**
   * Find the center of a closed way
   *
   * @param {THREE.Shape} shape - the shape
   *
   * @return {[number, number]} xy - x/y coordinates of the center
   */
  static center(shape) {
    const extents = BuildingShapeUtils.extents(shape);
    const center = [(extents[0] + extents[2] ) / 2, (extents[1]  + extents[3] ) / 2];
    return center;
  }

  /**
   * Return the longest cardinal side length.
   *
   * @param {THREE.Shape} shape - the shape
   */
  static getWidth(shape) {
    const xy = BuildingShapeUtils.combineCoordinates(shape);
    const x = xy[0];
    const y = xy[1];
    return Math.max(Math.max(...x) - Math.min(...x), Math.max(...y) - Math.min(...y));
  }

  /**
   * can points be an array of shapes?
   */
  static combineCoordinates(shape) {
    //console.log('Shape: ' + JSON.stringify(shape));
    const points = shape.extractPoints().shape;
    var x = [];
    var y = [];
    var vec;
    for (let i = 0; i < points.length; i++) {
      vec = points[i];
      x.push(vec.x);
      y.push(vec.y);
    }
    return [x, y];
  }

  /**
   * Calculate the Cartesian extents of the shape after rotaing couterclockwise by a given angle.
   *
   * @param {THREE.Shape} pts - the shape or Array of shapes.
   * @param {number} angle - angle in radians to rotate shape
   *
   * @return {[number, number, number, number]} the extents of the object.
   */
  static extents(shape, angle = 0) {
    if (!Array.isArray(shape)) {
      shape = [shape];
    }
    var x = [];
    var y = [];
    var vec;
    for (let i = 0; i < shape.length; i++) {
      const points = shape[i].extractPoints().shape;
      for (let i = 0; i < points.length; i++) {
        vec = points[i];
        x.push(vec.x * Math.cos(angle) - vec.y * Math.sin(angle));
        y.push(vec.x * Math.sin(angle) + vec.y * Math.cos(angle));
      }
    }
    const left = Math.min(...x);
    const bottom = Math.min(...y);
    const right = Math.max(...x);
    const top = Math.max(...y);
    return [left, bottom, right, top];
  }

  /**
   * Assuming the shape is all right angles,
   * Find the orientation of the longest edge.
   */
  static primaryDirection(shape) {
    const points = shape.extractPoints().shape;
  }

  /**
   * Calculate the length of each of a shape's edge
   *
   * @param {THREE.Shape} shape - the shape
   *
   * @return {[number, ...]} the esge lwngths.
   */
  static edgeLength(shape) {
    const points = shape.extractPoints().shape;
    const lengths = [];
    var p1;
    var p2;
    for (let i = 0; i < points.length - 1; i++) {
      p1 = points[i];
      p2 = points[i + 1];
      lengths.push(Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2));
    }
    p1 = points[points.length - 1];
    p2 = points[0];
    lengths.push(Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2));
    return lengths;
  }

  /**
   * Calculate the angle at each of a shape's vertex
   */
  static vertexAngle(shape) {
    const points = shape.extractPoints().shape;
    const angles = [];
    var p0;
    var p1;
    var p2;
    p0 = points[points.length - 1];
    p1 = points[0];
    p2 = points[1];
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) - Math.atan2(p0.y - p1.y, p0.x - p1.x);
    angles.push(angle);
    for (let i = 1; i < points.length - 1; i++) {
      p0 = points[i - 1];
      p1 = points[i];
      p2 = points[i + 1];
      angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) - Math.atan2(p0.y - p1.y, p0.x - p1.x);
      angles.push(angle);
    }
    p0 = points[points.length - 2];
    p1 = points[points.length - 1];
    p2 = points[0];
    angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) - Math.atan2(p0.y - p1.y, p0.x - p1.x);
    angles.push(angle);
    return angles;
  }

  /**
   * Calculate the angle of each of a shape's edge.
   * the angle will be PI > x >= -PI
   *
   * @param {THREE.Shape} shape - the shape
   *
   * @return {[number, ...]} the angles in radians.
   */
  static edgeDirection(shape) {
    const points = shape.extractPoints().shape;
    points.push(points[0]);
    const angles = [];
    var p1;
    var p2;
    for (let i = 0; i < points.length - 1; i++) {
      p1 = points[i];
      p2 = points[i + 1];
      let angle = Math.atan2((p2.y - p1.y), (p2.x - p1.x));
      if (angle >= Math.PI / 2) {
        angle -= Math.PI;
      } else if (angle < -Math.PI / 2) {
        angle += Math.PI;
      }
      angles.push(angle);
    }
    return angles;
  }

  /**
   * Count the number of times that a line horizontal from point intersects shape
   *
   * if an odd number are crossed, it is inside.
   * todo, test holes
   * Test edge conditions.
   */
  static surrounds(shape, point) {
    var count = 0;
    const vecs = shape.extractPoints().shape;
    var vec;
    var nextvec;
    for (let i = 0; i < vecs.length - 1; i++) {
      vec = vecs[i];
      nextvec = vecs[i+1];
      if (vec.x === point[0] && vec.y === point[1]) {
        return true;
      }
      if ((vec.x >= point[0] || nextvec.x >= point[0]) && (vec.y >= point[1] !== nextvec.y >= point[1])) {
        count++;
      }
    }
    return count % 2 === 1;
  }

  /**
   * Calculate the radius of a circle that can fit within a shape.
   *
   * @param {THREE.Shape} shape - the shape
   */
  static calculateRadius(shape) {
    const extents = BuildingShapeUtils.extents(shape);
    // return half of the shorter side-length.
    return Math.min(extents[2] - extents[0], extents[3] - extents[1]) / 2;
  }

  /**
   * Calculate the angle of the longest side of a shape with 90° vertices.
   * is begining / end duplicated?
   *
   * @param {THREE.Shape} shape - the shape
   * @return {number}
   */
  static longestSideAngle(shape) {
    const vecs = shape.extractPoints().shape;
    const lengths = BuildingShapeUtils.edgeLength(shape);
    const directions = BuildingShapeUtils.edgeDirection(shape);
    var index;
    var maxLength = 0;
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[i] > maxLength) {
        index = i;
        maxLength = lengths[i];
      }
    }
    var angle = directions[index];
    const extents = BuildingShapeUtils.extents(shape, -angle);
    // If the shape is taller than it is wide after rotation, we are off by 90 degrees.
    if ((extents[3] - extents[1]) > (extents[2] - extents[0])) {
      angle = angle > 0 ? angle - Math.PI / 2 : angle + Math.PI / 2;
    }
    return angle;
  }

  /**
   * Rotate lat/lon to reposition the home point onto 0,0.
   *
   * @param {[number, number]} lonLat - The longitute and latitude of a point.
   *
   * @return {[number, number]} x, y in meters
   */
  static repositionPoint(lonLat, home) {
    const R = 6371 * 1000;   // Earth radius in m
    const circ = 2 * Math.PI * R;  // Circumference
    const phi = 90 - lonLat[1];
    const theta = lonLat[0] - home[0];
    const thetaPrime = home[1] / 180 * Math.PI;
    const x = R * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);
    const y = R * Math.cos(phi / 180 * Math.PI);
    const z = R * Math.sin(phi / 180 * Math.PI) * Math.cos(theta / 180 * Math.PI);
    const abs = Math.sqrt(z**2 + y**2);
    const arg = Math.atan(y / z) - thetaPrime;

    return [x, Math.sin(arg) * abs];
  }
}
export {BuildingShapeUtils};
