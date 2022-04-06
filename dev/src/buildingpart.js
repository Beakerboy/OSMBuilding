class BuildingPart {

  hasRoof = false;
  nodelist = [];

  constructor(way, nodelist) {
    this.way = way;
    this.nodelist = nodelist;
    this.height = calculateWayHeight(way);
    this.min_height = calculateWayMinHeight(way);
    this.roof_height = calculateRoofHeight(way);
  }

  calculateRadius() {
    const elements = this.way.getElementsByTagName("nd");
    var lats = [];
    var lons = [];
    var lat = 0;
    var lon = 0;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
      node = this.nodelist[ref];
      lat = node.getAttribute("lat");
      lon = node.getAttribute("lon");
      lats.push(point[0]);
      lons.push(point[1]);
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
  centroid(xml_data) {
    const elements = way.getElementsByTagName("nd");
    var lats = [];
    var lons = [];
    var lat = 0;
    var lon = 0;
    var ref;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
      node = xml_data.querySelector('[id="' + ref + '"]');
      lat = parseFloat(node.getAttribute("lat"));
      lon = parseFloat(node.getAttribute("lon"));
      lats.push(point[0]);
      lons.push(point[1]);
    }
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);
    const center = [(top + bottom) / 2, (left + right) / 2];
    return repositionPoint(center);
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
      console.log(ref);
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
      const R = calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
      // Adjust the dome height if needed.
      if (roof_height === 0) {
        roof_height = R;
      }
      geometry.scale(1, roof_height / R, 1);
      material = getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = calculateWayHeight(this.way) - calculateRoofHeight(way);
      const center = centroid(way, xml_data);
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (roof_shape === "skillion") {
    } else if (roof_shape === "hipped") {
       // use straight skeleton algorithm.
    } else if (roof_shape === "gabled") {
      //const elements = way.getElementsByTagName("nd");
      //if (elements.length > 4) {
        // iterate through the way points and remove any 180degree.
      //}
      //if (elements.length === 4) {
      // find the longest edge
      // bisect the angle of longest and opposite
      //let geometry = new THREE.BufferGeometry()
      //const points = [
        // Face 1&2 if wall != no
        //new THREE.Vector3(-1, 1, -1),//c
        //new THREE.Vector3(-1, -1, 1),//b
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(1, 1, 1),//a 
        //new THREE.Vector3(1, -1, -1),//e 
        //new THREE.Vector3(-1, 1, -1),//d
        //roof
        //new THREE.Vector3(-1, -1, 1),//a
        //new THREE.Vector3(1, -1, -1),//b 
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(-1, 1, -1),//a
        //new THREE.Vector3(1, -1, -1),//e
        //new THREE.Vector3(-1, -1, 1),//f
        
        //new THREE.Vector3(-1, -1, 1),//d
        //new THREE.Vector3(1, -1, -1),//e
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(-1, 1, -1),//d
        //new THREE.Vector3(1, -1, -1),//c
        //new THREE.Vector3(-1, -1, 1),//f
      //];
      //geometry.setFromPoints(points);
      //geometry.computeVertexNormals();
    //}
      } else if (roof_shape === "pyramidal") {
        //const center = centroid(way, xml_data);
        // create sloped pieces up to the center from each edge.
      }
    }
  }
