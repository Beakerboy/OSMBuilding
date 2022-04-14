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

  /**
   * Create new building
   */
  static async create(type, id) {
    var building;
    if (type === 'way') {
      building = await Building.createWayBuilding(id);
    } else {
      building = await Building.createRelationBuilding(id);
    }
    return building;
  }

  /**
   * build an object
   */
  constructor(id, FullXmlData) {
    this.id = id;
    this.full_xml_data = new window.DOMParser().parseFromString(FullXmlData, 'text/xml');
    const outer_element_xml = this.full_xml_data.getElementById(id);
    if (Building.isValidData(outer_element_xml)) {
      this.nodelist = Building.buildNodeList(this.full_xml_data);
      this.setHome();
      this.nodelist = Building.buildNodeList(this.full_xml_data, this.home);
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
    const xmlElement = this.full_xml_data.getElementById(this.id);
    const building_type = xmlElement.tagName.toLowerCase();
    var shape;
    var extents;
    if (building_type === 'way') {
      shape = BuildingShapeUtils.createShape(xmlElement, this.nodelist);
      extents = BuildingShapeUtils.extents(shape);
    } else {
      const relation_type = relation.querySelector('[k="type"]').getAttribute('v');
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
        let outline = xml_data.querySelectorAll('member[role="outline"]');
        way = this.full_xml_data.getElementById(outline.getAttribute('ref'));
        shape = BuildingShapeUtils.createShape(way, this.nodelist);
        extents = BuildingShapeUtils.extents(shape);
      }
    }
    // Set the "home point", the lat lon to center the structure.
    const home_lon = (extents[0] + extents[2]) / 2;
    const home_lat = (extents[1] + extents[3]) / 2;
    this.home = [home_lat, home_lon];
  }

  /**
   * translate all lat/log values to cartesian and store in an array
   */
  static buildNodeList(full_xml_data, home = []) {
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
      if (home.length === 2) {
        nodelist[id] = Building.repositionPoint(coordinates, home);
      } else {
        nodelist[id] = coordinates;
      }
    }
    return nodelist;
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
    // Filter to all ways
    var innerWays = this.full_xml_data.getElementsByTagName('way');
    for (let j = 0; j < innerWays.length; j++) {
      if (innerWays[j].querySelector('[k="building:part"]')) {
        this.parts.push(new BuildingPart(innerWays[j], this.nodelist));
      }
    }
    // Filter all relations
    innerWays = this.full_xml_data.getElementsByTagName('relation');
    var way = {};
    way.outers = [];
    way.inners = [];
    for (let i = 0; i < innerWays.length; i++) {
      if (innerWays[i].querySelector('[k="building:part"]')) {
        const outers = [];
        const inners = [];
        var ref;
        let members = innerWays[i].getElementsByTagName('member');
        var member_element;
       
        for (let j = 0; j < members.length; j++) {
          ref = members[j].getAttribute('ref');
          member_element = this.full_xml_data.getElementById(ref);
          if (member_element[j].getAttribute('role') === 'outer') {
            way.outers.push(member_element);
          } else {
            way.inners.push(member_element);
          }
        }
        this.parts.push(new MultiBuildingPart(way, this.nodelist));
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
    // A building relation outline might not be a building.
    //if (!building_type) {
    //  console.log('not a building');
    //  console.log(xml_data);
    //  return false;
    //}
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
   * Create a building from a way ID
   *
   * This requires determining the bounds of the way, and querying for all other ways and relations
   * within the bounding box. Then testing to ensure each is a building part that is within the
   * area of the provided way.
   *
   * toDo: validate that the way is a building.
   */
  static async createWayBuilding(id) {
    const data = await Building.getWayData(id);
    let xml_data = new window.DOMParser().parseFromString(data, 'text/xml');
    const nodelist = Building.buildNodeList(xml_data);
    const shape = BuildingShapeUtils.createShape(xml_data, nodelist);
    const extents = BuildingShapeUtils.extents(shape);
    const innerData = await Building.getInnerData(...extents);
    return new Building(id, innerData);
  }

  /**
   * Create a building when given a relation ID.
   *
   * This could either define a building relation, which links all the building parts together
   * or a multiploygon. A multipolygon requires the same bounding box procedure as the
   * createWayBuilding() method.
   *
   * A building relation requires iteration to drill down to successive parts.
   */
  static async createRelationBuilding(id) {
    const data = await Building.getRelationData(id);
    let xml_data = new window.DOMParser().parseFromString(data, 'text/xml');
    const relation = xml_data.getElementById(id);
    const relation_type = relation.querySelector('[k="type"]').getAttribute('v');
    
    if (relation_type === 'multipolygon') {
      let parts = xml_data.getElementsByTagName('member');
      //<member type="way" ref="8821713" role="outer"/>
      //<member type="way" ref="28315757" role="inner"/>
      var part;
      var ref;
      var way_nodes;
      var way_ref;
      var lats = [];
      var lons = [];
      for (let i = 0; i < parts.length; i++) {
        part = parts[i];
        if (part.getAttribute('role') === 'outer') {
          way_ref = part.getAttribute('ref');
          way_nodes = xml_data.getElementById(way_ref).getElementsByTagName('nd');
          for (let j = 0; j < way_nodes.length; j++) {
            const node_ref = way_nodes[j].getAttribute('ref');
            const node = xml_data.querySelector('[id="' + node_ref + '"]');
            lats.push(node.getAttribute('lat'));
            lons.push(node.getAttribute('lon'));
          }
        }
      }
      // Get all building parts within the building
      // Get max and min lat and log from the building
      const left = Math.min(...lons);
      const bottom = Math.min(...lats);
      const right = Math.max(...lons);
      const top = Math.max(...lats);

      const innerData = await Building.getInnerData(left, bottom, right, top);
      return new Building(id, innerData);
    } else if (relation_type === 'building') {
      //<member type="way" ref="443679945" role="part"/>
      let parts = xml_data.getElementsByTagName('member');
      var member_type = '';
      var member_id = 0;
      var member_data;
      var newid;
      for (let i = 0; i < parts.length; i++) {
        member_type = parts[i].getAttribute('type');
        if (parts[i].getAttribute('role') === 'outline') {
          newid = parts[i].getAttribute('ref');
        }
        if (member_type === 'relation') {
          // The outline is a multipolygon.
          const building = Building.create('relation', newid);
          building.id = id;
        }
      }
      return new Building(newid, data);
    }    
  }
}
