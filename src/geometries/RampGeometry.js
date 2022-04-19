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
    const m = new THREE.Matrix3();
    m.set([Math.cos(angle), Math.sin(angle), 0,
      -Math.sin(angle), Math.cos(angle), 0,
      Math.sin(angle), -Math.cos(angle), 0]);

    var points = shape.extractPoints().shape;
    const reverse = ! THREE.ShapeUtils.isClockWise( points );
    if ( reverse ) {
      points = points.reverse();
    }

  }
}
