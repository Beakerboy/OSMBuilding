//import * as THREE from "three";
//import { OrbitControls } from "https://unpkg.com/three@0.138.3/examples/jsm/controls/OrbitControls.js";
var camera;
var renderer;
var controls;
var scene = new THREE.Scene();
var home;
var helper_size;

  let apis = {
    bounding: {
      api:"https://api.openstreetmap.org/api/0.6/map?bbox=",
      url: (left, bottom, right, top) => {
        return apis.bounding.api + left + "," + bottom + "," + right + "," + top;
      }
    },
    get_way: {
      api:"https://api.openstreetmap.org/api/0.6/way/",
      parameters:"/full",
      url: (way_id) => {
        return apis.get_way.api + way_id + apis.get_way.parameters;
      }
    }
  };

/**
 * Initialize the screen
 */
function init() {
  camera = new THREE.PerspectiveCamera(
    50,
    document.documentElement.clientWidth /
      document.documentElement.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    alpha: false
  });
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight-20
  );
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.zIndex = 0;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
}

/**
 * Create the scene
 */
async function createScene() {
 
  while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  buildStructure();

  addLights();
 
  camera.position.set(0, 0, 200); // x y z
  
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

function addLights() {
  const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
  scene.add( ambientLight );
  
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( -1, 0.75, 1 );
  dirLight.position.multiplyScalar( 50);
  dirLight.name = "dirlight";
   // dirLight.shadowCameraVisible = true;

   scene.add( dirLight );

   dirLight.castShadow = true;
   dirLight.shadowMapWidth = dirLight.shadowMapHeight = 1024*2;

   var d = 300;

   dirLight.shadowCameraLeft = -d;
   dirLight.shadowCameraRight = d;
   dirLight.shadowCameraTop = d;
   dirLight.shadowCameraBottom = -d;

   dirLight.shadowCameraFar = 3500;
   dirLight.shadowBias = -0.0001;
   dirLight.shadowDarkness = 0.35;
}

/**
 * Fetch way data from OSM
 */
async function getData() {
  var type = "way";
  var id = 66418809;
  if (window.location.search.substr(1) !== null) {
    window.location.search.substr(1).split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === "type") {
          type = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === "id") {
          id = decodeURIComponent(tmp[1]);
        }
      });
  }
  let response = await fetch(apis.get_way.url(id));
  let res = await response.text();
  return res;
}

/**
 * Fetch way data from OSM
 */
async function getInnerData(left, bottom, right, top) {
  let response = await fetch(apis.bounding.url(left, bottom, right, top));
  let res = await response.text();
  return res;
}

/**
 * Build the structure
 *
 * Query OSM for the way data of the specified object
 * Convert the lat/lon data to cartesian coordinates.
 * Create a shape and extrude to the correct height.
 */
async function buildStructure() {
  let data = await getData();

  let xml_data = new window.DOMParser().parseFromString(data, "text/xml");
  // ToDO: Check that it is a building (<tag k="building" v="*"/> exists)
  // Or that it is a building part.
  
  const elements = xml_data.getElementsByTagName("nd");
  
  // Check that it is a closed way
  let first = elements[0];
  let last = elements[elements.length - 1];
  var first_ref = first.getAttribute("ref");
  var last_ref = last.getAttribute("ref");
  if(first_ref !== last_ref) {
    return 0;
  }
  
  const nodes = xml_data.getElementsByTagName("node");

  var building = new THREE.Shape();
  var ref = elements[0].getAttribute("ref");
  var node = xml_data.querySelector('[id="' + ref + '"]');

  // if it is a building, query all ways within the bounding box and reder the building parts.
  // The way is a list of <nd ref=""> tags.
  // Use the ref to look up the lat/log data from the unordered <node id="" lat="" lon=""> tags.
  var lats = [];
  var lons = [];
  var lat = 0;
  var lon = 0;
  for (let i = 0; i < elements.length; i++) {
    ref = elements[i].getAttribute("ref");
    node = xml_data.querySelector('[id="' + ref + '"]');
    lat = node.getAttribute("lat");
    lon = node.getAttribute("lon");
    lats.push(lat);
    lons.push(lon);
  }

  // if it was a building:part, no need to get sub-parts
  // if (is_building) {
  // Get all building parts within the building
  // Get max and min lat and log from the building
  const left = Math.min(...lons);
  const bottom = Math.min(...lats);
  const right = Math.max(...lons);
  const top = Math.max(...lats);

  // Set the "home point", the lat lon to center the structure.
  const home_lon = (left + right) / 2;
  const home_lat = (top + bottom) / 2;
  home = [home_lat, home_lon];
  
  helper_size = Math.max(right - left, top - bottom) * 2 * Math.PI * 6371000  / 360 / .9;
  const helper = new THREE.GridHelper(helper_size, helper_size / 10);
  scene.add(helper);
  
  // Get all objects in that area.
  let innerData = await getInnerData(left, bottom, right, top);
  let inner_xml_data = new window.DOMParser().parseFromString(innerData, "text/xml");

  // Filter to all ways
  const innerWays = inner_xml_data.getElementsByTagName("way");

  var k = 0;
  var nodes_in_way = [];
  var height = 0;
  var min_height = 0;
  var extrusion_height = 0;
  for (let j = 0; j < innerWays.length; j++) {
    if (innerWays[j].querySelector('[k="building:part"]')) {
      height = calculateWayHeight(innerWays[j]);
      min_height = calculateWayMinHeight(innerWays[j]);
      roof_height = calculateRoofHeight(innerWays[j]);
      extrusion_height = height - min_height - roof_height;

      // If we have a multi-polygon, create the outer shape
      // then punch out all the inner shapes.
      var shape = createShape(innerWays[j], inner_xml_data, home_lat, home_lon);
      k++;
      extrudeSettings = {
        bevelEnabled: false,
        depth: extrusion_height,
      };
      var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // Create the mesh.
      // Todo: Use an array of materials to render the roof the appropriate color.
      var mesh = new THREE.Mesh(geometry, [getRoofMaterial(innerWays[j]), getMaterial(innerWays[j])]);

      // Change the position to compensate for the min_height
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set( 0, min_height, 0);
      scene.add( mesh );

      createRoof(innerWays[j], inner_xml_data);
    }
  }
  
 // Add the main building if no parts were rendered.
  if (k === 0) {
    var shape = createShape(xml_data, inner_xml_data, home_lat, home_lon);
    extrudeSettings = {
        bevelEnabled: false,
        depth: calculateWayHeight(xml_data),
      };
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const building_mesh = new THREE.Mesh(geometry, material);
    building_mesh.rotation.x = -Math.PI / 2;
    scene.add(building_mesh);
  }
}

/**
 * Create the shape of a given way.
 *
 * way DOM tree of the way to render
 * xml_data the DOM tree of all the data in the region
 */
function createShape(way, xml_data) {
  // createBuilding()
  const elements = way.getElementsByTagName("nd");
  const shape = new THREE.Shape();
  var lat = 0;
  var lon = 0;
  for (let i = 0; i < elements.length; i++) {
    var ref = elements[i].getAttribute("ref");
    var node = xml_data.querySelector('[id="' + ref + '"]');
    lat = parseFloat(node.getAttribute("lat"));
    lon = parseFloat(node.getAttribute("lon"));
    var points = repositionPoint([lat, lon]);
    if (i === 0) {
      shape.moveTo(points[0], points[1]);
    } else {
      shape.lineTo(points[0], points[1]);
    }
  }
  return shape;
}

/**
 * Rotate lat/lon to reposition the home point onto 0,0.
 */
function repositionPoint(lat_lon) {
  const R = 6371 * 1000;   // Earth radius in m
  const circ = 2 * Math.PI * R;  // Circumference
  const phi = 90 - lat_lon[0];
  const theta = lat_lon[1] - home[1];
  const theta_prime = home[0] / 180 * Math.PI;
  const x = R * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);
  const y = R * Math.cos(phi / 180 * Math.PI);
  const z = R * Math.sin(phi / 180 * Math.PI) * Math.cos(theta / 180 * Math.PI);
  const abs = Math.sqrt(z**2 + y**2);
  const arg = Math.atan(y / z) - theta_prime;
  
  return [x, Math.sin(arg) * abs];
}

/**
 * Find the center of a closed way
 *
 * Need to compensate for edge cases
 *  - ways that cross the date line
 * way DOM tree of the way to render
 * xml_data the DOM tree of all the data in the region
 */
function centroid(way, xml_data) {
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

/**
 * Create the 3D render of a roof.
 */
function createRoof(way, xml_data, home_lat, home_lon) {
  var roof_shape = "flat";
  var roof_height = 0;
  if (way.querySelector('[k="roof:shape"]') !== null) {
    // if the buiilding part has a min_height tag, use it.
    roof_shape = way.querySelector('[k="roof:shape"]').getAttribute('v');
  }
  if (way.querySelector('[k="roof:height"]') !== null) {
    // if the building part has a min_height tag, use it.
    roof_height = parseFloat(way.querySelector('[k="roof:height"]').getAttribute('v'));
  }
  // Flat - Do Nothing
  if (roof_shape === "dome") {
  //   find largest circle within the way
  //   R, x, y
    const R = calculateWayRadius(way, xml_data);
    const geometry = new THREE.SphereGeometry( R, 100, 100, 0, 2 * Math.PI, Math.PI/2 );
    // Adjust the dome height if needed.
    if (roof_height === 0) {
      roof_height = R;
    }
    geometry.scale(1, roof_height / R, 1);
    material = getRoofMaterial(way);
    const roof = new THREE.Mesh( geometry, material );
    const elevation = calculateWayHeight(way) - calculateRoofHeight(way);
    const center = centroid(way, xml_data);
    roof.rotation.x = -Math.PI;
    roof.position.set(center[0], elevation, -1 * center[1]);
    scene.add( roof );
  } else if (roof_shape === "skillion") {
  } else if (roof_shape === "hipped") {
       // use straight skeleton algorithm.
  } else if (roof_shape === "gabled") {
    //const elements = way.getElementsByTagName("nd");
    //if (elements.length > 4) {
      // iterate through the way points and remove any 180degree.
    //}
    //if (elements.length === 4) {
      // find the longest edge
      // bisect the angle of longest and opposite
      //let geometry = new THREE.BufferGeometry()
      //const points = [
        // Face 1&2 if wall != no
        //new THREE.Vector3(-1, 1, -1),//c
        //new THREE.Vector3(-1, -1, 1),//b
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(1, 1, 1),//a 
        //new THREE.Vector3(1, -1, -1),//e 
        //new THREE.Vector3(-1, 1, -1),//d
        //roof
        //new THREE.Vector3(-1, -1, 1),//a
        //new THREE.Vector3(1, -1, -1),//b 
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(-1, 1, -1),//a
        //new THREE.Vector3(1, -1, -1),//e
        //new THREE.Vector3(-1, -1, 1),//f
        
        //new THREE.Vector3(-1, -1, 1),//d
        //new THREE.Vector3(1, -1, -1),//e
        //new THREE.Vector3(1, 1, 1),//f

        //new THREE.Vector3(-1, 1, -1),//d
        //new THREE.Vector3(1, -1, -1),//c
        //new THREE.Vector3(-1, -1, 1),//f
      //];
      //geometry.setFromPoints(points);
      //geometry.computeVertexNormals();
    //}
  } else if (roof_shape === "pyramidal") {
    const center = centroid(way, xml_data);
    // create sloped pieces up to the center from each edge.
  }
}

/**
 * Given a way in XML format, determine its height
 * Default to 3 meters unless building:levels or height are specified.
 */
function calculateWayHeight(way) {
  var height = 3;
  
  if (way.querySelector('[k="height"]') !== null) {
    // if the buiilding part has a helght tag, use it.
    height = way.querySelector('[k="height"]').getAttribute('v');
  } else if (way.querySelector('[k="building:levels"]') !== null) {
    // if not, use building:levels and 3 meters per level.
    height = 3 * way.querySelector('[k="building:levels"]').getAttribute('v');
  }
  
  return height;
}

function calculateWayMinHeight(way) {
  var min_height = 0;
  if (way.querySelector('[k="min_height"]') !== null) {
    // if the buiilding part has a min_helght tag, use it.
    min_height = way.querySelector('[k="min_height"]').getAttribute('v');
  } else if (way.querySelector('[k="building:min_level"]') !== null) {
    // if not, use building:min_level and 3 meters per level.
    min_height = 3 * way.querySelector('[k="building:min_level"]').getAttribute('v');
  }
  return min_height;
}

function calculateRoofHeight(way) {
  var height = 0;
  if (way.querySelector('[k="roof:height"]') !== null) {
    // if the buiilding part has a min_helght tag, use it.
    height = way.querySelector('[k="roof:height"]').getAttribute('v');
  } else if (way.querySelector('[k="roof:levels"]') !== null) {
    // if not, use building:min_level and 3 meters per level.
    min_height = 3 * way.querySelector('[k="roof:levels"]').getAttribute('v');
  }
  return height;
}

function calculateWayRadius(way, xml_data) {
  const elements = way.getElementsByTagName("nd");
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
 * Get the THREE.material for a given way
 *
 * This is complicated by inheritance
 */
function getMaterial(way) {
  var material_name = "";
  var color = "";
  if (way.querySelector('[k="building:material"]') !== null) {
    // if the buiilding part has a designated material tag, use it.
    material_name = way.querySelector('[k="building:material"]').getAttribute('v');
  }
  if (way.querySelector('[k="colour"]') !== null) {
    // if the buiilding part has a designated colour tag, use it.
    color = way.querySelector('[k="colour"]').getAttribute('v');
  }
  var material;
  if (material_name === 'glass') {
    if (color === "") {
      color = "0x00374a";
    }
    material = new THREE.MeshPhysicalMaterial( { 
      emissive: 0x011d57,
      reflectivity: .1409,
      clearcoat: 1
    } );
  } else if (material_name === 'copper') {
    if (color === "") {
      color = "0xa1c7b6";
    }
    material = new THREE.MeshLambertMaterial( { 
      emissive: 0x00000,
      reflectivity: 0
    } );
  } else {
    if (color === "") {
      color = "white";
    }
    material = new THREE.MeshLambertMaterial({
      emissive: 0x1111111
    });
  }
  material.color = color;
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
  var material;
  if (material_name === 'glass') {
    if (color === "") {
      color = "0x00374a";
    }
    material = new THREE.MeshPhysicalMaterial( { 
      emissive: 0x011d57,
      reflectivity: .1409,
      clearcoat: 1
    } );
  } else if (material_name === 'copper') {
    material = new THREE.MeshLambertMaterial( { 
      color: 0xa1c7b6,
      emissive: 0x00000,
      reflectivity: 0
    } );
  } else if (material_name === "concrete"){
    if (color === "") {
      color = "grey";
    }
    material = new THREE.MeshLambertMaterial({
      emissive: 0x1111111
    });
  } else {
    if (color === "") {
      color = "black";
    }
    material = new THREE.MeshLambertMaterial({
      emissive: 0x1111111
    });
  }
  material.color = color;
  return material;
}

  init();
  createScene();
  window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect =
    document.documentElement.clientWidth /
    document.documentElement.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  ); 
}
