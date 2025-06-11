import {apis} from './apis.js';
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
  /**
   * Latitude and longitude that transitions to (0, 0)
   * @type {number[2]}
   */
  home = [];

  /**
   * The parts.
   * @type {BuildingPart[]}
   */
  parts = [];

  /**
   * The building part of the outer parimeter.
   * @type {BuildingPart}
   */
  outerElement;

  /**
   * DOM Tree of all elements to render
   * @type {DOM.Element}
   */
  fullXmlData;

  id = '0';

  // the list of all nodes with lat/lon coordinates.
  nodelist = [];

  // The type of building
  type;
  options;

  static async getRelationDataWithChildRelations(id) {
    const xmlData = new window.DOMParser().parseFromString(await Building.getRelationData(id), 'text/xml');
    await Promise.all(Array.from(xmlData.querySelectorAll('member[type=relation]')).map(async r => {
      const childId = r.getAttribute('ref');
      if (r.getAttribute('id') === childId) {
        return;
      }
      const childData = new window.DOMParser().parseFromString(await Building.getRelationData(childId), 'text/xml');
      childData.querySelectorAll('node, way, relation').forEach(i => {
        if (xmlData.querySelector(`${i.tagName}[id="${i.getAttribute('id')}"]`)) {
          return;
        }
        xmlData.querySelector('osm').appendChild(i);
      });
    }));
    return new XMLSerializer().serializeToString(xmlData);
  }

  /**
   * Download data for new building
   */
  static async downloadDataAroundBuilding(type, id) {
    let data;
    if (type === 'way') {
      data = await Building.getWayData(id);
    } else {
      data = await Building.getRelationDataWithChildRelations(id);
    }
    let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xmlData);
    const extents = Building.getExtents(id, xmlData, nodelist);
    return await Building.getInnerData(...extents);
  }

  /**
   * build an object
   *
   * @param {string} id - the unique XML id of the object.
   * @param {string} FullXmlData - XML data.
   */
  constructor(id, FullXmlData) {
    this.id = id;
    this.fullXmlData = new window.DOMParser().parseFromString(FullXmlData, 'text/xml');
    const outerElementXml = this.fullXmlData.getElementById(id);
    if (outerElementXml.tagName.toLowerCase() === 'way') {
      this.type = 'way';
    } else if (outerElementXml.querySelector('[k="type"]').getAttribute('v') === 'multipolygon') {
      this.type = 'multipolygon';
    } else {
      this.type = 'relation';
    }
    try {
      this.validateData(outerElementXml);
    } catch (e) {
      throw new Error(`Rendering of ${outerElementXml.tagName.toLowerCase()} ${id} is not possible. ${e}`);
    }

    this.nodelist = Building.buildNodeList(this.fullXmlData);
    this.setHome();
    this.repositionNodes();
    if (this.type === 'way') {
      this.outerElement = new BuildingPart(id, this.fullXmlData, this.nodelist);
    } else if (this.type === 'multipolygon') {
      this.outerElement = new MultiBuildingPart(id, this.fullXmlData, this.nodelist);
    } else {
      const outlineRef = outerElementXml.querySelector('member[role="outline"]').getAttribute('ref');
      const outline = this.fullXmlData.getElementById(outlineRef);
      const outlineType = outline.tagName.toLowerCase();
      if (outlineType === 'way') {
        this.outerElement = new BuildingPart(id, this.fullXmlData, this.nodelist);
      } else {
        this.outerElement = new MultiBuildingPart(outlineRef, this.fullXmlData, this.nodelist);
      }
    }
    this.addParts();
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
   * convert all the longitude latitude values
   * to meters from the home point.
   */
  repositionNodes() {
    for (const key in this.nodelist) {
      this.nodelist[key] = BuildingShapeUtils.repositionPoint(this.nodelist[key], this.home);
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
      const outerMeshes = this.outerElement.render();
      outerMeshes[0].visible = false;
      this.outerElement.options.roof.visible = false;
      outerMeshes[1].visible = false;
      this.outerElement.options.building.visible = false;
      mesh.push(...outerMeshes);
      for (let i = 0; i < this.parts.length; i++) {
        mesh.push(...this.parts[i].render());
      }
    } else {
      const parts = this.outerElement.render();
      mesh.push(parts[0], parts[1]);
    }
    return mesh;
  }

  /**
   * Inspect XML data for building parts and add them to the array.
   *
   */
  addParts() {
    if (this.type === 'relation') {
      let parts = this.fullXmlData.getElementById(this.id).querySelectorAll('member[role="part"]');
      for (let i = 0; i < parts.length; i++) {
        const ref = parts[i].getAttribute('ref');
        const part = this.fullXmlData.getElementById(ref);
        if (part.tagName.toLowerCase() === 'way') {
          this.parts.push(new BuildingPart(ref, this.fullXmlData, this.nodelist, this.outerElement.options));
        } else {
          this.parts.push(new MultiBuildingPart(ref, this.fullXmlData, this.nodelist, this.outerElement.options));
        }
      }
    } else {
      // Filter to all ways
      var parts = this.fullXmlData.getElementsByTagName('way');
      for (const xmlPart of parts) {
        if (xmlPart.querySelector('[k="building:part"]')) {
          const id = xmlPart.getAttribute('id');
          const part = new BuildingPart(id, this.fullXmlData, this.nodelist, this.outerElement.options);
          if (this.partIsInside(part)) {
            this.parts.push(part);
          }
        }
      }
      // Filter all relations
      parts = this.fullXmlData.getElementsByTagName('relation');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].querySelector('[k="building:part"]')) {
          const id = parts[i].getAttribute('id');
          try {
            this.parts.push(new MultiBuildingPart(id, this.fullXmlData, this.nodelist, this.outerElement.options));
          } catch (e) {
            window.printError(e);
          }
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
    if (response.status === 404) {
      throw `The way ${id} was not found on the server.\nURL: ${restPath}`;
    } else if (response.status === 410) {
      throw `The way ${id} was deleted.\nURL: ${restPath}`;
    } else if (response.status !== 200) {
      throw `HTTP ${response.status}.\nURL: ${restPath}`;
    }
    return await response.text();
  }

  static async getRelationData(id) {
    let restPath = apis.getRelation.url(id);
    let response = await fetch(restPath);
    if (response.status === 404) {
      throw `The relation ${id} was not found on the server.\nURL: ${restPath}`;
    } else if (response.status === 410) {
      throw `The relation ${id} was deleted.\nURL: ${restPath}`;
    } else if (response.status !== 200) {
      throw `HTTP ${response.status}.\nURL: ${restPath}`;
    }
    return await response.text();
  }

  /**
   * Fetch map data data from OSM
   */
  static async getInnerData(left, bottom, right, top) {
    let url = apis.bounding.url(left, bottom, right, top);
    let response = await fetch(url);
    if (response.status !== 200) {
      throw `HTTP ${response.status}.\nURL: ${url}`;
    }
    return await response.text();
  }

  /**
   * validate that we have the ID of a building way.
   */
  validateData(xmlData) {
    // Check that it is a building (<tag k="building" v="*"/> exists)
    const buildingType = xmlData.querySelector('[k="building"]');
    const ways = [];
    if (xmlData.tagName === 'relation') {
      // get all building relation parts
      // todo: multipolygon inner and outer roles.
      let parts = xmlData.querySelectorAll('member[role="part"]');
      let ref = 0;
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
        throw new Error('Outer way is not a building');
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
            throw new Error('Way ' + way.getAttribute('id') + ' is not a closed way. ' + firstRef + ' !== ' + lastRef + '.');
          }
        } else {
          throw new Error('Way ' + way.getAttribute('id') + ' has no nodes.');
        }
      } else {
        let parts = way.querySelectorAll('member[role="part"]');
        let ref = 0;
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

  /**
   * Check if any point in a part is within this building's outline.
   * It only checknof points are inside, not if crossing events occur, or
   * if the part completly surrounds the building.
   * @param {BuildingPart} part - the part to be tested
   * @returns {bool} is it?
   */
  partIsInside(part) {
    const shape = part.shape;
    for (const vector of shape.extractPoints().shape) {
      if (BuildingShapeUtils.surrounds(this.outerElement.shape, [vector.x, vector.y])) {
        return true;
      }
    }
    return false;
  }
}
export {Building};
