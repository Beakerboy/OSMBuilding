import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
import {BuildingPart} from './buildingpart.js';
import {MultiBuildingPart} from './multibuildingpart.js';
/**
 * A class representing an OSM building
 *
 * The static factory is responsible for pulling all required
 * XML data from the API.
 */
class Building {
  // Latitude and longitude that transitioned to (0, 0)
  home = [];

  // the parts
  parts = [];

  // the BuildingPart of the outer building parimeter
  outerElement;

  // DOM Tree of all elements to render
  fullXmlData;

  id = '0';

  // the list of all nodes with lat/lon coordinates.
  nodelist = [];

  // The type of building
  type;
  options;

  /**
   * Create new building
   */
  static async create(type, id) {
    var data;
    if (type === 'way') {
      data = await Building.getWayData(id);
    } else {
      data = await Building.getRelationData(id);
    }
    let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xmlData);
    const extents = Building.getExtents(id, xmlData, nodelist);
    const innerData = await Building.getInnerData(...extents);
    const [augmentedNodelist, augmentedWays] = await Building.buildAugmentedData(innerData)
    return new Building(id, innerData, augmentedNodelist, augmentedWays);
  }

  /**
   * build an object
   *
   * @param {string} id - the unique XML id of the object.
   * @param {string} FullXmlData - XML data.
   */
  constructor(id, FullXmlData, augmentedNodelist, augmentedWays) {
    this.id = id;
    this.fullXmlData = new window.DOMParser().parseFromString(FullXmlData, 'text/xml');
    this.augmentedNodelist = augmentedNodelist;
    this.augmentedWays = augmentedWays;
    const outerElementXml = this.fullXmlData.getElementById(id);
    if (outerElementXml.tagName.toLowerCase() === 'way') {
      this.type = 'way';
    } else if (outerElementXml.querySelector('[k="type"]').getAttribute('v') === 'multipolygon') {
      this.type = 'multipolygon';
    } else {
      this.type = 'relation';
    }
    if (this.isValidData(outerElementXml)) {
      this.nodelist = Building.buildNodeList(this.fullXmlData);
      this.setHome();
      this.repositionNodes();
      if (this.type === 'way') {
        this.outerElement = new BuildingPart(id, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays);
      } else if (this.type === 'multipolygon') {
        this.outerElement = new MultiBuildingPart(id, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays);
      } else {
        const outlineRef = outerElementXml.querySelector('member[role="outline"]').getAttribute('ref');
        const outline = this.fullXmlData.getElementById(outlineRef);
        const outlineType = outline.tagName.toLowerCase();
        if (outlineType === 'way') {
          this.outerElement = new BuildingPart(id, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays);
        } else {
          this.outerElement = new MultiBuildingPart(outlineRef, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays);
        }
      }
      this.addParts();
    } else {
      window.printError('XML Not Valid');
      throw new Error('invalid XML');
    }
  }

  /**
   * the Home point is the center of the outer shape
   */
  setHome() {
    const extents = Building.getExtents(this.id, this.fullXmlData, this.nodelist);
    // Set the "home point", the lat lon to center the structure.
    const homeLon = (extents[0] + extents[2]) / 2;
    const homeLat = (extents[1] + extents[3]) / 2;
    this.home = [homeLon, homeLat];
  }

  /**
   * Extract all nodes from an XML file.
   *
   * @param {DOM.Element} fullXmlData - OSM XML with nodes
   *
   * @return {Object} dictionary of nodes
   */
  static buildNodeList(fullXmlData) {
    const nodeElements = fullXmlData.getElementsByTagName('node');
    let id = 0;
    var node;
    let coordinates = [];
    const nodeList = {};
    for (let j = 0; j < nodeElements.length; j++) {
      node = nodeElements[j];
      id = node.getAttribute('id');
      coordinates = [node.getAttribute('lon'), node.getAttribute('lat')];
      nodeList[id] = coordinates;
    }
    return nodeList;
  }


  /**
   * @param {DOM.Element} fullXmlData - OSM XML with nodes
   * @return {Promise<({}|*)[]>}
   */
  static async buildAugmentedData(fullXmlData) {
    const xmlData = new DOMParser().parseFromString(fullXmlData, 'text/xml');
    const completedWays = new Set(Array.from(xmlData.getElementsByTagName('way')).map(i => i.getAttribute('id')));
    const memberWays = xmlData.querySelectorAll('member[type="way"]');
    const nodeList = {};
    const waysList = {};
    await Promise.all(Array.from(memberWays).map(async currentWay => {
      const wayID = currentWay.getAttribute('ref');
      if (completedWays.has(wayID)) {
        return
      }
      printError('Additional downloading way ' + wayID);
      const wayData = new DOMParser().parseFromString(await Building.getWayData(wayID), 'text/xml');
      printError(`Way ${wayID} was downloaded`);
      waysList[wayID] = wayData.querySelector('way');
      wayData.querySelectorAll('node').forEach(i => {
        nodeList[i.getAttribute('id')] = [i.getAttribute('lon'), i.getAttribute('lat')];
      });
    }))
    return [nodeList, waysList];
  }


  /**
   * convert all the longitude latitude values
   * to meters from the home point.
   */
  repositionNodes() {
    for (const key in this.nodelist) {
      this.nodelist[key] = BuildingShapeUtils.repositionPoint(this.nodelist[key], this.home);
    }
    for (const key in this.augmentedNodelist) {
      this.augmentedNodelist[key] = BuildingShapeUtils.repositionPoint(this.augmentedNodelist[key], this.home);
    }
  }

  /**
   * Create the array of building parts.
   *
   * @return {array} mesh - an array or Three.Mesh objects
   */
  render() {
    const mesh = [];
    if (this.parts.length > 0) {
      this.outerElement.options.building.visible = false;
      mesh.push(...this.outerElement.render());
      for (let i = 0; i < this.parts.length; i++) {
        mesh.push(...this.parts[i].render());
      }
    } else {
      const parts = this.outerElement.render();
      mesh.push(parts[0], parts[1]);
    }
    return mesh;
  }

  addParts() {
    if (this.type === 'relation') {
      let parts = this.fullXmlData.getElementById(this.id).querySelectorAll('member[role="part"]');
      for (let i = 0; i < parts.length; i++) {
        const ref = parts[i].getAttribute('ref');
        const part = this.fullXmlData.getElementById(ref);
        if (part.tagName.toLowerCase() === 'way') {
          this.parts.push(new BuildingPart(ref, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays, this.outerElement.options));
        } else {
          this.parts.push(new MultiBuildingPart(ref, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays, this.outerElement.options));
        }
      }
    } else {
      // Filter to all ways
      var parts = this.fullXmlData.getElementsByTagName('way');
      for (let j = 0; j < parts.length; j++) {
        if (parts[j].querySelector('[k="building:part"]')) {
          const id = parts[j].getAttribute('id');
          this.parts.push(new BuildingPart(id, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays, this.outerElement.options));
        }
      }
      // Filter all relations
      parts = this.fullXmlData.getElementsByTagName('relation');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].querySelector('[k="building:part"]')) {
          const id = parts[i].getAttribute('id');
          this.parts.push(new MultiBuildingPart(id, this.fullXmlData, this.nodelist, this.augmentedNodelist, this.augmentedWays, this.outerElement.options));
        }
      }
    }
  }

  /**
   * Fetch way data from OSM
   */
  static async getWayData(id) {
    let restPath = apis.getWay.url(id);
    let response = await fetch(restPath);
    let text = await response.text();
    return text;
  }

  static async getRelationData(id) {
    let restPath = apis.getRelation.url(id);
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
  isValidData(xmlData) {
    // Check that it is a building (<tag k="building" v="*"/> exists)
    const buildingType = xmlData.querySelector('[k="building"]');
    const ways = [];
    if (xmlData.tagName === 'relation') {
      // get all building relation parts
      // todo: multipolygon inner and outer roles.
      let parts = xmlData.querySelectorAll('member[role="part"]');
      var ref = 0;
      for (let i = 0; i < parts.length; i++) {
        ref = parts[i].getAttribute('ref');
        const part = this.fullXmlData.getElementById(ref);
        if (part) {
          ways.push(this.fullXmlData.getElementById(ref));
        } else {
          window.printError('Part #' + i + '(' + ref + ') is null.');
        }
      }
    } else {
      if (!buildingType) {
        window.printError('Outer way is not a building');
        return false;
      }
      ways.push(xmlData);
    }
    for (let i = 0; i < ways.length; i++) {
      const way = ways[i];
      if (way.tagName.toLowerCase() === 'way') {
        const nodes = way.getElementsByTagName('nd');
        if (nodes.length > 0) {
          // Check that it is a closed way
          const firstRef = nodes[0].getAttribute('ref');
          const lastRef = nodes[nodes.length - 1].getAttribute('ref');
          if (firstRef !== lastRef) {
            window.printError('Way ' + way.getAttribute('id') + ' is not a closed way. ' + firstRef + ' !== ' + lastRef + '.');
            return false;
          }
        } else {
          window.printError('Way ' + way.getAttribute('id') + ' has no nodes.');
          return false;
        }
      } else {
        let parts = way.querySelectorAll('member[role="part"]');
        var ref = 0;
        for (let i = 0; i < parts.length; i++) {
          ref = parts[i].getAttribute('ref');
          const part = this.fullXmlData.getElementById(ref);
          if (part) {
            ways.push(this.fullXmlData.getElementById(ref));
          } else {
            window.printError('Part ' + ref + ' is null.');
          }
        }
      }
    }
    return true;
  }

  /**
   * Get the extents of the top level building.
   *
   * @param {number} id - The id of the relation or way
   * @param {XML} fulXmlData - A complete <osm> XML file.
   * @param {[number => [number, number]]} nodelist - x/y or lon/lat coordinated keyed by id
   *
   * @param {[number, number, number, number]} extents - [left, bottom, right, top] of the entire building.
   */
  static getExtents(id, fullXmlData, nodelist) {
    const xmlElement = fullXmlData.getElementById(id);
    const buildingType = xmlElement.tagName.toLowerCase();
    var shape;
    var extents = [];
    if (buildingType === 'way') {
      shape = BuildingShapeUtils.createShape(xmlElement, nodelist);
      extents = BuildingShapeUtils.extents(shape);
    } else if (buildingType === 'relation'){
      const relationType = xmlElement.querySelector('[k="type"]').getAttribute('v');
      if (relationType === 'multipolygon') {
        let outerMembers = xmlElement.querySelectorAll('member[role="outer"]');
        var shape;
        var way;
        for (let i = 0; i < outerMembers.length; i++) {
          way = fullXmlData.getElementById(outerMembers[i].getAttribute('ref'));
          shape = BuildingShapeUtils.createShape(way, nodelist);
          const wayExtents = BuildingShapeUtils.extents(shape);
          if (i === 0) {
            extents = wayExtents;
          } else {
            extents[0] = Math.min(extents[0], wayExtents[0]);
            extents[1] = Math.min(extents[1], wayExtents[1]);
            extents[2] = Math.max(extents[2], wayExtents[2]);
            extents[3] = Math.max(extents[3], wayExtents[3]);
          }
        }
      } else {
        // In a relation, the overall extents may be larger than the outline.
        // use the extents of all the provided nodes.
        extents[0] = 180;
        extents[1] = 90;
        extents[2] = -180;
        extents[3] = -90;
        for (const key in nodelist) {
          extents[0] = Math.min(extents[0], nodelist[key][0]);
          extents[1] = Math.min(extents[1], nodelist[key][1]);
          extents[2] = Math.max(extents[2], nodelist[key][0]);
          extents[3] = Math.max(extents[3], nodelist[key][1]);
        }
      }
    } else {
      window.printError('"' + buildingType + '" is neither "way" nor "relation". Check that the id is correct.');
    }
    return extents;
  }

  getInfo() {
    var partsInfo = [];
    for (let i = 0; i < this.parts.length; i++) {
      partsInfo.push(this.parts[i].getInfo());
    }
    return {
      id: this.id,
      type: this.type,
      options: this.outerElement.options,
      parts: partsInfo,
    };
  }

  /**
   * Use the provided options to update and return the geometry
   * of a part.
   */
  getPartGeometry(options) {
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (part.id === options.id) {
        part.updateOptions(options);
        return part.render();
      }
    }
  }
}
export {Building};
