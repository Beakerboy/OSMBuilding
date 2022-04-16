/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  buildShape() {
    const inner_members = this.way.querySelectorAll('member[role="inner"]');
    const outer_members = this.way.querySelectorAll('member[role="outer"]');
    const inner_shapes = [];
    var shapes = [];
    for (let i = 0; i < inner_members.length; i++) {
      const way = this.fullXmlData.getElementById(inner_members[i].getAttribute('ref'));
      inner_shapes.push(BuildingShapeUtils.createShape(way, this.nodelist));
    }
    for (let j = 0; j < inner_members.length; j++) {
      const way = this.fullXmlData.getElementById(outer_members[j].getAttribute('ref'));
      const shape = BuildingShapeUtils.createShape(way, this.nodelist);
      shape.holes.push(...inner_shapes);
      shapes.push(shape);
    }
    return shapes;
  }
}
