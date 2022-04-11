/**
 * An OSM Building Part
 *
 * A building part includes a main building and a roof.
 */
class MultiBuildingPart extends BuildingPart {

  /**
   * Create the shape of this way.
   */
  createShape() {
    const outers = this.way.outer;
    const inners = this.way.inner;
    const shapes = this.createAllShapes(outers);
    const holes = this.createAllShapes(inners);
    for (let i = 0; i < shapes.length; i++) {
      shapes[i].holes = holes;
    }
    return shapes;
  }

  createAllShapes(ways) {
    var way;
    const shapes = [];
    var elements;
    var shape;
    for (let j = 0; j < ways.length; j++) {
      way = ways[i];
      elements = way.getElementsByTagName("nd");
      shape = new THREE.Shape();
      var ref;
      var node = [];
      for (let i = 0; i < elements.length; i++) {
        ref = elements[i].getAttribute("ref");
        node = this.nodelist[ref];
        if (i === 0) {
          shape.moveTo(node[0], node[1]);
        } else {
          shape.lineTo(node[0], node[1]);
        }
      }
      shapes.push(shape);
    }
    return shapes;
  }
}
