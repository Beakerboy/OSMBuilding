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
  outer_element;

  // DOM Tree of all elements to render
  full_xml_data;

  id = 0;

  // the list of all nodes with lat/lon coordinates.
  nodelist = [];

  // The type of building
  type;
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
    let xml_data = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xml_data);
    const extents = Building.getExtents(id, xml_data, nodelist);
    const innerData = await Building.getInnerData(...extents);
    return new Building(id, innerData);
  }

  /**
   * build an object
   */
  constructor(id, FullXmlData) {
    this.id = id;
    this.full_xml_data = new window.DOMParser().parseFromString(FullXmlData, 'text/xml');
    const outer_element_xml = this.full_xml_data.getElementById(id);
    if (outer_element_xml.tagName.toLowerCase() === 'way') {
      this.type = 'way';
    } else if (outer_element_xml.querySelector('[k="type"]').getAttribute('v') === 'multipolygon') {
      this.type = 'multipolygon';
    } else {
      this.type = 'relation';
    }
    if (Building.isValidData(outer_element_xml)) {
      this.nodelist = Building.buildNodeList(this.full_xml_data);
      this.setHome();
      this.repositionNodes();
      // todo: Use a function instead to properly render multipolygon or relation outine.
      this.outer_element = new BuildingPart(outer_element_xml, this.nodelist);
      this.addParts();
    } else {
      console.log('XML Not Valid');
    }
  }

  /**
   * the Home point is the center of the outer shape
   */
  setHome() {
    const extents = Building.getExtents(this.id, this.full_xml_data, this.nodelist);
    // Set the "home point", the lat lon to center the structure.
    const home_lon = (extents[0] + extents[2]) / 2;
    const home_lat = (extents[1] + extents[3]) / 2;
    this.home = [home_lat, home_lon];
  }

  /**
   * translate all lat/log values to cartesian and store in an array
   */
  static buildNodeList(full_xml_data) {
    const node_list = full_xml_data.getElementsByTagName('node');
    let id = 0;
    var node;
    var coordinates = [];
    var nodelist = [];
    // create a BuildingShape object from the outer and inner elements.
    for(let j = 0; j < node_list.length; j++) {
      node = node_list[j];
      id = node.getAttribute('id');
      coordinates = [node.getAttribute('lat'), node.getAttribute('lon')];
      nodelist[id] = coordinates;
    }
    return nodelist;
  }

  /**
   *
   */
  repositionNodes() {
    for (const key in this.nodelist) {
      this.nodelist[key] = Building.repositionPoint(this.nodelist[key], this.home);
    }
  }

  render() {
    if (this.parts.length > 0) {
      for (let i = 0; i < this.parts.length; i++) {
        this.parts[i].render();
      }
    } else {
      this.outer_element.render();
    }
  }

  addParts() {
    if (this.type === 'relation') {
      let parts = this.full_xml_data.getElementById(this.id).querySelectorAll('member[role="part"]');
      for(let i = 0; i < parts.length; i++) {
        const ref = parts[i].getAttribute('ref');
        const part = this.full_xml_data.getElementById(ref);
        if (part.tagName === 'way') {
          this.parts.push(new BuildingPart(part, this.nodelist));
        } else {
          this.parts.push(new MultiBuildingPart(ref, this.full_xml_data, this.nodelist));
        }
      }
    } else {
      // Filter to all ways
      var innerWays = this.full_xml_data.getElementsByTagName('way');
      for (let j = 0; j < innerWays.length; j++) {
        if (innerWays[j].querySelector('[k="building:part"]')) {
          this.parts.push(new BuildingPart(innerWays[j], this.nodelist));
        }
      }
      // Filter all relations
      innerWays = this.full_xml_data.getElementsByTagName('relation');
      for (let i = 0; i < innerWays.length; i++) {
        if (innerWays[i].querySelector('[k="building:part"]')) {
          const ref = innerWays[i].getAttribute('ref');
          this.parts.push(new MultiBuildingPart(ref, this.full_xml_data, this.nodelist));
        }
      }
    }
  }

  /**
   * Fetch way data from OSM
   */
  static async getWayData(id) {
    let restPath = apis.get_way.url(id);
    let response = await fetch(restPath);
    let text = await response.text();
    return text;
  }

  static async getRelationData(id) {
    let restPath = apis.get_relation.url(id);
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
  static isValidData(xml_data) {
    // Check that it is a building (<tag k="building" v="*"/> exists)
    const building_type = xml_data.querySelector('[k="building"]');
    const ways = [];
    if (xml_data.tagName === 'relation') {
      // get all
      let parts = xml_data.getElementsByTagName('member');
      var ref = 0;
      for (let i = 0; i < parts.length; i++) {
        ref = parts[i].getAttribute('ref');
        ways.push(this.full_xml_data.getElementById(ref));
      }
    } else {
      if (!building_type) {
        console.log('Outer way is not a building');
        console.log(xml_data);
        return false;
      }
      ways.push(xml_data);
    }
    for (let i = 0; i < ways.length; i++) {
      xml_data = ways[i];
      const children = Array.from(xml_data.children);
      var elements = [];
      children.forEach(childtag => {
        if (childtag.tagname === 'nd') {
          elements.push(childtag.getAttribute('ref'));
        }
      });
      // Check that it is a closed way
      if(elements[0] !== elements[elements.length - 1]) {
        console.log('not a closed way');
        return false;
      }
    }
    return true;
  }
  
  /**
   * Rotate lat/lon to reposition the home point onto 0,0.
   */
  static repositionPoint(lat_lon, home) {
    const R = 6371 * 1000;   // Earth radius in m
    const circ = 2 * Math.PI * R;  // Circumference
    const phi = 90 - lat_lon[0];
    const theta = lat_lon[1] - home[1];
    const theta_prime = home[0] / 180 * Math.PI;
    const x = R * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);
    const y = R * Math.cos(phi / 180 * Math.PI);
    const z = R * Math.sin(phi / 180 * Math.PI) * Math.cos(theta / 180 * Math.PI);
    const abs = Math.sqrt(z**2 + y**2);
    const arg = Math.atan(y / z) - theta_prime;
  
    return [x, Math.sin(arg) * abs];
  }

  /**
   * Get the extents of the top level building.
   */
  static getExtents(id, fullXmlData, nodelist) {
    const xmlElement = fullXmlData.getElementById(id);
    const building_type = xmlElement.tagName.toLowerCase();
    var shape;
    var extents;
    if (building_type === 'way') {
      shape = BuildingShapeUtils.createShape(xmlElement, nodelist);
      extents = BuildingShapeUtils.extents(shape);
    } else {
      const relation_type = xmlElement.querySelector('[k="type"]').getAttribute('v');
      if (relation_type === 'multipolygon') {
        let outer_members = xml_data.querySelectorAll('member[role="outer"]');
        var shape;
        var way;
        for (let i = 0; i < outer_members.length; i++) {
          way = this.full_xml_data.getElementById(outer_members[i].getAttribute('ref'));
          shape = BuildingShapeUtils.createShape(way, this.nodelist);
          const way_extents = BuildingShapeUtils.extents(shape);
          if (i === 0) {
            extents = way_extents;
          } else {
            extents[0] = Math.min(extents[0], way_extents[0]);
            extents[1] = Math.min(extents[1], way_extents[1]);
            extents[2] = Math.max(extents[2], way_extents[2]);
            extents[3] = Math.max(extents[3], way_extents[3]);
          }
        }
      } else {
        let outline = xml_element.querySelectorAll('member[role="outline"]');
        way = this.full_xml_data.getElementById(outline.getAttribute('ref'));
        shape = BuildingShapeUtils.createShape(way, this.nodelist);
        extents = BuildingShapeUtils.extents(shape);
      }
    }
    return extents;
  }
}
