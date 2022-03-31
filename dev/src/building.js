/**
 * A building objects contains all the parts and points to render a building.
 *
 * The DOM should be a "Full" xml export from OSM of either a way or relationship.
 */
function Building(id) {
  var parts, // a list of all the ways that are to be rendered.
    outer,  // way or multi-polygon
    node_list, // associative array of nodes to x,y
    my = {};
  
  /**
   * Factory method
   */
  this.create = function(type, id) {
    // Get XML
    // Convert to DOM
    if (type === "way") {
      // return new SimpleBuilding(id);
    } else if(type === "relation") {
      // grab the relation object with ref = id;
      // get the object's tag = type . attribute('v')
      if (value === "building") {
        // A building relation contains an outer way and all the parts
        // return new RelationBuilding(id);
      } else if (type === "multipolygon") {
        // return new MultiBuilding(id);
      } else {
        // error
      }
    } else {
      //error
    }
  }

  /**
   * Is a point inside the building
   */
  // this.isPointInside(x, y)
}
