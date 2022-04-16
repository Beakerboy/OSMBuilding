/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  setWay(id, fullXmlData) {
    this.way = fullXmlData.getElementById(id);
    const inner_members = this.way.querySelectorAll('member[role="inner"]');
    const outer_members = this.way.querySelectorAll('member[role="outer"]');
    const this.inner_shapes = [];
    for (let i = 0; i < inner_members.length; i++) {
      const way = fullXmlData.getElementById(inner_members[i].getAttribute('ref'));
      this.inner_shapes.push(BuildingShapeUtils.createSHape(way, nodelist));
    }
    for (let j = 0; j < inner_members.length; j++) {
      const way = fullXmlData.getElementById(outer_members[j].getAttribute('ref'));
      const shape = BuildingShapeUtils.createShape(way, nodelist);
      shape.holes.push(...inner_shapes);
      this.shape.push(shape);
    }
  }
}
