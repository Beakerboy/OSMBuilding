class BuildingShapeUtils extends THREE.ShapeUtils {

  /**
   * Calculate the radius of a circle that can fit within
   * this way.
   */
  calculateRadius(pts) {
    const elements = this.way.getElementsByTagName("nd");
    var lats = [];
    var lons = [];
    let ref = 0;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
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
   * this does not actually calculate the centroid.
   */
  static centroid(pts) {
    const elements = this.way.getElementsByTagName("nd");
    var lats = [];
    var lons = [];
    var ref;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
      node = this.nodelist[ref];
      lats.push(node[0]);
      lons.push(node[1]);
    }
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);
    const center = [(top + bottom) / 2, (left + right) / 2];
    return center;
  }

  /**
   * Return the longest cardinal side length.
   *
   * @param {THREE.Shape} shape - the shape
   */
  static getWidth(shape) {
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
    return Math.max(Math.max(...x) - Math.min(...x), Math.max(...y) - Math.min(...y));
  }

  /**
   * Assuming the shape is all right angles,
   * Find the orientation of the longest edge.
   */
  static primaryDirection(pts) {
  }
}
