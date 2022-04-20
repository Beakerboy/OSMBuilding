/**
 * Modify ExtrudeGeometry such that z varies with x and y
 */
class RampGeometry extends THREE.BufferGeometry {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'RampGeometry';

    this.parameters = {
      shape: shape,
      options: options,
    };
    const depth = options.depth;
    const angle = options.angle;

    // Get the outer shape and holes.
    var points = shape.extractPoints().shape;
    var holes = shape.extractPoints().holes;

    // Ensuse all paths are in the correct direction for the normals
    const reverse = ! THREE.ShapeUtils.isClockWise( points );
    if ( reverse ) {
      points = points.reverse();
      // Check that any holes are correct direction.
      for (let h = 0; h < holes.length; h++) {
        const hole = holes[i];
        if (THREE.ShapeUtils.isClockWise(hole)) {
          holes[h] = hole.reverse();
        }
      }
    }
    
    var rampDepth;
    var nextRampDepth;
    var minDepth;
    var maxDepth;
    var positions = [];
    var point;
    var nextPoint;
    const vertices = [];
    // Add the outer wall.
    for (let i = 0; i < points.length - 1; i++) {
      point = points[i];
      vertices.push(point.x, point.y);
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

    // Add the sides of any holes
    for (let h = 0; h < holes.length; h++) {
      const hole = holes[h];
      for (let i = 0; i < hole.length - 1; i++) {
        point = hole[i];
        vertices.push(point.x, point.y);
        nextPoint = hole[i + 1];
        positions.push(point.x, point.y, 0);
        rampDepth = point.x * Math.sin(angle) - point.y * Math.cos(angle);
        nextRampDepth = nextPoint.x * Math.sin(angle) - nextPoint.y * Math.cos(angle);
        positions.push(point.x, point.y, rampDepth);
        positions.push(nextPoint.x, nextPoint.y, 0);
        positions.push(point.x, point.y, rampDepth);
        positions.push(nextPoint.x, nextPoint.y, nextRampDepth);
        positions.push(nextPoint.x, nextPoint.y, 0);
      }
    }
    // The highest and lowest poijts will be allong the outside
    // Calculate the scaling factor to get he correct height.
    const scale = depth / (maxDepth - minDepth);
    for (let i = 0; i < points.length - 1; i++) {
      positions[18 * i + 5] = (positions[18 * i + 5] - minDepth) * scale;
      positions[18 * i + 11] = (positions[18 * i + 11] - minDepth) * scale;
      positions[18 * i + 14] = (positions[18 * i + 14] - minDepth) * scale;
    }
    // Add top of roof
    const faces = THREE.ShapeUtils.triangulateShape(points, holes);
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      const x = vertices[2 * face[0]];
      const y = vertices[2 * face[1] + 1];
      const z = (x * Math.sin(angle) - y * Math.cos(angle) - minDepth) * scale;
      positions.push(vertices[x, y, z);
    }
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    // ToDo - add points correctly so only one face needs to be rendered.
    this.computeVertexNormals();

  }
}
