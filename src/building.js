/**
 * A building objects contains all the parts and points to render a building.
 *
 * The DOM should be a "Full" xml export from OSM of either a way or relationship.
 */
function Building(Dom) {
  var parts, // a list of all the ways that are to be rendered.
    outer,  // way or multi-polygon
    node_list, // associative array of nodes to x,y
    my = {};
}
