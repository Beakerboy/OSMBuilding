class PyramidGeometry extends THREE.BufferGeometry {
  constructor(shape = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {}) {
    super();

    this.type = 'PyramidGeometry';

    this.parameters = {
      shape: shape,
      options: options
    };
    var positions = [];
    const elements = shape.extractPoints(12).shape;
    for (let i = 0; i < elements.length - 1; i++) {
      node = elements[i];
      next_node = elements[i + 1];
      positions.push(node[0], elevation, -node[1]);
      positions.push(center[0], this.roof_height + elevation, -center[1]);
      positions.push(next_node[0], elevation, -next_node[1]);
    }
 
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    // ToDo - add points correctly so only one face needs to be rendered.
    this.computeVertexNormals();
  }
}
