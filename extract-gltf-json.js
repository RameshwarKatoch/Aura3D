const fs = require('fs');

const buffer = fs.readFileSync('public/male_base_muscular_anatomy.glb');
const magic = buffer.toString('utf8', 0, 4);
if (magic !== 'glTF') {
  console.error('Not a valid GLB file');
  process.exit(1);
}

const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.toString('utf8', 16, 20);

if (chunkType !== 'JSON') {
  console.error('First chunk is not JSON');
  process.exit(1);
}

const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonString);

console.log('Meshes:');
if (gltf.meshes) {
  gltf.meshes.forEach((mesh, index) => {
    console.log(`[${index}] ${mesh.name}`);
  });
} else {
  console.log('No meshes found.');
}

console.log('\nNodes:');
if (gltf.nodes) {
  gltf.nodes.forEach((node, index) => {
    console.log(`[${index}] ${node.name} (mesh: ${node.mesh})`);
  });
} else {
  console.log('No nodes found.');
}
