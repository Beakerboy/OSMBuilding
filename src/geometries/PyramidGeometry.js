
class PyramidGeometry extends THREE.BufferGeometry {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'ExtrudeGeometry';

    this.parameters = {
      shape: shape,
      options: options
    };

    const scope = this;

    const verticesArray = [];
    const indices = [];
    const uvArray = [];

    addShape( shape );

    // build geometry

    this.setIndex( indices );
    this.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(verticesArray), 3));

    this.computeVertexNormals();

    function addShape( shape ) {
      const verticesArray = [];

      // options
      const curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;
      let depth = options.depth !== undefined ? options.depth : 1;
      let center = options.center !== undefined ? options.center : [0, 0];

      // Variables initialization
      const shapePoints = shape.extractPoints( curveSegments );
      let vertices = shapePoints.shape;
      let groupStart = 0;
      const reverse = ! THREE.ShapeUtils.isClockWise( vertices );
      if ( reverse ) {
        vertices = vertices.reverse();
      }
     

      // An Array of Indices [[a,b,d], [b,c,d]] 
      const faces = THREE.ShapeUtils.triangulateShape(vertices, []);

      for (let i=0; i < vertices.length / 2; i++) {
          verticesArray.push(vertices[i * 2], vertices[i * 2 + 1], 0);
      }
      for (let k = 0; k < faces.length; k++) {
        indices.push(...faces[k]);
      }
     
      // add a group for the base
      scope.addGroup(groupStart, verticesArray.length / 3, 0);
      groupStart += verticesArray.length / 3;

      // Add the center point to the list of vertices.
      vertices.push(...center, depth);

      // create the index list for the side
      // basePoints is the index of the center point as well.
      const basePoints = vertices.length / 2;
      for (let j = 0; j < basePoints - 1; j++) {
        indices.push(j, basePoints, j + 1);
      }
      indices.push(basePoints - 1, basePoints, 0);
      // add a group for the side.
      scope.addGroup(groupStart, basePoints, 1);
    }
  }
}
