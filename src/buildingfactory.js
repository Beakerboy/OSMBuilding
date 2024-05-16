import {BuildingShapeUtils} from './extras/BuildingShapeUtils.js';
import {Building} from './building.js';
import {MultiBuildingPart} from './multibuildingpart.js';
/**
 * A class representing an OSM building
 *
 * The static factory is responsible for pulling all required
 * XML data from the API.
 */
class BuildingFactory {

  /**
   * Create new building
   */
  static async createWay(id) {
    var data = await Building.getRelationData(id);
    let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xmlData);
    const extents = Building.getExtents(id, xmlData, nodelist);
    const innerData = await Building.getInnerData(...extents);
    return new MultiBuilding(id, innerData);
  }

  static async createRelation(id) {
    var data = await Building.getRelationData(id);
    let xmlData = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xmlData);
    const extents = Building.getExtents(id, xmlData, nodelist);
    const innerData = await Building.getInnerData(...extents);
    const fullXmlData = new window.DOMParser().parseFromString(innerData, 'text/xml');
    const outerElementXml = this.fullXmlData.getElementById(id);
    if (outerElementXml.querySelector('[k="type"]').getAttribute('v') === 'multipolygon') {
      return new MultiBuilding(id, innerData);
    } 
    return new RelationBuilding(id, innerData);
  }
}
