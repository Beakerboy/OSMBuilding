/**
 * Get the THREE.material for a given way
 *
 * This is complicated by inheritance
 */
function getMaterial(way) {
  var material_name = "";
  var color = "";
  if (way.querySelector('[k="building:facade:material"]') !== null) {
    // if the buiilding part has a designated material tag, use it.
    material_name = way.querySelector('[k="building:facade:material"]').getAttribute('v');
  } else if (way.querySelector('[k="building:material"]') !== null) {
    // if the buiilding part has a designated material tag, use it.
    material_name = way.querySelector('[k="building:material"]').getAttribute('v');
  }
  if (way.querySelector('[k="colour"]') !== null) {
    // if the buiilding part has a designated colour tag, use it.
    color = way.querySelector('[k="colour"]').getAttribute('v');
  } else if (way.querySelector('[k="building:colour"]') !== null) {
    // if the buiilding part has a designated colour tag, use it.
    color = way.querySelector('[k="building:colour"]').getAttribute('v');
  } else if (way.querySelector('[k="building:facade:colour"]') !== null) {
    // if the buiilding part has a designated colour tag, use it.
    color = way.querySelector('[k="building:facade:colour"]').getAttribute('v');
  }
  const material = getBaseMaterial(material_name);
  if (color !== "") {
    material.color = new THREE.Color(color);
  } else if (material_name === ""){
    material.color = new THREE.Color("white");
  }
  return material;
}

/**
 * Get the THREE.material for a given way
 *
 * This is complicated by inheritance
 */
function getRoofMaterial(way) {
  var material_name = "";
  var color = "";
  if (way.querySelector('[k="roof:material"]') !== null) {
    // if the buiilding part has a designated material tag, use it.
    material_name = way.querySelector('[k="roof:material"]').getAttribute('v');
  }
  if (way.querySelector('[k="roof:colour"]') !== null) {
    // if the buiilding part has a designated mroof:colour tag, use it.
    color = way.querySelector('[k="roof:colour"]').getAttribute('v');
  }
  const material = getBaseMaterial(material_name);
  if (color !== "") {
    material.color = new THREE.Color(color);
  } else if (material_name === "") {
    material.color = new THREE.Color("black");
  }
  return material;
}

function getBaseMaterial(material_name) {
  var material;
  if (material_name === 'glass') {
    material = new THREE.MeshPhysicalMaterial( {
      color: 0x00374a,
      emissive: 0x011d57,
      reflectivity: .1409,
      clearcoat: 1
    } );
  } else if (material_name === "grass"){
    material = new THREE.MeshLambertMaterial({
      color: 0x7ec850,
      emissive: 0x000000
    });
  } else if (material_name === 'bronze') {
    material = new THREE.MeshPhysicalMaterial( {
      color:0xcd7f32,
      emissive: 0x000000,
      metalness: 1,
      roughness: .127
    } );
  } else if (material_name === 'copper') {
    material = new THREE.MeshLambertMaterial( { 
      color: 0xa1c7b6,
      emissive: 0x00000,
      reflectivity: 0
    } );
  } else if (material_name === 'stainless_steel') {
    material = new THREE.MeshPhysicalMaterial( {
      color: 0xaaaaaa,
      emissive: 0xaaaaaa,
      metalness: 1,
      roughness: .127
    } );
  } else if (material_name === "brick"){
    material = new THREE.MeshLambertMaterial({
      color: 0xcb4154,
      emissive: 0x1111111
    });
  } else if (material_name === "concrete"){
    material = new THREE.MeshLambertMaterial({
      color: 0x555555,
      emissive: 0x1111111
    });
  } else if (material_name ==="marble") {
    material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x1111111
    });
  } else {
    material = new THREE.MeshLambertMaterial({
      emissive: 0x1111111
    });
  }
  return material;
}
