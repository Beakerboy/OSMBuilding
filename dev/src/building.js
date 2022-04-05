class Building {
  static async create(id) {
    const data = await Building.getData(id);
    return new Building(data);
  }

  constructor(data) {
    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
    if (Building.isValidData(xml_data)) {
        const node_list = xml_data.getElementsByTagName("node");
        // convert the node_list to a associative array
        const way_nodes = xml_data.getElementsByTagName("nd");
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
  
        const helper_size = Math.max(right - left, top - bottom) * 2 * Math.PI * 6371000  / 360 / 0.9;
        const helper = new THREE.GridHelper(helper_size, helper_size / 10);
        scene.add(helper);
  
        // Get all objects in that area.
        let innerData = Building.getInnerData(left, bottom, right, top);
        let inner_xml_data = new window.DOMParser().parseFromString(innerData, "text/xml");

        // Filter to all ways
        const innerWays = inner_xml_data.getElementsByTagName("way");

        var k = 0;
        var nodes_in_way = [];
        var height = 0;
        var min_height = 0;
        var extrusion_height = 0;
        for (let j = 0; j < innerWays.length; j++) {
          if (innerWays[j].querySelector('[k="building:part"]')) {
            height = calculateWayHeight(innerWays[j]);
            min_height = calculateWayMinHeight(innerWays[j]);
            roof_height = calculateRoofHeight(innerWays[j]);
            extrusion_height = height - min_height - roof_height;

            // If we have a multi-polygon, create the outer shape
            // then punch out all the inner shapes.
            var shape = this.createShape(innerWays[j], inner_xml_data);
            k++;
            extrudeSettings = {
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

            createRoof(innerWays[j], inner_xml_data);
          }
        }
  
       // Add the main building if no parts were rendered.
        if (k === 0) {
          var shape = this.createShape(xml_data, inner_xml_data, home_lat, home_lon);
          extrudeSettings = {
            bevelEnabled: false,
            depth: calculateWayHeight(xml_data)
          };
          var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const building_mesh = new THREE.Mesh(geometry, material);
          building_mesh.rotation.x = -Math.PI / 2;
          scene.add(building_mesh);
        }
        // get full way data from OSM
        // get bounding box data from OSM
        // Transform lat-lon to x-y.
        // This.nodeList = all nodes
        // discard nodes not within the main building way.

        // ways = get all ways.
        // foreach ways as way
        //   discard any ways that contain missing nodes
        //   or are not building parts.
    } else {
      console.log("XML Not Valid")
    }
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
   createShape(way, xml_data) {
    const elements = way.getElementsByTagName("nd");
    const shape = new THREE.Shape();
    var lat = 0;
    var lon = 0;
    for (let i = 0; i < elements.length; i++) {
      var ref = elements[i].getAttribute("ref");
      var node = xml_data.querySelector('[id="' + ref + '"]');
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
