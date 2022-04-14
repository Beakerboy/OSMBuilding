class BuildingShapeUtils extends THREE.ShapeUtils {

  /**
   * Create the shape of this way.
   */
  static createShape(way, nodelist) {
    const elements = way.getElementsByTagName('nd');
    const shape = new THREE.Shape();
    var ref;
    var node = [];
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute('ref');
      node = nodelist[ref];
      if (i === 0) {
        shape.moveTo(parseFloat(node[1]), parseFloat(node[0]));
      } else {
        shape.lineTo(parseFloat(node[1]), parseFloat(node[0]));
      }
    }
    return shape;
  }

  /**
   * Calculate the radius of a circle that can fit within
   * this way.
   */
  calculateRadius(pts) {
    const elements = this.way.getElementsByTagName('nd');
    var lats = [];
    var lons = [];
    let ref = 0;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute('ref');
      node = this.nodelist[ref];
      lats.push(node[0]);
      lons.push(node[1]);
    }
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);

    // Set the "home point", the lat lon to center the structure.
    return Math.min(right - left, top - bottom) / 2;
  }

  /**
   * Find the center of a closed way
   *
   * @return {[number, number]} xy - x/y coordinates of the center
   */
  static center(shape) {
    const extents = BuildingShapeUtils.extents(shape);
    const center = [(extents[0] + extents[2] ) / 2, (extents[1]  + extents[3] ) / 2];
    return center;
  }

  /**
   * Find the centroid of a closed way.
   */
  static centroid(pts) {
    const shape = shape.extractPoints().shape;
    const holes = shape.extractPoints().holes;
    const faces = BuildingShapeUtils.triangulateShape(shape, holes);
    // array of vectors
    var centroids = [];
    // array of scalars.
    var areas = [];
    // foreach face, calculate area and centroid.
    // centroids.push([face.avex, face.avey]);
    // area.push(HeronsFormula(face));
    const totalArea = Math.sum(...areas);
    // multiply each centroid by its area and divide by the total area.
    // sum the vectors.
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
    const points = shape.extractPoints().shape;
    var x = [];
    var y = [];
    var miny;
    var maxy;
    var vec;
    for (let i = 0; i < points.length; i++) {
      vec = points[i];
      x.push(vec.x);
      y.push(vec.y);
    }
    return [x, y];
  }

  /**
   * Calculate the Cartesian extents of the shape.
   *
   * @param {THREE.Shape} pts - the shape
   * @return {[number, number, number, number]} the extents of the object.
   */
  static extents(shape) {
    const xy = BuildingShapeUtils.combineCoordinates(shape);
    const x = xy[0];
    const y = xy[1];
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
    p1 = points[points.length];
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
    p0 = points[points.length];
    p1 = points[0];
    p2 = points[1];
    angle.push(Math.atan((p2.y - p1.y) / (p2.x - p1.x)) - Math.atan((p0.y - p1.y) / (p0.x - p1.x)));
    for (let i = 1; i < points.length - 1; i++) {
      p0 = points[i-1];
      p1 = points[i];
      p2 = points[i + 1];
      angle.push(Math.atan((p2.y - p1.y) / (p2.x - p1.x)) - Math.atan((p0.y - p1.y) / (p0.x - p1.x)));
    }
    p0 = points[points.length-1];
    p1 = points[points.length];
    p2 = points[0];
    angle.push(Math.atan((p2.y - p1.y) / (p2.x - p1.x)) - Math.atan((p0.y - p1.y) / (p0.x - p1.x)));
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
      vec = points[i];
      nextvec = points[i+1];
      if (vec.x === point[0] && vec.y === point[1]) {
        return true;
      }
      if ((vec.x >= point[0] || nextvec.x >= point[0]) && (vec.y >= point[1] !== nextvec.y >= point[1])) {
        count++;
      }
    }
    return count % 2 === 1;
  }
}
