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
  options = {
    building: {
      height: null,
    },
    roof: {
      angle: null,
      direction: null,
      height: 0,
      minHeight: null,
      orientation: null,
      shape: null,
    },
  };

  roofMaterial;
  buildingMaterial;

  fullXmlData;

  /**
   * @param {XMLElement} way - XML Element for the building part.
   * @param {[[number, number]]} nodelist - Cartesian coordinates of each node keyed by node refID
   * @param {object} options - default values for the building part.
   */
  constructor(id, fullXmlData, nodelist, defaultOptions = {}) {
    if (Object.keys(defaultOptions).length === 0) {
      defaultOptions = this.options;
    }
    this.fullXmlData = fullXmlData;
    this.id = id;
    this.way = fullXmlData.getElementById(id);
    this.nodelist = nodelist;
    this.setOptions(defaultOptions);
    this.shape = this.buildShape();
  }

  buildShape() {
    this.type = 'way';
    return BuildingShapeUtils.createShape(this.way, this.nodelist);
  }

  /**
   * Set the object's options
   */
  setOptions(defaultOptions) {
    // set values from the options, then override them by the local values if one exists.
    this.options.building.height = this.calculateHeight() ?? defaultOptions.building.height;
    if (this.getAttribute('building:part') && this.options.building.height > defaultOptions.building.height) {
      console.log('Way ' + this.id + ' is taller than building. (' + this.options.building.height + '>' + defaultOptions.building.height + ')');
    }
    this.options.roof.angle = this.getAttribute('roof:angle') ?? defaultOptions.roof.angle;
    this.options.roof.direction = this.getAttribute('roof:direction') ?? defaultOptions.roof.direction;
    // the 3rd second '??' should be unnecessary since the options object has a 0 default.
    this.options.roof.height = this.calculateRoofHeight() ?? defaultOptions.roof.height ?? 0;
    this.options.roof.minHeight = this.calculateMinHeight() ?? defaultOptions.roof.minHeight;
    this.options.roof.orientation = this.getAttribute('roof:orientation') ?? defaultOptions.roof.orientation;
    this.options.roof.shape = this.getAttribute('roof:shape') ?? defaultOptions.roof.shape;
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
    let extrusionHeight = this.options.building.height - this.options.roof.minHeight - this.options.roof.height;

    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusionHeight,
    };

    var geometry = new THREE.ExtrudeGeometry(this.shape, extrudeSettings);

    // Create the mesh.
    var mesh = new THREE.Mesh(geometry, [BuildingPart.getRoofMaterial(this.way), BuildingPart.getMaterial(this.way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, this.options.roof.minHeight, 0);
    scene.add( mesh );
  }

  /**
   * Create the 3D render of a roof.
   */
  createRoof() {
    var way = this.way;
    var material;

    // Flat - Do Nothing
    if (this.options.roof.shape === 'dome') {
    //   find largest circle within the way
    //   R, x, y
      const R = this.calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
      // Adjust the dome height if needed.
      if (this.options.roof.height === 0) {
        this.options.roof.height = R;
      }
      geometry.scale(1, this.options.roof.height / R, 1);
      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = this.options.building.height - this.options.roof.height;
      const center = BuildingShapeUtils.center(this.shape);
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (this.options.roof.shape === 'skillion') {
      const options = {
        angle: (360 - this.options.roof.direction) / 360 * 2 * Math.PI,
        depth: this.options.roof.height,
        pitch: this.options.roof.angle,
      };
      const geometry = new RampGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.options.building.height - this.options.roof.height, 0);
      scene.add( roof );
    } else if (this.options.roof.shape === 'onion') {
      const R = this.calculateRadius();
      const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, 0, 2.53 );
      // Adjust the dome height if needed.
      if (this.options.roof.height === 0) {
        this.options.roof.height = R;
      }
      geometry.scale(1, this.options.roof.height / R, 1);
      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      const elevation = this.options.building.height - this.options.roof.height;
      const center = BuildingShapeUtils.center(this.shape);
      roof.rotation.x = -Math.PI;
      roof.position.set(center[0], elevation, -1 * center[1]);
      scene.add( roof );
    } else if (this.options.roof.shape === 'gabled') {
    } else if (this.options.roof.shape === 'pyramidal') {
      const center = BuildingShapeUtils.center(this.shape);
      const options = {
        center: center,
        depth: this.options.roof.height,
      };
      const geometry = new PyramidGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      const roof = new THREE.Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.options.building.height - this.options.roof.height, 0);
      scene.add( roof );
    }
  }

  getAttribute(key) {
    if (this.way.querySelector('[k="' + key + '"]') !== null) {
      // if the buiilding part has a helght tag, use it.
      return this.way.querySelector('[k="' + key + '"]').getAttribute('v');
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
        height = this.options.roof.height;
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
    var height;
    if (this.way.querySelector('[k="roof:height"]') !== null) {
      // if the buiilding part has a roof:height tag, use it.
      height = this.way.querySelector('[k="roof:height"]').getAttribute('v');
    } else if (this.way.querySelector('[k="roof:levels"]') !== null) {
      // if not, use roof:levels and 3 meters per level.
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
