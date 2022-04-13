/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class BuildingPart {
  // DOM of the building part way
  way;

  // THREE.Shape of the outline.
  shape;

  hasRoof = false;

  // array of Cartesian coordinates of every node.
  nodelist = [];

  height;
  min_height;
  roof_height;

  // skillion roof, angle can be given instead of height.
  roof_angle;

  // the angle at which the roof is facing.
  roof_direction;

  // across or along the main direction.
  roof_orientation = 'along';

  /**
   * @param {XMLElement} way - XML Element for the building part.
   * @param {[[number, number]]} nodelist - Cartesian coordinates of each node keyed by node refID
   * @param {object} options - default values for the building part.
   */
  constructor(way, nodelist, options = {}) {
    this.way = way;
    this.nodelist = nodelist;
    this.setOptions(options);
    this.shape = BuildingShapeUtils.createShape(this.way, this.nodelist);
    // ToDo, ensure all way's <nd ref="id"> tag have a match in the nodelist.
    // If not, the object is not within the parent bounding box.
    // This check is not needed for a building relation type.
  }

  /**
   * Set the object's options
   */
  setOptions(options) {
    // set values from the options, then override them by the local values if one exists.
    this.height = this.calculateHeight();
    this.min_height = this.calculateMinHeight();
    this.roof_height = this.calculateRoofHeight();
  }

  /**
   * calculate the maximum building width in meters.
   */
  getWidth() {
    return BuildingShapeUtils.getWidth(this.shape);
  }

  /**
   * Calculate the radius of a circle that can fit within
   * this way.
   */
  calculateRadius() {
    const elements = this.way.getElementsByTagName('nd');
    var lats = [];
    var lons = [];
    let ref = 0;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute('ref');
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
   */
  centroid() {
    const elements = this.way.getElementsByTagName('nd');
    var lats = [];
    var lons = [];
    var ref;
    var node;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute('ref');
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

  /**
   * Render the building part
   */
  render() {
    this.createBuilding();

    this.createRoof();
  }
  
  createBuilding() {
    let extrusion_height = this.height - this.min_height - this.roof_height;

    // ToDo If we have a multi-polygon, create the outer shape
    // then punch out all the inner shapes.
    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusion_height,
    };
    var geometry = new THREE.ExtrudeGeometry(this.shape, extrudeSettings);

    // Create the mesh.
    var mesh = new THREE.Mesh(geometry, [getRoofMaterial(this.way), getMaterial(this.way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, this.min_height, 0);
    scene.add( mesh );
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
      const elevation = this.calculateHeight() - this.calculateRoofHeight();
      const center = this.centroid();
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (roof_shape === 'skillion') {
      // if (height is missing) {
      //   calculate height from the angle
      // }
    } else if (roof_shape === 'hipped') {
    } else if (roof_shape === 'gabled') {
    } else if (roof_shape === 'pyramidal') {
      const center = this.centroid();
      const options = {
        center: center,
        depth: this.roof_height
      };
      const geometry = new PyramidGeometry(this.shape, options);

      material = getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.height - this.roof_height, 0);
      scene.add( roof );
    }
  }
  
  /**
   * The full height of the part in meters, roof and building.
   */
  calculateHeight() {
    var height = 3;

    if (this.way.querySelector('[k="height"]') !== null) {
      // if the buiilding part has a helght tag, use it.
      height = this.way.querySelector('[k="height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="building:levels"]') !== null) {
      // if not, use building:levels and 3 meters per level.
      height = 3 * this.way.querySelector('[k="building:levels"]').getAttribute('v') + this.calculateRoofHeight();
    } else if (this.way.querySelector('[k="building:part"]') !== null) {
      if (this.way.querySelector('[k="building:part"]').getAttribute('v') === 'roof') {
        // a roof has no building part by default.
        height = 0;
      }
    }
  
    return BuildingPart.normalizeLength(height);
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
    return BuildingPart.normalizeLength(min_height);
  }

  /**
   * the height in meters that the roof extends above the main building
   */
  calculateRoofHeight() {
    var height = 0;
    if (this.way.querySelector('[k="roof:height"]') !== null) {
      // if the buiilding part has a min_helght tag, use it.
      height = this.way.querySelector('[k="roof:height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="roof:levels"]') !== null) {
      // if not, use building:min_level and 3 meters per level.
      height = 3 * this.way.querySelector('[k="roof:levels"]').getAttribute('v');
    }
    return BuildingPart.normalizeLength(height);
  }

  /**
   * convert an string of length units in various format to
   * a float in meters.
   */
  static normalizeLength(length) {
    // if feet and inches {
    //   feet = parseFloat(feet_substr);
    //   inches = parseFloat(inch_substr);
    //   return (feet + inches / 12) * 0.3048;
    // } else if (includes an 'm') {
    //   return parseFloat(substr);
    // }
    return parseFloat(length);
  }
}
