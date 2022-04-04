/**
 *
 */
class Building() {
  // The building ID
  id;

  //The parent type
  type;

  // The lat and lon of the (0, 0)
  home;

  // The list of nodes used within the parts.
  // lat and lon have been converted to cartesian
  nodelist;

  // The part that defines the outer bounds of the building
  // multipolygon or way
  outer;

  // An array of building parts
  parts;

  // Default children parameters
  defaults = {};

  /**
   *
   */
  constructor(type, type_id) {
    this.id = type_id;
    this.type = type;
  
    this.getData().then(function (xml_data) {
      if (this.isValidData(xml_data)) {
        if (this.type === "way") {
          this.outer = BuildingPart.create(xml_data);
        //  create bounding box
        //  inner_xml = get elements within the box
        //  pair nodes to all within outer
        //  innerParts = query inner_xml for inner parts (ways, relations and multipolygons)
        //  foreach (innerParts as part) {
        //    parts[] = part;
        //  }
        // } else {
        //   query xml_data for inner parts
        //   foreach (innerpart as part) {
        //     if (part is a relation) {
        //       queryall on its id and add them to
        //     } else {
        //       parts[] = part;
        //     }
        //   }
        }
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
    for (i=0; i < this.parts.length; i++){
      this.parts.render();
    }
    if (this.parts.length === 0) {
      this.outer.render();
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
    if (this.type === "way") {
      restPath = apis.get_way.url(this.id);
    } else {
      restPath = apis.get_relation.url(this.id);
    }
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
    if (this.type === "way" ) {
      
    } else {
      // check that it is either a multipolygon or building relation
    }
    return true;
  }

  /**
   * the width of the building
   */
  width() {
    // if we have a way or multipolygon, this.outer defines the size
    // if we have a building relationship, there can be parts that are outside the outer way.
  }

  /**
   * the depth of this building
   */
  depth() {
    // if we have a way or multipolygon, this.outer defines the size
    // if we have a building relationship, there can be parts that are outside the outer way.
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
