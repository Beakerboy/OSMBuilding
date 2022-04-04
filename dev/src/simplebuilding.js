class SimpleBuilding {

  constructor(way_id) {
    this.id = way_id;
    let data = this.getData();

    let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
    if (this.isValidData(xml_data)) {
      const nodes = xml_data.getElementsByTagName("node");

      var building = new THREE.Shape();
      var ref = elements[0].getAttribute("ref");
      var node = xml_data.querySelector('[id="' + ref + '"]');

      // if it is a building, query all ways within the bounding box and reder the building parts.
      // The way is a list of <nd ref=""> tags.
      // Use the ref to look up the lat/log data from the unordered <node id="" lat="" lon=""> tags.
      var lats = [];
      var lons = [];
      var lat = 0;
      var lon = 0;
      for (let i = 0; i < elements.length; i++) {
        ref = elements[i].getAttribute("ref");
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
      home = [home_lat, home_lon];
  
      helper_size = Math.max(right - left, top - bottom) * 2 * Math.PI * 6371000  / 360 / .9;
      const helper = new THREE.GridHelper(helper_size, helper_size / 10);
      scene.add(helper);
  
      // Get all objects in that area.
      let innerData = getInnerData(left, bottom, right, top);
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
          var shape = createShape(innerWays[j], inner_xml_data, home_lat, home_lon);
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
        var shape = createShape(xml_data, inner_xml_data, home_lat, home_lon);
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
  getData() {
    let response = await fetch(apis.get_way.url(this.id));
    let res = await response.text();
    return res;
  }

  /**
   * validate that we have the ID of a building way.
  isValidData(xml_data) {
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
   * Discard any nodes that are not within the building
   */
  discardOutsideNodes() {
    // foreach this.nodeList as node
    //   if (!this.surrounds(node)) {
    //     unset (this.nodelist[i]);
    //   }
  }
  
}
