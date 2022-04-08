class PyramidGeometry extends THREE.BufferGeometry {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'PyramidGeometry';

    this.parameters = {
      shape: shape,
      options: options
    };
    const depth = options.depth;
    const center = options.center;
    var positions = [];
    var point;
    var next_point;
    var points = shape.extractPoints().shape;
    const reverse = ! THREE.ShapeUtils.isClockWise( points );
      if ( reverse ) {
        points = points.reverse();
      }
    for (let i = 0; i < points.length - 1; i++) {
      point = points[i];
      next_point = points[i + 1];
      positions.push(point.x, 0, -node.y);
      positions.push(center[0], depth, -center[1]);
      positions.push(next_point.x, 0, -next_point.y);
    }
 
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    // ToDo - add points correctly so only one face needs to be rendered.
    this.computeVertexNormals();
  }
}
