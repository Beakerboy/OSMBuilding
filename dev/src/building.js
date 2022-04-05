class Building {
  // Latitude and longitude that transitioned to (0, 0)
  home = [];

  // the parts
  parts = [];

  // the way (xml Element) of the outer building parimeter
  outer;

  // DOM Tree of all elements to render
  inner_xml_data;

  id = 0;
  
  isReady = false;

  // the list of all nodes with lat/lon coordinates.
  nodelist = [];
  static async create(id) {
    const data = await Building.getData(id);
    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
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
    const way_nodes = xml_data.getElementsByTagName("nd");
    this.inner_xml_data = new window.DOMParser().parseFromString(innerData, "text/xml");
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
      const node_list = this.inner_xml_data.getElementsByTagName("node");
      let id = 0;
      for(let j = 0;  j < node_list.length; j++) {
        node = node_list[j];
        id = node.getAttribute("id");
        lat = node.getAttribute("lat");
        lon = node.getAttribute("lon");
        // todo, check if point is within the border.
        this.nodelist[id] = this.repositionPoint([lat, lon]);
      }
      this.addParts();

      const helper_size = Math.max(right - left, top - bottom) * 2 * Math.PI * 6371000  / 360 / 0.9;
      const helper = new THREE.GridHelper(helper_size, helper_size / 10);
      scene.add(helper);

    } else {
      console.log("XML Not Valid")
    }
  }

  render() {
    if (this.parts.length > 0) {
       for (let i = 0; i < this.parts.length; i++) {
         this.parts[i].render();
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

  addParts() {
    // Filter to all ways
    const innerWays = this.inner_xml_data.getElementsByTagName("way");
    for (let j = 0; j < innerWays.length; j++) {
      if (innerWays[j].querySelector('[k="building:part"]')) {
        this.parts.push(new BuildingPart(innerWays[j], this.nodelist));
      }
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
