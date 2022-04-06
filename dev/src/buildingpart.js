class BuildingPart {

  hasRoof = false;
  nodelist = [];

  constructor(way, nodelist) {
    this.way = way;
    this.nodelist = nodelist;
    this.height = this.calculateHeight();
    this.min_height = this.calculateMinHeight();
    this.roof_height = this.calculateRoofHeight();
  }

  calculateRadius() {
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
   * Need to compensate for edge cases
   *  - ways that cross the date line
   * xml_data the DOM tree of all the data in the region
   */
  centroid() {
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

  render() {
    let extrusion_height = this.height - this.min_height - this.roof_height;

    // If we have a multi-polygon, create the outer shape
    // then punch out all the inner shapes.
    var shape = this.createShape();
    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusion_height
    };
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Create the mesh.
    var mesh = new THREE.Mesh(geometry, [getRoofMaterial(this.way), getMaterial(this.way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, this.min_height, 0);
    scene.add( mesh );

    this.createRoof();
  }
  
  /**
   * Create the shape of a given way.
   *
   * way DOM tree of the way to render
   * xml_data the DOM tree of all the data in the region
   */
  createShape() {
    const elements = this.way.getElementsByTagName("nd");
    const shape = new THREE.Shape();
    var ref;
    var node = [];
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
      node = this.nodelist[ref];
      if (i === 0) {
        shape.moveTo(node[0], node[1]);
      } else {
        shape.lineTo(node[0], node[1]);
      }
    }
    return shape;
  }

  /**
   * Create the 3D render of a roof.
   */
  createRoof() {
    var roof_shape = "flat";
    var roof_height = 0;
    var way = this.way;
    var material;
    if (this.way.querySelector('[k="roof:shape"]') !== null) {
      // if the buiilding part has a min_height tag, use it.
      roof_shape = way.querySelector('[k="roof:shape"]').getAttribute('v');
    }
    if (this.way.querySelector('[k="roof:height"]') !== null) {
      // if the building part has a min_height tag, use it.
      roof_height = parseFloat(way.querySelector('[k="roof:height"]').getAttribute('v'));
    }
    // Flat - Do Nothing
    if (roof_shape === "dome") {
    //   find largest circle within the way
    //   R, x, y
      const R = this.calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
      // Adjust the dome height if needed.
      if (roof_height === 0) {
        roof_height = R;
      }
      geometry.scale(1, roof_height / R, 1);
      material = getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = this.calculateWayHeight() - this.calculateRoofHeight();
      const center = this.centroid();
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (roof_shape === "skillion") {
    } else if (roof_shape === "hipped") {
    } else if (roof_shape === "gabled") {
    } else if (roof_shape === "pyramidal") {
      const center = this.centroid();
      const elements = this.way.getElementsByTagName("nd");
      const elevation = this.calculateWayHeight() - this.calculateRoofHeight();
      var vertices = [];
      var node;
      var next_node;
      for (let i = 0; i < elements.length - 1; i++) {
        node = this.nodelist[elements[i].getAttribute("ref")];
        next_node =  this.nodelist[elements[i + 1].getAttribute("ref")];
        vertices += {pos: [node[0], elevation, node[1]]};
        vertices += {pos: [center[0], roof_height, center[1]]};
        vertices += {pos: [next_node[0], elevation, next_node[1]]};
      }
      const positions = [];
      for (const vertex of vertices) {
        positions.push(...vertex.pos);
      }
      const geometry = new THREE.BufferGeometry();
      const positionNumComponents = 3;
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
      material = getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      scene.add( roof );
    }
  }
  
  /**
   * Given a way in XML format, determine its height
   * Default to 3 meters unless building:levels or height are specified.
   */
  calculateHeight() {
    var height = 3;

    if (this.way.querySelector('[k="height"]') !== null) {
      // if the buiilding part has a helght tag, use it.
      height = this.way.querySelector('[k="height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="building:levels"]') !== null) {
      // if not, use building:levels and 3 meters per level.
      height = 3 * this.way.querySelector('[k="building:levels"]').getAttribute('v');
    } else if (this.way.querySelector('[k="building:part"]') !== null) {
      if (this.way.querySelector('[k="building:part"]').getAttribute('v') === "roof") {
        // a roof has no height by default.
        height = 0;
      }
    }
  
    return height;
  }

  calculateMinHeight() {
    var min_height = 0;
    if (this.way.querySelector('[k="min_height"]') !== null) {
      // if the buiilding part has a min_helght tag, use it.
      min_height = this.way.querySelector('[k="min_height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="building:min_level"]') !== null) {
      // if not, use building:min_level and 3 meters per level.
      min_height = 3 * this.way.querySelector('[k="building:min_level"]').getAttribute('v');
    }
    return min_height;
  }

  calculateRoofHeight() {
    var height = 0;
    if (this.way.querySelector('[k="roof:height"]') !== null) {
      // if the buiilding part has a min_helght tag, use it.
      height = this.way.querySelector('[k="roof:height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="roof:levels"]') !== null) {
      // if not, use building:min_level and 3 meters per level.
      min_height = 3 * this.way.querySelector('[k="roof:levels"]').getAttribute('v');
    }
    return height;
  }
}
