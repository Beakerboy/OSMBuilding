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
  minHeight;
  roofHeight;

  roofMaterial;
  buildingMaterial;

  // skillion roof, angle can be given instead of height.
  roofAngle;

  // the angle at which the roof is facing.
  roofDirection;

  // across or along the main direction.
  roofOrientation = 'along';

  roofShape;

  fullXmlData;

  /**
   * @param {XMLElement} way - XML Element for the building part.
   * @param {[[number, number]]} nodelist - Cartesian coordinates of each node keyed by node refID
   * @param {object} options - default values for the building part.
   */
  constructor(id, fullXmlData, nodelist, options = {}) {
    this.fullXmlData = fullXmlData;
    this.id = id;
    this.way = fullXmlData.getElementById(id);
    this.nodelist = nodelist;
    this.setOptions(options);
    this.shape = this.buildShape();
    if (this.way.querySelector('[k="roof:direction"]') !== null) {
      // if the buiilding part has a helght tag, use it.
      this.roofDirection = this.way.querySelector('[k="roof:direction"]').getAttribute('v');
    }
  }

  buildShape() {
    this.type = 'way';
    return BuildingShapeUtils.createShape(this.way, this.nodelist);
  }

  /**
   * Set the object's options
   */
  setOptions(options) {
    // set values from the options, then override them by the local values if one exists.
    this.height = this.calculateHeight();
    this.minHeight = this.calculateMinHeight();
    this.roofHeight = this.calculateRoofHeight();
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
      lats.push(node[1]);
      lons.push(node[0]);
    }
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);

    // Set the "home point", the lat lon to center the structure.
    return Math.min(right - left, top - bottom) / 2;
  }

  /**
   * Render the building part
   */
  render() {
    this.createBuilding();

    this.createRoof();
  }

  createBuilding() {
    let extrusionHeight = this.height - this.minHeight - this.roofHeight;

    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusionHeight,
    };

    var geometry = new THREE.ExtrudeGeometry(this.shape, extrudeSettings);

    // Create the mesh.
    var mesh = new THREE.Mesh(geometry, [BuildingPart.getRoofMaterial(this.way), BuildingPart.getMaterial(this.way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, this.minHeight, 0);
    scene.add( mesh );
  }

  /**
   * Create the 3D render of a roof.
   */
  createRoof() {
    var roofShape = 'flat';
    var roofHeight = 0;
    var way = this.way;
    var material;
    if (this.way.querySelector('[k="roof:shape"]') !== null) {
      // if the buiilding part has a min_height tag, use it.
      roofShape = way.querySelector('[k="roof:shape"]').getAttribute('v');
    }
    if (this.way.querySelector('[k="roof:height"]') !== null) {
      // if the building part has a min_height tag, use it.
      roofHeight = parseFloat(way.querySelector('[k="roof:height"]').getAttribute('v'));
    }
    // Flat - Do Nothing
    if (roofShape === 'dome') {
    //   find largest circle within the way
    //   R, x, y
      const R = this.calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
      // Adjust the dome height if needed.
      if (roofHeight === 0) {
        roofHeight = R;
      }
      geometry.scale(1, roofHeight / R, 1);
      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = this.calculateHeight() - this.calculateRoofHeight();
      const center = BuildingShapeUtils.center(this.shape);
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (roofShape === 'skillion') {
      // if (height is missing) {
      //   calculate height from the angle
      // }
      const options = {
        angle: this.roofDirection / 360 * 2 * Math.PI,
        depth: this.roofHeight,
      };
      const geometry = new RampGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.height - this.roofHeight, 0);
      scene.add( roof );
    } else if (roofShape === 'onion') {
      const R = this.calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, 0, 2.53 );
      // Adjust the dome height if needed.
      if (roofHeight === 0) {
        roofHeight = R;
      }
      geometry.scale(1, roofHeight / R, 1);
      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = this.calculateHeight() - this.calculateRoofHeight();
      const center = BuildingShapeUtils.center(this.shape);
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (roofShape === 'gabled') {
    } else if (roofShape === 'pyramidal') {
      const center = BuildingShapeUtils.center(this.shape);
      const options = {
        center: center,
        depth: this.roofHeight,
      };
      const geometry = new PyramidGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.height - this.roofHeight, 0);
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
    var minHeight = 0;
    if (this.way.querySelector('[k="min_height"]') !== null) {
      // if the buiilding part has a min_helght tag, use it.
      minHeight = this.way.querySelector('[k="min_height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="building:min_level"]') !== null) {
      // if not, use building:min_level and 3 meters per level.
      minHeight = 3 * this.way.querySelector('[k="building:min_level"]').getAttribute('v');
    }
    return BuildingPart.normalizeLength(minHeight);
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

  /**
   * Get the THREE.material for a given way
   *
   * This is complicated by inheritance
   */
  static getMaterial(way) {
    var materialName = '';
    var color = '';
    if (way.querySelector('[k="building:facade:material"]') !== null) {
      // if the buiilding part has a designated material tag, use it.
      materialName = way.querySelector('[k="building:facade:material"]').getAttribute('v');
    } else if (way.querySelector('[k="building:material"]') !== null) {
      // if the buiilding part has a designated material tag, use it.
      materialName = way.querySelector('[k="building:material"]').getAttribute('v');
    }
    if (way.querySelector('[k="colour"]') !== null) {
      // if the buiilding part has a designated colour tag, use it.
      color = way.querySelector('[k="colour"]').getAttribute('v');
    } else if (way.querySelector('[k="building:colour"]') !== null) {
      // if the buiilding part has a designated colour tag, use it.
      color = way.querySelector('[k="building:colour"]').getAttribute('v');
    } else if (way.querySelector('[k="building:facade:colour"]') !== null) {
      // if the buiilding part has a designated colour tag, use it.
      color = way.querySelector('[k="building:facade:colour"]').getAttribute('v');
    }
    const material = BuildingPart.getBaseMaterial(materialName);
    if (color !== '') {
      material.color = new THREE.Color(color);
    } else if (materialName === ''){
      material.color = new THREE.Color('white');
    }
    return material;
  }

  /**
   * Get the THREE.material for a given way
   *
   * This is complicated by inheritance
   */
  static getRoofMaterial(way) {
    var materialName = '';
    var color = '';
    if (way.querySelector('[k="roof:material"]') !== null) {
      // if the buiilding part has a designated material tag, use it.
      materialName = way.querySelector('[k="roof:material"]').getAttribute('v');
    }
    if (way.querySelector('[k="roof:colour"]') !== null) {
      // if the buiilding part has a designated mroof:colour tag, use it.
      color = way.querySelector('[k="roof:colour"]').getAttribute('v');
    }
    var material;
    if (materialName === '') {
      material = BuildingPart.getMaterial(way);
    } else {
      material = BuildingPart.getBaseMaterial(materialName);
    }
    if (color !== '') {
      material.color = new THREE.Color(color);
    }
    return material;
  }

  static getBaseMaterial(materialName) {
    var material;
    if (materialName === 'glass') {
      material = new THREE.MeshPhysicalMaterial( {
        color: 0x00374a,
        emissive: 0x011d57,
        reflectivity: 0.1409,
        clearcoat: 1,
      } );
    } else if (materialName === 'grass'){
      material = new THREE.MeshLambertMaterial({
        color: 0x7ec850,
        emissive: 0x000000,
      });
    } else if (materialName === 'bronze') {
      material = new THREE.MeshPhysicalMaterial({
        color:0xcd7f32,
        emissive: 0x000000,
        metalness: 1,
        roughness: 0.127,
      });
    } else if (materialName === 'copper') {
      material = new THREE.MeshLambertMaterial({
        color: 0xa1c7b6,
        emissive: 0x00000,
        reflectivity: 0,
      });
    } else if (materialName === 'stainless_steel' || materialName === 'metal') {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa,
        emissive: 0xaaaaaa,
        metalness: 1,
        roughness: 0.127,
      });
    } else if (materialName === 'brick'){
      material = new THREE.MeshLambertMaterial({
        color: 0xcb4154,
        emissive: 0x1111111,
      });
    } else if (materialName === 'concrete'){
      material = new THREE.MeshLambertMaterial({
        color: 0x555555,
        emissive: 0x1111111,
      });
    } else if (materialName === 'marble') {
      material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        emissive: 0x1111111,
      });
    } else {
      material = new THREE.MeshLambertMaterial({
        emissive: 0x1111111,
      });
    }
    return material;
  }

  getInfo() {
    return {
      id: this.id,
      type: this.type,
      options: this.options,
      parts: [
      ],
    };
  }
}
