class BuildingPart {
  create(xml_data) {
    //get the type of the data
    return new WayPart(xml_data);
  }
}
