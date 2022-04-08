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
  static async create(type, id) {
    var building;
    if (type === "way") {
      building = await Building.createWayBuilding(id);
    } else {
      building = await Building.createRelationBuilding(id);
    }
    return building;
  }

  constructor(id, innerData) {
    this.id = id;
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
      const part = new BuildingPart(this.outer, this.nodelist)
      part.render();
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
  static async getWayData(id) {
    let restPath = apis.get_way.url(id);
    let response = await fetch(restPath);
    let text = await response.text();
    return text;
  }

  static async getRelationData(id) {
    let restPath = apis.get_relation.url(id);
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
   * Create a building from a way ID
   *
   * This requires determining the bounds of the way, and querying for all other ways and relations
   * within the bounding box. Then testing to ensure each is a building part that is within the
   * area of the provided way.
   */
  static async createWayBuilding(id) {
    const data = await Building.getWayData(id);
    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
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

    const innerData = await Building.getInnerData(left, bottom, right, top);
    return new Building(data, innerData);
  }

  /**
   * Create a building when given a relation ID.
   *
   * This could either define a building relation, which links all the building parts together
   * or a multiploygon. A multipolygon requires the same bounding box procedure as the
   * createWayBuilding() method.
   *
   * A building relation requires iteration to drill down to successive parts.
   */
  static async createRelationBuilding(id) {
    const data = await Building.getRelationData(id);
    console.log(data);
    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
    const relation = xml_data.getElementByID(id);
    const relation_type = relation.querySelector('[k="type"]').getAttribute('v');
    
    if(relation_type = "multipolygon") {
      let parts = xml_data.getElementByTagName("member");
      //<member type="way" ref="8821713" role="outer"/>
      //<member type="way" ref="28315757" role="inner"/>
    } else if (relation_type = "building") {
      //<member type="way" ref="443679945" role="part"/>
      let parts = xml_data.getElementByTagName("member");
      var member_type = "";
      var member_id = 0;
      var member_data;
      for (let i = 0; i < parts.length; i++) {
        member_type = parts[i].getAttribute("type");
        if (member_type === "relationship") {
          console.log("iteration not yet supported");
          member_id = parts[i].getAttribute("ref);
          member_data = await Building.getRelationData(ref);
          // Add member data to xml_data;
        }
      }
      return new Building(id, xml_data);
    }
    
    
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
