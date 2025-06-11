import {
  Shape,
  ShapeUtils,
} from 'three';

class BuildingShapeUtils extends ShapeUtils {

  /**
   * Create the shape of this way.
   *
   * @param {DOM.Element} way - OSM XML way element.
   * @param {number => number[2]} nodelist - dictionary of all nodes
   *
   * @return {THREE.Shape} shape - the shape
   */
  static createShape(way, nodelist) {
    // Initialize objects
    const shape = new Shape();
    var ref;
    const nodes = [];

    // Get all the nodes in the way of interest
    /** {HTMLCollection} */
    const elements = way.getElementsByTagName('nd');

    // Get the coordinates of all the nodes and add them to the shape outline.
    for (const element of elements) {
      ref = element.getAttribute('ref');
      nodes.push(nodelist[ref]);
    }
    // If the first and last point are identical, remove the last copy.
    if (nodes.length > 1 && nodes[0][0] === nodes[elements.length - 1][0] && nodes[0][1] === nodes[elements.length - 1][1]) {
      nodes.pop();
    }
    let first = true;
    for (const node of nodes) {
      // The first node requires a different function call.
      if (first) {
        first = false;
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
   * @param {[DOM.Element]} ways - array of OSM XML way elements.
   *
   * @return {[DOM.Element]} array of closed ways.
   */
  static combineWays(ways) {
    const validWays = [];

    // Check if the provided array contains any self-intersecting ways.
    // Remove them and notify the user.
    for (const way of ways) {
      if (BuildingShapeUtils.isSelfIntersecting(way)) {
        const id = way.getAttribute('id');
        const msg = 'Way ' + id + ' is self-intersecting';
        window.printError(msg);
      } else {
        validWays.push(way);
      }
    }

    const closedWays = [];
    const wayBegins = {};
    const wayEnds = {};

    // Create lists of the first and last nodes in each way.
    validWays.forEach(w => {
      const firstNodeID = w.querySelector('nd').getAttribute('ref');
      if (wayBegins[firstNodeID]) {
        wayBegins[firstNodeID].push(w);
      } else {
        wayBegins[firstNodeID] = [w];
      }

      const lastNodeID = w.querySelector('nd:last-of-type').getAttribute('ref');
      if (wayEnds[lastNodeID]) {
        wayEnds[lastNodeID].push(w);
      } else {
        wayEnds[lastNodeID] = [w];
      }
    });

    const usedWays = new Set();

    /**
     * Use recursion to attempt to build a ring from ways.
     *
     * @param {[DOM.Element]} currentRingWays - array of OSM XML way elements.
     */
    function tryMakeRing(currentRingWays) {

      // Check if the array contains ways which will together form a ring. Return the array if it does.
      if (currentRingWays[0].querySelector('nd').getAttribute('ref') ===
          currentRingWays[currentRingWays.length - 1].querySelector('nd:last-of-type').getAttribute('ref')) {
        if (BuildingShapeUtils.isSelfIntersecting(BuildingShapeUtils.joinAllWays(currentRingWays))) {
          return [];
        }
        return currentRingWays;
      }

      const lastWay = currentRingWays[currentRingWays.length - 1];
      const lastNodeID = lastWay.querySelector('nd:last-of-type').getAttribute('ref');

      // Check if any of the unused ways can complete a ring as the are.
      for (let way of wayBegins[lastNodeID] ?? []) {
        const wayID = way.getAttribute('id');
        if (usedWays.has(wayID)) {
          continue;
        }
        usedWays.add(wayID);
        currentRingWays.push(way);
        if (tryMakeRing(currentRingWays).length) {
          return currentRingWays;
        }
        currentRingWays.pop();
        usedWays.delete(wayID);
      }

      // Check if any of the unused ways can complete a ring if reversed.
      for (let way of wayEnds[lastNodeID] ?? []) {
        const wayID = way.getAttribute('id');
        if (usedWays.has(wayID)) {
          continue;
        }
        usedWays.add(wayID);
        currentRingWays.push(BuildingShapeUtils.reverseWay(way));
        if (tryMakeRing(currentRingWays).length) {
          return currentRingWays;
        }
        currentRingWays.pop();
        usedWays.delete(wayID);
      }

      return [];
    }

    validWays.forEach(w => {
      const wayID = w.getAttribute('id');
      if (usedWays.has(wayID)){
        return;
      }
      usedWays.add(wayID);
      const result = tryMakeRing([w]);
      if (result.length) {
        const ring = this.joinAllWays(result);
        closedWays.push(ring);
      }
    });

    // Notify the user if there are unused ways.
    // if (validWays.length !== usedWays.length) {
    //   window.printError('Unused ways in relation')
    // }
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
    const nodes = way2.getElementsByTagName('nd');
    const newWay = way1.cloneNode(true);
    for (let i = 1; i < nodes.length; i++) {
      let elem = nodes[i].cloneNode();
      newWay.appendChild(elem);
    }
    return newWay;
  }

  /**
   * Append the nodes from one way into another.
   *
   * @param {DOM.Element} way1 - an open, non self-intersecring way
   * @param {DOM.Element} way2
   *
   * @return {DOM.Element} way
   */
  static joinAllWays(ways) {
    let way = ways[0];
    ways.slice(1).forEach(w => {
      way = this.joinWays(way, w);
    });
    return way;
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
   * Extract point data from a shape.
   * Combine all the x values into one array and
   * y values into another
   *
   * @param {THREE.Shape} shape - the shape
   *
   * @return {[number], [number]} array of xs and ys.
   */
  static combineCoordinates(shape) {
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
  static extents(shapes, angle = 0) {
    if (!Array.isArray(shapes)) {
      shapes = [shapes];
    }
    var x = [];
    var y = [];
    var vec;
    for (const shape of shapes) {
      const points = shape.extractPoints().shape;
      for (const vec of points) {
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
    for (const i in points) {
      p1 = points[i];
      p2 = points[(i + 1) % points.length];
      lengths.push(Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2));
    }
    return lengths;
  }

  /**
   * Calculate the angle at each of a shape's vertex.
   * The angle will be PI > x >= -PI
   *
   * @param {THREE.Shape} shape - the shape
   *
   * @return {[number, ...]} the angles in radians.
   */
  static vertexAngle(shape) {
    const points = shape.extractPoints().shape;
    const angles = [];
    var p0;
    var p1;
    var p2;

    function calcAngle(p0, p1, p2) {
      let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) - Math.atan2(p0.y - p1.y, p0.x - p1.x);
      if (angle >= Math.PI) {
        angle -= 2 * Math.PI;
      } else if (angle < -Math.PI) {
        angle += 2 * Math.PI;
      }
      return angle;
    }

    for (const i in points) {
      p0 = points[i - 1 < 0 ? points.length - 1 : i - 1];
      p1 = points[i];
      p2 = points[(i + 1) % points.length];
      angles.push(calcAngle(p0, p1, p2));
    }
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
    const angles = [];
    var p1;
    var p2;
    for (let i = 0; i < points.length; i++) {
      p1 = points[i];
      p2 = points[(i + 1) % points.length];
      let angle = Math.atan2((p2.y - p1.y), (p2.x - p1.x));
      angles.push(angle);
    }
    return angles;
  }

  /**
   * Is the given point within the given shape?
   *
   * @param {THREE.Shape} shape - the shape
   * @param {[number, number]} point - an x, y pair.
   *
   * @return {boolean}
   */
  static surrounds(shape, point) {
    var count = 0;
    const vecs = shape.extractPoints().shape;
    var vec;
    var nextvec;
    for (let i = 0; i < vecs.length; i++) {
      vec = vecs[i];
      nextvec = vecs[(i + 1) % vecs.length];
      if (vec.x === point[0] && vec.y === point[1]) {
        return true;
      }
      if (nextvec.x === vec.x) {
        // vertical line
        if (vec.x === point[0]) {
          return true;
        }
        if (vec.x > point[0] && (vec.y > point[1] || nextvec.y > point[1]) && !(vec.y > point[1] && nextvec.y > point[1])){
          count++;
        }
      } else if (nextvec.y === vec.y) {
        if (vec.y === point[1] && (vec.x > point[0] || nextvec.x > point[0]) && !(vec.x > point[0] && nextvec.x > point[0])){
          return true;
        }
      } else {
        const slope = (nextvec.y - vec.y) / (nextvec.x - vec.x);
        const intercept = vec.y - slope * vec.x;
        const intersection = (point[1] - intercept) / slope;
        if (intersection > point[0] && intersection < Math.max(nextvec.x, vec.x) && intersection > Math.min(nextvec.x, vec.x)) {
          count++;
        } else if (intersection === point[0]) {
          return true;
        }
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
   * Return the angle of the longest side of a shape with 90° vertices.
   *
   * @param {THREE.Shape} shape - the shape
   * @return {number} in radians from Pi > x > -Pi
   */
  static longestSideAngle(shape) {
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
