class BuildingPart {

  hasRoof = false;
  
  constructor(way, building) {
    this.way = way;
  }

  calculateRadius(xml_data) {
    const elements = this.way.getElementsByTagName("nd");
    var lats = [];
    var lons = [];
    var lat = 0;
    var lon = 0;
    for (let i = 0; i < elements.length; i++) {
      ref = elements[i].getAttribute("ref");
      node = xml_data.querySelector('[id="' + ref + '"]');
      lat = node.getAttribute("lat");
      lon = node.getAttribute("lon");
      var point = repositionPoint([lat, lon]);
      lats.push(point[0]);
      lons.push(point[1]);
    }
    const left = Math.min(...lons);
    const bottom = Math.min(...lats);
    const right = Math.max(...lons);
    const top = Math.max(...lats);

    // Set the "home point", the lat lon to center the structure.
    return Math.min(right - left, top - bottom) / 2;
  }

  /**
   * Find the center of a closed way
   *
   * Need to compensate for edge cases
   *  - ways that cross the date line
   * xml_data the DOM tree of all the data in the region
   */
  centroid(xml_data) {
    const elements = way.getElementsByTagName("nd");
    var lat_sum = 0;
    var lon_sum = 0;
    var lat = 0;
    var lon = 0;
    for (let i = 0; i < elements.length; i++) {
      var ref = elements[i].getAttribute("ref");
      var node = xml_data.querySelector('[id="' + ref + '"]');
      lat = parseFloat(node.getAttribute("lat"));
      lon = parseFloat(node.getAttribute("lon"));
      lat_sum += lat;
      lon_sum += lon;
    }
    const center = [lat_sum / elements.length, lon_sum / elements.length];
    return repositionPoint(center);
  }

  render() {
    
  }
}
