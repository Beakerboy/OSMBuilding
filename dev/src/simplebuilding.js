class SimpleBuilding {
  constructor(way_id) {
    this.id = way_id;
    // get full way data from OSM
    // get bounding box data from OSM
    // Transform lat-lon to x-y.
    // This.nodeList = all nodes
    // discard nodes not within the main building way.

    // discard any ways that contain missing nodes
    // or are not building parts.
  }

  /**
   * Is this point inside this building?
   *
   * This may be better in a 2DShape class to manage
   * 2D geometry math functions.
   */
  surrounds(x, y) {

  }

  /**
   * Discard any nodes that are not within the building
   */
  discardOutsideNodes() {
    // foreach this.nodeList as node
    //   if (!this.surrounds(node)) {
    //     unset (this.nodelist[i]);
    //   }
  }
  
}
