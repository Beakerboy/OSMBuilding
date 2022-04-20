/**
 * Modify ExtrudeGeometry such that z varies with x and y
 */
class RampGeometry extends THREE.BufferGeometry () {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'RampGeometry';

    this.parameters = {
      shape: shape,
      options: options,
    };
    const depth = options.depth;
    const angle = options.angle;

    var points = shape.extractPoints().shape;
    const reverse = ! THREE.ShapeUtils.isClockWise( points );
    if ( reverse ) {
      points = points.reverse();
    }
    var rampDepth;
    var nextRampDepth;
    var minDepth;
    var maxDepth;
    var positions = [];
    var point;
    var nextPoint;
    for (let i = 0; i < points.length - 1; i++) {
      point = points[i];
      nextPoint = points[i + 1];
      positions.push(point.x, point.y, 0);
      rampDepth = point.x * Math.sin(angle) - point.y * Math.cos(angle);
      nextRampDepth = nextPoint.x * Math.sin(angle) - nextPoint.y * Math.cos(angle);
      if (i === 0) {
        minDepth = rampDepth;
        maxDepth = rampDepth;
      } else {
        minDepth = Math.min(rampDepth, minDepth);
        maxDepth = Math.max(rampDepth, maxDepth);
      }
      positions.push(point.x, point.y, rampDepth);
      positions.push(nextPoint.x, nextPoint.y, 0);
      positions.push(point.x, point.y, rampDepth);
      positions.push(nextPoint.x, nextPoint.y, nextRampDepth);
      positions.push(nextPoint.x, nextPoint.y, 0);
    }
    const scale = depth / (maxDepth - minDepth);
    for (let i = 0; i < points.length - 1; i++) {
      positions[18 * i + 5] = (positions[18 * i + 5] - minDepth) * scale;
      positions[18 * i + 11] = (positions[18 * i + 11] - minDepth) * scale;
      positions[18 * i + 14] = (positions[18 * i + 14] - minDepth) * scale;
    }
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    // ToDo - add points correctly so only one face needs to be rendered.
    this.computeVertexNormals();

  }
}
