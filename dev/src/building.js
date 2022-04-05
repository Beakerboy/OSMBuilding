class Building {
  // Latitude and longitude that transitioned to (0, 0)
  home = [];

  // the parts
  parts = [];

  // the way (xml Element) of the outer building parimeter
  outer;

  id = 0;

  // the list of all nodes with lat/lon coordinates.
  nodelist;
  static async create(id) {
    const data = await Building.getData(id);
    const way_nodes = xml_data.getElementsByTagName("nd");
    this.outer = xml_data;
    // if it is a building, query all ways within the bounding box and reder the building parts.
    // The way is a list of <nd ref=""> tags.
    // Use the ref to look up the lat/log data from the unordered <node id="" lat="" lon=""> tags.
    var lats = [];
    var lons = [];
    var lat = 0;
    var lon = 0;
    var node;
    var ref;
    for (let i = 0; i < way_nodes.length; i++) {
      ref = way_nodes[i].getAttribute("ref");
      node = xml_data.querySelector('[id="' + ref + '"]');
      lat = node.getAttribute("lat");
      lon = node.getAttribute("lon");
      lats.push(lat);
      lons.push(lon);
    }
    // Get all building parts within the building
    // Get max and min lat and log from the building
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);

    const innerData = await Building.getInnerData(left, bottom, right, top);
    return new Building(data, innerData);
  }

  constructor(data, innerData) {
    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
    this.innerData = innerData;
    if (Building.isValidData(xml_data)) {
       this.outer = xml_data;
    // if it is a building, query all ways within the bounding box and reder the building parts.
    // The way is a list of <nd ref=""> tags.
    // Use the ref to look up the lat/log data from the unordered <node id="" lat="" lon=""> tags.
    var lats = [];
    var lons = [];
    var lat = 0;
    var lon = 0;
    var node;
    var ref;
    for (let i = 0; i < way_nodes.length; i++) {
      ref = way_nodes[i].getAttribute("ref");
      node = xml_data.querySelector('[id="' + ref + '"]');
      lat = node.getAttribute("lat");
      lon = node.getAttribute("lon");
      lats.push(lat);
      lons.push(lon);
    }
    // Get all building parts within the building
    // Get max and min lat and log from the building
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);
      // Set the "home point", the lat lon to center the structure.
      const home_lon = (left + right) / 2;
      const home_lat = (top + bottom) / 2;
      this.home = [home_lat, home_lon];
      

      this.addParts(left, bottom, right, top);
      
      const helper_size = Math.max(right - left, top - bottom) * 2 * Math.PI * 6371000  / 360 / 0.9;
      const helper = new THREE.GridHelper(helper_size, helper_size / 10);
      scene.add(helper);
      
      this.render();
    } else {
      console.log("XML Not Valid")
    }
  }

  render() {
    if (this.parts.length > 0) {
       for (let i = 0; i < this.parts.length; i++) {
         this.renderPart(this.parts[i]);
       }
    } else {
      var shape = this.createShape(this.outer);
      extrudeSettings = {
        bevelEnabled: false,
        depth: calculateWayHeight(this.outer)
      };
      var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const building_mesh = new THREE.Mesh(geometry, material);
      building_mesh.rotation.x = -Math.PI / 2;
      scene.add(building_mesh);
    }
  }

  addParts(left, bottom, right, top) {
    let inner_xml_data = new window.DOMParser().parseFromString(this.innerData, "text/xml");
    this.nodelist = inner_xml_data;

    // Filter to all ways
    const innerWays = inner_xml_data.getElementsByTagName("way");

    var k = 0;
    var nodes_in_way = [];
    var height = 0;
    var min_height = 0;
    var extrusion_height = 0;
    for (let j = 0; j < innerWays.length; j++) {
      if (innerWays[j].querySelector('[k="building:part"]')) {
        this.parts.push(innerWays[j]);
      }
    }
  }

  renderPart(way) {
    let height = calculateWayHeight(way);
    let min_height = calculateWayMinHeight(way);
    let roof_height = calculateRoofHeight(way);
    let extrusion_height = height - min_height - roof_height;

    // If we have a multi-polygon, create the outer shape
    // then punch out all the inner shapes.
    var shape = this.createShape(way);
    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusion_height
    };
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Create the mesh.
    // Todo: Use an array of materials to render the roof the appropriate color.
    var mesh = new THREE.Mesh(geometry, [getRoofMaterial(innerWays[j]), getMaterial(innerWays[j])]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, min_height, 0);
    scene.add( mesh );

    this.createRoof(way, this.nodelist);
  }

  /**
   * Is this point inside this building?
   *
   * This may be better in a 2DShape class to manage
   * 2D geometry math functions.
   */
  surrounds(x, y) {

  }

  /**
   * Fetch way data from OSM
   */
  static async getData(id) {
    let restPath = apis.get_way.url(id);
    let response = await fetch(restPath);
    let text = await response.text();
    return text;
  }

  /**
   * Fetch way data from OSM
   */
  static async getInnerData(left, bottom, right, top) {
    let response = await fetch(apis.bounding.url(left, bottom, right, top));
    let res = await response.text();
    return res;
  }

  /**
   * validate that we have the ID of a building way.
   */
  static isValidData(xml_data) {
    // ToDO: Check that it is a building (<tag k="building" v="*"/> exists)
    // Or that it is a building part.
    console.log(xml_data);
    const elements = xml_data.getElementsByTagName("nd");
    // Check that it is a closed way
    let first = elements[0];
    let last = elements[elements.length - 1];
    var first_ref = first.getAttribute("ref");
    var last_ref = last.getAttribute("ref");
    if(first_ref !== last_ref) {
      return false;
    }
    return true;
  }

  /**
   * Create the shape of a given way.
   *
   * way DOM tree of the way to render
   * xml_data the DOM tree of all the data in the region
   */
   createShape(way) {
    const elements = way.getElementsByTagName("nd");
    const shape = new THREE.Shape();
    var lat = 0;
    var lon = 0;
    for (let i = 0; i < elements.length; i++) {
      var ref = elements[i].getAttribute("ref");
      var node = this.nodelist.querySelector('[id="' + ref + '"]');
      lat = parseFloat(node.getAttribute("lat"));
      lon = parseFloat(node.getAttribute("lon"));
      var points = this.repositionPoint([lat, lon]);
      if (i === 0) {
        shape.moveTo(points[0], points[1]);
      } else {
        shape.lineTo(points[0], points[1]);
      }
    }
    return shape;
    }

  /**
   * Create the 3D render of a roof.
   */
  createRoof(way, xml_data, home_lat, home_lon) {
  var roof_shape = "flat";
  var roof_height = 0;
  if (way.querySelector('[k="roof:shape"]') !== null) {
    // if the buiilding part has a min_height tag, use it.
    roof_shape = way.querySelector('[k="roof:shape"]').getAttribute('v');
  }
  if (way.querySelector('[k="roof:height"]') !== null) {
    // if the building part has a min_height tag, use it.
    roof_height = parseFloat(way.querySelector('[k="roof:height"]').getAttribute('v'));
  }
  // Flat - Do Nothing
  if (roof_shape === "dome") {
  //   find largest circle within the way
  //   R, x, y
    const R = calculateWayRadius(way, xml_data);
    const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
    // Adjust the dome height if needed.
    if (roof_height === 0) {
      roof_height = R;
    }
    geometry.scale(1, roof_height / R, 1);
    material = getRoofMaterial(way);
    const roof = new THREE.Mesh( geometry, material );
    const elevation = calculateWayHeight(way) - calculateRoofHeight(way);
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
      const center = centroid(way, xml_data);
      // create sloped pieces up to the center from each edge.
    }
  }
  
  /**
   * Rotate lat/lon to reposition the home point onto 0,0.
   */
  repositionPoint(lat_lon) {
    const R = 6371 * 1000;   // Earth radius in m
    const circ = 2 * Math.PI * R;  // Circumference
    const phi = 90 - lat_lon[0];
    const theta = lat_lon[1] - this.home[1];
    const theta_prime = this.home[0] / 180 * Math.PI;
    const x = R * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);
    const y = R * Math.cos(phi / 180 * Math.PI);
    const z = R * Math.sin(phi / 180 * Math.PI) * Math.cos(theta / 180 * Math.PI);
    const abs = Math.sqrt(z**2 + y**2);
    const arg = Math.atan(y / z) - theta_prime;
  
    return [x, Math.sin(arg) * abs];
  }

  /**
   * Discard any nodes that are not within the building
   */
  discardOutsideNodes() {
    // foreach this.nodeList as node
    //   if (!this.surrounds(node)) {
    //     unset (this.nodelist[i]);
    //   }
  }
}
