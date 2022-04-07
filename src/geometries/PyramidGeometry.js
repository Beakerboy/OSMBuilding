
class PyramidGeometry extends THREE.BufferGeometry {
  constructor(shapes = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'ExtrudeGeometry';

    this.parameters = {
      shape: shape,
      options: options
    };

    shapes = Array.isArray( shapes ) ? shapes : [ shapes ];

    const scope = this;

    const verticesArray = [];
    const uvArray = [];

    addShape( shape );

    // build geometry

    this.setAttribute( 'position', new Float32BufferAttribute( verticesArray, 3 ) );
    this.setAttribute( 'uv', new Float32BufferAttribute( uvArray, 2 ) );

    this.computeVertexNormals();

    function addShape( shape ) {
      const placeholder = [];

      // options
      let depth = options.depth !== undefined ? options.depth : 1;
      const uvgen = options.UVGenerator !== undefined ? options.UVGenerator : WorldUVGenerator;

      // Variables initialization
      const shapePoints = shape.extractPoints( curveSegments );
      let vertices = shapePoints.shape;
      const reverse = ! THREE.ShapeUtils.isClockWise( vertices );
      if ( reverse ) {
        vertices = vertices.reverse();
      }
      const faces = THREE.ShapeUtils.triangulateShape(vertices);
      // Add the center point to the list of vertices.
      // create the index list.
    }
  }
}
