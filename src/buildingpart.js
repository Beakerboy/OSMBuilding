import {
  Color,
  ExtrudeGeometry,
  Shape,
  Mesh,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
} from 'three';

import {PyramidGeometry} from 'pyramid';
import {RampGeometry} from 'ramp';
import {WedgeGeometry} from 'wedge';
import {HippedGeometry} from 'hipped';
import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
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

  // THREE.Mesh of the roof
  roof;

  // array of Cartesian coordinates of every node.
  nodelist = [];

  // Metadata of the building part.
  blankOptions = {
    building: {
      colour: null,
      ele: null,
      height: null,
      levels: null,
      levelsUnderground: null,
      material: null,
      minHeight: null,
      minLevel: null,
      walls: null,
    },
    roof: {
      angle: null,
      colour: null,
      direction: null,
      height: null,
      levels: null,
      material: null,
      orientation: null,
      shape: null,
    },
  };

  fullXmlData;

  // The unique OSM ID of the object.
  id;

  // THREE.Mesh
  parts = [];
  /**
   * @param {number} id - the OSM id of the way or multipolygon.
   * @param {XMLDocument} fullXmlData - XML for the region.
   * @param {[[number, number],...]} nodelist - Cartesian coordinates of each node keyed by node refID
   * @param {object} options - default values for the building part.
   */
  constructor(id, fullXmlData, nodelist, defaultOptions = {}) {
    this.options = this.blankOptions;
    if (Object.keys(defaultOptions).length === 0) {
      defaultOptions = this.blankOptions;
    }
    this.options.inherited = defaultOptions;
    this.fullXmlData = fullXmlData;
    this.id = id;
    this.way = fullXmlData.getElementById(id);
    this.nodelist = nodelist;
    this.shape = this.buildShape();
    this.setOptions();
  }

  /**
   * Create the shape of the outer way.
   *
   * @return {THREE.Shape} shape - the shape
   */
  buildShape() {
    this.type = 'way';
    return BuildingShapeUtils.createShape(this.way, this.nodelist);
  }

  /**
   * Set the object's options
   */
  setOptions() {
    // if values are not set directly, inherit from the parent.
    // Somme require more extensive calculation.
    const specifiedOptions = this.blankOptions;

    specifiedOptions.building.colour = this.getAttribute('colour');
    specifiedOptions.building.ele = this.getAttribute('ele');
    specifiedOptions.building.height = BuildingPart.normalizeLength(this.getAttribute('height'));
    specifiedOptions.building.levels = BuildingPart.normalizeNumber(this.getAttribute('building:levels'));
    specifiedOptions.building.levelsUnderground = this.getAttribute('building:levels:underground');
    specifiedOptions.building.material = this.getAttribute('building:material');
    specifiedOptions.building.minHeight = BuildingPart.normalizeLength(this.getAttribute('min_height'));
    specifiedOptions.building.minLevel = this.getAttribute('building:min_level');
    specifiedOptions.building.walls = this.getAttribute('walls');
    specifiedOptions.roof.angle = this.getAttribute('roof:angle');
    specifiedOptions.roof.colour = this.getAttribute('roof:colour');
    specifiedOptions.roof.direction = BuildingPart.normalizeDirection(this.getAttribute('roof:direction'));
    specifiedOptions.roof.height = BuildingPart.normalizeLength(this.getAttribute('roof:height'));
    specifiedOptions.roof.levels = this.getAttribute('roof:levels') ? parseFloat(this.getAttribute('roof:levels')) : undefined;
    specifiedOptions.roof.material = this.getAttribute('roof:material');
    specifiedOptions.roof.orientation = this.getAttribute('roof:orientation');
    specifiedOptions.roof.shape = this.getAttribute('roof:shape');

    this.options.specified = specifiedOptions;

    const calculatedOptions = this.blankOptions;
    // todo replace with some sort of foreach loop.
    calculatedOptions.building.colour = this.options.specified.building.colour ?? this.options.inherited.building.colour;
    calculatedOptions.building.ele = this.options.specified.building.ele ?? this.options.inherited.building.ele ?? 0;
    calculatedOptions.building.levels = this.options.specified.building.levels ?? this.options.inherited.building.levels;
    calculatedOptions.building.levelsUnderground = this.options.specified.building.levelsUnderground ?? this.options.inherited.building.levelsUnderground;
    calculatedOptions.building.material = this.options.specified.building.material ?? this.options.inherited.building.material;
    calculatedOptions.building.minLevel = this.options.specified.building.minLevel ?? this.options.inherited.building.minLevel;
    calculatedOptions.building.minHeight = this.options.specified.building.minHeight ?? this.options.inherited.building.minHeight ?? 0;
    calculatedOptions.building.walls = this.options.specified.building.walls ?? this.options.inherited.building.walls;
    calculatedOptions.roof.angle = this.options.specified.roof.angle ?? this.options.inherited.roof.angle;
    calculatedOptions.roof.colour = this.options.specified.roof.colour ?? this.options.inherited.roof.colour;

    calculatedOptions.roof.levels = this.options.specified.roof.levels ?? this.options.inherited.roof.levels;
    calculatedOptions.roof.material = this.options.specified.roof.material ?? this.options.inherited.roof.material;
    calculatedOptions.roof.orientation = this.options.specified.roof.orientation ?? this.options.inherited.roof.orientation;
    calculatedOptions.roof.shape = this.options.specified.roof.shape ?? this.options.inherited.roof.shape;
    calculatedOptions.roof.visible = true;

    // Set the default orientation if the roof shape dictates one.
    const orientableRoofs = ['gabled', 'round'];
    if (!calculatedOptions.roof.orientation && calculatedOptions.roof.shape && orientableRoofs.includes(calculatedOptions.roof.shape)) {
      calculatedOptions.roof.orientation = 'along';
    }
    // Should Skillion be included here?
    const directionalRoofs = ['gabled', 'round'];
    calculatedOptions.roof.direction = this.options.specified.roof.direction ?? this.options.inherited.roof.direction;
    if (calculatedOptions.roof.direction === undefined && directionalRoofs.includes(calculatedOptions.roof.shape)) {
      let longestSide = BuildingShapeUtils.longestSideAngle(this.shape);

      // Convert to angle.
      calculatedOptions.roof.direction = (BuildingPart.atanRadToCompassDeg(longestSide) + 90) % 360;
    }
    const extents = BuildingShapeUtils.extents(this.shape, calculatedOptions.roof.direction / 360 * 2 * Math.PI);
    const shapeHeight = extents[3] - extents[1];
    calculatedOptions.roof.height = this.options.specified.roof.height ??
      this.options.inherited.roof.height ??
      (isNaN(calculatedOptions.roof.levels) ? null : (calculatedOptions.roof.levels * 3)) ??
      (calculatedOptions.roof.shape === 'flat' ? 0 : null) ??
      (calculatedOptions.roof.shape === 'dome' || calculatedOptions.roof.shape === 'pyramidal' ? BuildingShapeUtils.calculateRadius(this.shape) : null) ??
      (calculatedOptions.roof.shape === 'onion' ? BuildingShapeUtils.calculateRadius(this.shape) * 1.5 : null) ??
      (calculatedOptions.roof.shape === 'skillion' ? (calculatedOptions.roof.angle ? Math.cos(calculatedOptions.roof.angle / 360 * 2 * Math.PI) * shapeHeight : 22.5) : null);

    calculatedOptions.building.height = this.options.specified.building.height ??
      (isNaN(calculatedOptions.building.levels) ? null : (calculatedOptions.building.levels * 3) + calculatedOptions.roof.height) ??
      calculatedOptions.roof.height + 3 ??
      this.options.inherited.building.height;
    this.options.building = calculatedOptions.building;
    this.options.roof = calculatedOptions.roof;
    if (this.getAttribute('building:part') && this.options.building.height > this.options.inherited.building.height) {
      window.printError('Way ' + this.id + ' is taller than building. (' + this.options.building.height + '>' + this.options.inherited.building.height + ')');
    }
    // Should skillion automatically calculate a direction perpendicular to the longest outside edge if unspecified?
    if (this.options.roof.shape === 'skillion' && this.options.roof.direction === undefined) {
      window.printError('Part ' + this.id + ' requires a direction. (https://wiki.openstreetmap.org/wiki/Key:roof:direction)');
    }
    this.extrusionHeight = this.options.building.height - this.options.building.minHeight - this.options.roof.height;
  }

  /**
   * calculate the maximum building width in meters.
   */
  getWidth() {
    return BuildingShapeUtils.getWidth(this.shape);
  }

  /**
   * Render the building part
   */
  render() {
    this.createRoof();
    this.parts.push(this.roof);
    const mesh = this.createBuilding();
    if (this.getAttribute('building:part') === 'roof') {
      mesh.visible = false;
      this.options.building.visible = false;
    }
    this.parts.push(mesh);
    return this.parts;
  }

  createBuilding() {
    let extrusionHeight = this.options.building.height - this.options.building.minHeight - this.options.roof.height;

    let extrudeSettings = {
      bevelEnabled: false,
      depth: extrusionHeight,
    };

    var geometry = new ExtrudeGeometry(this.shape, extrudeSettings);

    // Create the mesh.
    var mesh = new Mesh(geometry, [BuildingPart.getRoofMaterial(this.way), BuildingPart.getMaterial(this.way)]);

    // Change the position to compensate for the min_height
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set( 0, this.options.building.minHeight, 0);
    mesh.name = 'b' + this.id;
    return mesh;
  }

  /**
   * Create the 3D render of a roof.
   */
  createRoof() {
    var way = this.way;
    var material;
    var roof;
    if (this.options.roof.shape === 'dome' || this.options.roof.shape === 'onion') {
    //   find largest circle within the way
    //   R, x, y
      var thetaStart = Math.PI / 2;
      const R = BuildingShapeUtils.calculateRadius(this.shape);
      var scale = this.options.roof.height / R;
      if (this.options.roof.shape === 'onion') {
        thetaStart = Math.PI / 4;
        scale = scale / 1.5;
      }
      const geometry = new SphereGeometry(R, 100, 100, 0, 2 * Math.PI, thetaStart);
      // Adjust the dome height if needed.
      geometry.scale(1, scale, 1);
      material = BuildingPart.getRoofMaterial(this.way);
      roof = new Mesh(geometry, material);
      const elevation = this.options.building.height - this.options.roof.height;
      const center = BuildingShapeUtils.center(this.shape);
      roof.rotation.x = -Math.PI;
      // TODO: onion probably need to be raised by an additional R/2.
      roof.position.set(center[0], elevation, -1 * center[1]);
    } else if (this.options.roof.shape === 'skillion') {
      const options = {
        angle: (360 - this.options.roof.direction) / 360 * 2 * Math.PI,
        depth: this.options.roof.height,
        pitch: this.options.roof.angle / 180 * Math.PI,
      };
      const geometry = new RampGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      roof = new Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.options.building.height - this.options.roof.height, 0);
    } else if (this.options.roof.shape === 'gabled') {
      var angle = this.options.roof.direction;
      if (this.options.roof.orientation === 'across') {
        angle = (angle + 90) % 360;
      }
      const center = BuildingShapeUtils.center(this.shape, angle / 180 * Math.PI);
      const options = {
        center: center,
        angle: angle / 180 * Math.PI,
        depth: this.options.roof.height ?? 3,
      };
      const geometry = new WedgeGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      roof = new Mesh(geometry, material);
      roof.rotation.x = -Math.PI / 2;
      roof.position.set(0, this.options.building.height - this.options.roof.height, 0);
    } else if (this.options.roof.shape === 'pyramidal') {
      const center = BuildingShapeUtils.center(this.shape);
      const options = {
        center: center,
        depth: this.options.roof.height,
      };
      const geometry = new PyramidGeometry(this.shape, options);

      material = BuildingPart.getRoofMaterial(this.way);
      roof = new Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.options.building.height - this.options.roof.height, 0);
    } else if (this.options.roof.shape === 'hipped') {
      const options = {
        depth: this.options.roof.height,
      };
      const geometry = new HippedGeometry(this.shape, options);
      material = BuildingPart.getRoofMaterial(this.way);
      roof = new Mesh( geometry, material );
      roof.rotation.x = -Math.PI / 2;
      roof.position.set( 0, this.options.building.height - this.options.roof.height, 0);
    } else {
      let extrusionHeight = this.options.roof.height ?? 0;
      let extrudeSettings = {
        bevelEnabled: false,
        depth: extrusionHeight,
      };
      var geometry = new ExtrudeGeometry(this.shape, extrudeSettings);
      // Create the mesh.
      roof = new Mesh(geometry, [BuildingPart.getRoofMaterial(this.way), BuildingPart.getMaterial(this.way)]);
      roof.rotation.x = -Math.PI / 2;
      roof.position.set(0, this.options.building.height - this.options.roof.height, 0);
      if (this.options.roof.shape !== 'flat') {
        window.printError('Unknown roof shape on '+ this.id + ': '+ this.options.roof.shape);
      }
    }
    roof.name = 'r' + this.id;
    this.roof = roof;
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
      height = 3 * this.way.querySelector('[k="building:levels"]').getAttribute('v') + this.options.roof.height;
    } else if (this.way.querySelector('[k="building:part"]') !== null) {
      if (this.way.querySelector('[k="building:part"]').getAttribute('v') === 'roof') {
        // a roof has no building part by default.
        height = this.options.roof.height;
      }
    }

    return BuildingPart.normalizeLength(height);
  }

  /**
   * Convert an string of length units in various format to
   * a float in meters.
   *
   * Assuming string ends with the unit, no trailing whitespace.
   * If there is whitespace between the unit and the number, it will remain.
   */
  static normalizeLength(length) {
    if (typeof length === 'string' || length instanceof String) {
      if (length.includes('km')){
        // remove final character.
        return parseFloat(length.substring(0, length.length - 2)) * 1000;
      }
      if (length.includes('mi')){
        // remove final character.
        return parseFloat(length.substring(0, length.length - 2)) * 5280 * 12 * 2.54 / 100;
      }
      if (length.includes('nmi')){
        // remove final character.
        return parseFloat(length.substring(0, length.length - 3)) * 1852;
      }
      if (length.includes('m')){
        // remove final character.
        return parseFloat(length.substring(0, length.length - 1));
      }
      if (length.includes('\'')){
        window.printError('Length includes a single quote.');
        var position = length.indexOf('\'');
        var inches = parseFloat(length.substring(0, position)) * 12;
        if (length.length > position + 1) {
          inches += parseFloat(length.substring(position + 1, length.length - 1));
        }
        return inches * 2.54 / 100;
      }
      if (length.includes('"')){
        return parseFloat(length.substring(0, length.length - 1))* 2.54 / 100;
      }
      return parseFloat(length);
    }
    if (length) {
      return parseFloat(length);
    }
  }

  /**
   * Direction. In degrees, 0-360
   */
  static normalizeDirection(direction) {
    const degrees = this.cardinalToDegree(direction);
    if (degrees !== undefined) {
      return degrees;
    }
    if (direction) {
      return parseFloat(direction);
    }
  }

  /**
   * Number.
   */
  static normalizeNumber(number) {
    if (number) {
      return parseFloat(number);
    }
  }

  /**
   * Convert a cardinal direction to degrees.
   * North is zero and values increase clockwise.
   *
   * @param {string} cardinal - the direction.
   *
   * @return {int} degrees
   */
  static cardinalToDegree(cardinal) {
    const cardinalUpperCase = `${cardinal}`.toUpperCase();
    const index = 'N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW'.split(' ').indexOf(cardinalUpperCase);
    if (index === -1) {
      return undefined;
    }
    const degreesTimesTwo = index * 45;
    // integer floor
    return degreesTimesTwo % 2 === 0 ? degreesTimesTwo / 2 : (degreesTimesTwo - 1) / 2;
  }

  /**
   * OSM compass degrees are 0-360 clockwise.
   * 0 degrees is North.
   * @return {number} degrees
   */
  static atanRadToCompassDeg(rad) {
    return ((Math.PI - rad + 3 * Math.PI / 2) % (2 * Math.PI)) * 180 / Math.PI;
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
      if (material instanceof MeshPhysicalMaterial) {
        material.emissive = new Color(color);
        material.emissiveIntensity = 0.5;
        material.roughness = 0.5;
      } else {
        material.color = new Color(color);
      }
    } else if (materialName === ''){
      material.color = new Color('white');
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
      if (material instanceof MeshPhysicalMaterial) {
        material.emissive = new Color(color);
      } else {
        material.color = new Color(color);
      }
    }
    return material;
  }

  static getBaseMaterial(materialName) {
    var material;
    if (materialName === 'glass') {
      material = new MeshPhysicalMaterial( {
        color: 0x00374a,
        emissive: 0x011d57,
        reflectivity: 0.1409,
        clearcoat: 1,
      } );
    } else if (materialName === 'grass'){
      material = new MeshLambertMaterial({
        color: 0x7ec850,
        emissive: 0x000000,
      });
    } else if (materialName === 'bronze') {
      material = new MeshPhysicalMaterial({
        color:0xcd7f32,
        emissive: 0x000000,
        metalness: 1,
        roughness: 0.127,
      });
    } else if (materialName === 'copper') {
      material = new MeshLambertMaterial({
        color: 0xa1c7b6,
        emissive: 0x00000,
        reflectivity: 0,
      });
    } else if (materialName === 'stainless_steel' || materialName === 'metal') {
      material = new MeshPhysicalMaterial({
        color: 0xaaaaaa,
        emissive: 0xaaaaaa,
        metalness: 1,
        roughness: 0.127,
      });
    } else if (materialName === 'brick'){
      material = new MeshLambertMaterial({
        color: 0xcb4154,
        emissive: 0x1111111,
      });
    } else if (materialName === 'concrete'){
      material = new MeshLambertMaterial({
        color: 0x555555,
        emissive: 0x1111111,
      });
    } else if (materialName === 'marble') {
      material = new MeshLambertMaterial({
        color: 0xffffff,
        emissive: 0x1111111,
      });
    } else {
      material = new MeshLambertMaterial({
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

  updateOptions(options) {
    this.options = options;
  }
}
export {BuildingPart};
