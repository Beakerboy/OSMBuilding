/**
 * Create a pyramind with an arbitrary base shape
 *
 * This class essentially combines elements from ExtrudeGeometry and CylinderGeometry
 */
class PyramidGeometry extends THREE.BufferGeometry {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'PyramidGeometry';

    this.parameters = {
      shape: shape,
      options: options
    };

    const verticesArray = [];
    const indices = [];
    const normalsArray = [];
    const uvArray = [];

    // options
    const curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;
    let depth = options.depth !== undefined ? options.depth : 1;
    let center = options.center !== undefined ? options.center : [0, 0];

    // Variables initialization
    const shapePoints = shape.extractPoints( curveSegments );

    // vertices is an array of 2D Vectors.
    let vertices = shapePoints.shape;
    let groupStart = 0;
    const reverse = THREE.ShapeUtils.isClockWise(vertices);
    if (reverse) {
      vertices = vertices.reverse();
    }

    for (let i=0; i < vertices.length / 2; i++) {
      verticesArray.push(vertices[i].x, vertices[i].y, 0);
    }

    // An Array of Indices i.e. [[3,2,0], [2,1,0]] 
    const faces = THREE.ShapeUtils.triangulateShape(vertices, []);
    for (let k = 0; k < faces.length; k++) {
      indices.push(...faces[k]);
    }

    // add a group for the base
    this.addGroup(groupStart, verticesArray.length / 3, 0);
    groupStart += verticesArray.length / 3;

    // Add the center point to the list of vertices.
    verticesArray.push(...center, depth);

    // create the index list for the sides
    // basePoints is the index of the center point as well.
    const basePoints = vertices.length;
    for (let j = 0; j < basePoints - 2; j++) {
      indices.push(j, basePoints, j + 1);
    }
    // Add the final triangle to connect the first and last point.
    indices.push(basePoints, basePoints - 1, 0);
    // add a group for the side.
    this.addGroup(groupStart, basePoints, 1);

    // build geometry
    this.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(verticesArray), 3));
    //this.setAttribute( 'normals', new THREE.BufferAttribute(new Float32Array(normalsArray), 3));
    this.setIndex( indices );
    

    this.computeVertexNormals();
  }
}
