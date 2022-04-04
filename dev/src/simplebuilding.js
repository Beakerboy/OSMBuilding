/**
 *
 */
class SimpleBuilding {
  // The building ID
  id;

  // The lat and lon of the (0, 0)
  home;

  // The list of nodes used within the parts.
  // lat and lon have been converted to cartesian
  nodelist;

  // The part that defines the outer bounds of the building
  outer;

  // An array of building parts
  parts;

  /**
   *
   */
  constructor(way_id) {
    this.id = way_id;
    this.getData().then(function (xml_data) {
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
        for (i = 0; i < elements.length; i++) {
          ref = elements[i].getAttribute("ref");
          node = xml_data.querySelector('[id="' + ref + '"]');
          lat = node.getAttribute("lat");
          lon = node.getAttribute("lon");
          lats.push(lat);
          lons.push(lon);
        }
        this.setHome();
  
        this.addGrid();
  
        // Get all objects in that area.
        this.getInnerData().then(function(inner_xml_data) {
          this.inner_xml_data = inner_xml_data;
          // Create a list of all nodes
          //this.nodelist = createNodelist(inner_xml_data);

          // Filter to all ways
          const innerWays = inner_xml_data.getElementsByTagName("way");

          var k = 0;
          for (j = 0; j < innerWays.length; j++) {
            if (innerWays[j].querySelector('[k="building:part"]')) {
              createAndRenderPart(innerWays[j]);
              k++;
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
        });
      } else {
        console.log("XML Not Valid")
      }
    });
  }

  /**
   * We should really make an array of building types and have a render function
   */
  createAndRenderPart(way) {
    height = calculateWayHeight(way);
    min_height = calculateWayMinHeight(way);
    roof_height = calculateRoofHeight(way);
    extrusion_height = height - min_height - roof_height;
    var shape = createShape(way, this.inner_xml_data, home[0], home[1]);
    extrudeSettings = {
      bevelEnabled: false,
      depth: extrusion_height
    };
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Create the mesh.
    // Todo: Use an array of materials to render the roof the appropriate color.
    var mesh = new THREE.Mesh(geometry, [getRoofMaterial(way), getMaterial(way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, min_height, 0);
    scene.add( mesh );

    createRoof(way, this.inner_xml_data);
  }

  /**
   * Render this building.
   */
  render() {
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
   * Determine the lat and lon of the "home" position
   */
  setHome() {
    // Get max and min lat and log from the building
    this.left = Math.min(...lons);
    this.bottom = Math.min(...lats);
    this.right = Math.max(...lons);
    this.top = Math.max(...lats);

    // Set the "home point", the lat lon to center the structure.
    const home_lon = (this.left + this.right) / 2;
    const home_lat = (this.top + this.bottom) / 2;
    this.home = [home_lat, home_lon];
  }

  /**
   * Add the gridHelper to the scene
   */
  addGrid() {
    // Move this to index.js?
    helper_size = Math.max(this.right - this.left, this.top - this.bottom) * 2 * Math.PI * 6371000  / 360 / 0.9;
    const helper = new THREE.GridHelper(helper_size, helper_size / 10);
    scene.add(helper);
  }
  
  /**
   * Fetch way data from OSM
   */
  async getData() {
    let restPath = apis.get_way.url(this.id);
    console.log(restPath);
    let response = fetch(restPath).then(function (response) {
      console.log(response);
      let res = response.text().then(function(text) {
        console.log(text);
        return new window.DOMParser().parseFromString(text, "text/xml");
      });
    });
  }

  /**
   * Fetch way data from OSM
   */
  async getInnerData() {
    let response = fetch(apis.bounding.url(this.left, this.bottom, this.right, this.top)).then(function(response) {
      let res = response.text().then(function(text) {
        return new window.DOMParser().parseFromString(text, "text/xml");
      });
    });
  }

  /**
   * validate that we have the ID of a building way.
   */
  isValidData(xml_data) {
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
   * the width of this part
   */
  width() {
  
  }

  /**
   * the depth of this part
   */
  depth() {
  
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
