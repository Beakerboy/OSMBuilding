/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  /**
   * @param {int} id - the ID of the multipolygon.
   * @param {Xml} fullXmlData - full XML Data.
   * @param {[[number, number]]} nodelist - Cartesian coordinates of each node keyed by node refID
   * @param {object} options - default values for the building part.
   */
  constructor(id, fullXmlData, nodelist, options = {}) {
    const multipolygon = fullXmlData.getElementById(id);
    const inner_members = multipolygon.querySelectorAll('member[role="inner"]');
    const outer_members = multipolygon.querySelectorAll('member[role="outer"]');
    const inner_shapes = [];
    for (let i = 0; i < inner_members.length; i++) {
      const way = fullXmlData.getElementById(inner_members[i].getAttribute('ref'));
      inner_shapes.push(BuildingShapeUtils.createSHape(way, nodelist));
    }
    for (let j = 0; j < inner_members.length; j++) {
      const way = fullXmlData.getElementById(outer_members[j].getAttribute('ref'));
      const shape = BuildingShapeUtils.createShape(way, nodelist);
      shape.holes.push(...inner_shapes);
      this.shape.push(shape);
    }
    this.way = way;
    this.nodelist = nodelist;
    this.setOptions(options);
  }
}
