
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
      const curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;
      let depth = options.depth !== undefined ? options.depth : 1;
      let center = options.center !== undefined ? options.center : [0, 0];

      // Variables initialization
      const shapePoints = shape.extractPoints( curveSegments );
      let vertices = shapePoints.shape;
      const reverse = ! THREE.ShapeUtils.isClockWise( vertices );
      if ( reverse ) {
        vertices = vertices.reverse();
      }
     

      // An Array of Indices [[a,b,d], [b,c,d]] 
      const faces = THREE.ShapeUtils.triangulateShape(vertices);

      // Add the center point to the list of vertices.
      vertices.push(center);
      // create the index list.
    }
  }
}
