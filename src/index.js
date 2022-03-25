import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.138.3/examples/jsm/controls/OrbitControls.js";
var camera;
var renderer;
var controls;
var scene = new THREE.Scene();

  let apis = {
    get_way: {
      api:"https://api.openstreetmap.org/api/0.6/way/",
      parameters:"/full",
      url: (way_id) => {
        return apis.get_way.api + way_id + apis.get_way.parameters
      }
    },
    bounding: {
      api:"https://api.openstreetmap.org/api/0.6/map?bbox=",
      url: (left, bottom, right, top) => {
        return apis.bounding.api + left + "," + bottom + "," + right + "," + top;
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
  renderer.domElement.style.top = 20;
  document.body.appendChild(renderer.domElement);
}

/**
 * Create the scene
 */
async function createScene() {
  while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  var shapes = [];
  shapes = await buildStructure();

  scene.add(shapes[0]);

  var pointLight = new THREE.PointLight(0x888888);
  pointLight.position.set(0, 0, 500);
  scene.add(pointLight);
  camera.position.set(0, -20, 5); // x y z
  
  controls = new OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

async function getData() {
  const way_id = document.getElementById('way_id').value;
  let response = await fetch(apis.get_way.url(way_id));
  let res = await response.text();
  return res;
}

async function getInnerData(left, bottom, right, top) {
  const way_id = document.getElementById('way_id').value;
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
  // Check that it is a building (<tag k="building" v="*"/> exists)
  // To Do.
  
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

  var shape = new THREE.Shape();
  var home_lon = 0;
  var home_lat = 0;

  // The way is a list of <nd ref=""> tags.
  // Use the ref to look up the lat/log data from the unordered <node id="" lat="" lon=""> tags.
  var lats = [];
  var lons = [];
  for (let i = 0; i < elements.length; i++) {
    var ref = elements[i].getAttribute("ref");
    var node = xml_data.querySelector('[id="' + ref + '"]');
    var lat = node.getAttribute("lat");
    var lon = node.getAttribute("lon");
    lats.push(lat);
    lons.push(lon);
    if (i === 0) {
      home_lat = lat;
      home_lon = lon;
      shape.moveTo(0, 0);
    } else {
      // 1 meter per unit.
      // Better to rotate instead of translate.
      const R = 6371 * 1000;   // Earth radius in m
      const circ = 2 * Math.PI * R;  // Circumference
      shape.lineTo((lat - home_lat) * circ / 360, (lon - home_lon) * circ / 360);
    }
  }
  // Extrude the outline to the correct height.
  var extrudeSettings = {
    bevelEnabled: false,
    depth: 3,
  };
  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0x0064ff,
    emissive: 0x1111111
  });

  var shapes = [];
  
  // Get all building parts within the building
  // Get max and min lat and log from the building
  const left = Math.min(...lons);
  const bottom = Math.min(...lats);
  const right = Math.max(...lons);
  const top = Math.max(...lats);
  
  // Get all objects in that area.
  let innerData = await getInnerData(left, bottom, right, top);
  let inner_xml_data = new window.DOMParser().parseFromString(innerData, "text/xml");
  
  // Filter to all ways
  const innerElements = inner_xml_data.getElementsByTagName("way");

  var k = 0;
  for (let j = 0; j < innerElements.length; j++) {
    if (innerElements[j].querySelector('[k="building:part"]')) {
      // k++;
      var building_levels = 1;
      // height
      // min_height
      // roof_height
      var building_min_level = 0;
      shape = new THREE.Shape();
      extrudeSettings = {
        bevelEnabled: false,
        depth: 3 * building_levels - building_min_level,
      };
      geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      shapes.push(new THREE.Mesh(geometry, material));
    }
  }
  console.log("BUILDING PARTS: " + k);
  
  // Add the outer building if no building parts have been rendered.
  if (k === 0) {
    shapes[0] = new THREE.Mesh(geometry, material);
  }
  return shapes
}

  init();
  createScene();
  window.addEventListener("resize", resize, false);

  const input = document.querySelector('[id="way_id"]');
  input.addEventListener('change', (e) => {  
    createScene();  
  });

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
