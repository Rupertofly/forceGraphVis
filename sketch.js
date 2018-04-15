// @ts-check
/* eslint no-undef: 0 */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "setup|draw|preload|recordFrame|recordSetup" }] */
/* eslint-disable */
if (!Object.entries)
  Object.entries = function(obj) {
    var ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray = new Array(i); // preallocate the Array
    while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };
function checkNested(obj /*, level1, level2, ... levelN*/) {
  var args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0; i < args.length; i++) {
    if (!obj || !obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
}
/* eslint-enable */
// #region Recording
// For Recording

var recorder;
var canvasObject;
var lastFrame = 60;

/**
 * Adds A frame to the recording and saves if at end
 *
 */
function recordFrame () {
  if (frameCount <= lastFrame) {
    recorder.capture(canvasObject);
    if (frameCount === lastFrame) {
      recorder.stop();
      recorder.save();
    }
  }
}
/**
 * Set's up Recording
 *
 */
function recordSetup () {
  recorder = new CCapture({
    format: 'webm',
    framerate: 60
  });
  canvasObject = document.getElementById('defaultCanvas0');
  recorder.start();
}
// #endregion
let friendData = {};
let nodePos = [];
let linkPos = [];
function preload () {}
var simulation;
let canvas;
var receivedData;
var graphGenerated;
var bNodeSelected = false;
var selectedNode = null;
let groupEnum = Object.freeze({
  Gender: 0,
  Age: 1,
  No_Of_Friends: 2,
  First_Language: 3,
  Likes: 4,
  Dislikes: 5
});
function setup () {
  graphGenerated = false;
  receivedData = false;
  var config = {
    apiKey: 'AIzaSyCZh7bDhcHYesPc0FeKxriL7EZ2Kopk2us',
    authDomain: 'awesomesaucerupert.firebaseapp.com',
    databaseURL: 'https://awesomesaucerupert.firebaseio.com',
    projectId: 'awesomesaucerupert',
    storageBucket: 'awesomesaucerupert.appspot.com',
    messagingSenderId: '465094389233'
  };

  firebase.initializeApp(config);
  let db = firebase.database();
  let ref = db.ref('firstExerciseData');
  ref.once(
    'value',
    data => {
      formatData(data);
    },
    err => console.log(err)
  );
  canvas = createCanvas(800, 600);
  // recordSetup();
}
function draw () {
  background(getC(hues.warms, 2).hex);
  if (receivedData) {
    background(getC(hues.neutrals, 1).hex);

    if (!graphGenerated) {
      console.log(friendData.nodes);
      graphMaker();
      graphGenerated = true;
    }
  }
  if (graphGenerated) {
    // check for selection
    bNodeSelected = false;
    selectedNode = null;
    for (let [k, c] of nodePos.entries()) {
      if (myMouseOver(c.x, c.y, 20)) {
        bNodeSelected = true;
        console.log('boom');

        selectedNode = friendData.nodes[k];
        break;
      }
    }
    fill(255);
    if (bNodeSelected) {
      text(selectedNode.groupName, 50, 50);
      text(selectedNode.label, 50, 70);
    }
    for (let [k, c] of linkPos.entries()) {
      let col = color(255);
      if (bNodeSelected) {
        if (
          selectedNode.index === friendData.links[k].source.index ||
          selectedNode.index === friendData.links[k].target.index
        ) {
          col.setAlpha(255);
        } else {
          col.setAlpha(20);
        }
      }
      stroke(col);
      strokeWeight(c.str);
      line(c.x1, c.y1, c.x2, c.y2);
    }
    for (let [k, c] of nodePos.entries()) {
      noStroke();
      let hex = getC(3 + c.group * 2, 4).hex;
      let col = color(hex);
      col.setAlpha(c.opacity * 255);
      if (bNodeSelected) {
        if (
          friendData.neigbouring(selectedNode, friendData.nodes[k]) ||
          friendData.neigbouring(friendData.nodes[k], selectedNode)
        ) {
          col.setAlpha(255);
        } else {
          col.setAlpha(20);
        }
      }
      fill(col);
      ellipse(c.x, c.y, 20);
    }
  }
  if (mouseIsPressed) {
    ellipse(mouseX, mouseY, 30, 30);
  }

  // recordFrame();
}
function formatData (data) {
  let friendDataArray = [];
  for (let k in data.val()) {
    friendDataArray.push(data.val()[k].data);
  }
  console.log(friendDataArray);
  let dataTypes = {
    Gender: ['Man', 'Woman', 'Non-Binary'],
    Age: ['18', '25', '30', '38', '45', '55', '75'],
    No_Of_Friends: ['2', '12', '50', '100', '200', '600', '1000', '2000'],
    First_Language: ['English', 'Mandarin', 'Thai', 'Arabic', 'Italian'],
    things: [
      'Superhero movies',
      'AFL',
      'Premier League Soccer',
      'Heavy Metal Music',
      'Memes',
      'Blazing 420',
      'Hip-hop Music',
      'Cocktail Bars',
      'Motorshows',
      'dogs'
    ]
  };
  let sortedData = {};
  for (let key in dataTypes) {
    if (key === 'things') {
      sortedData['Likes'] = {};
      sortedData['Dislikes'] = {};
      for (let valKey in dataTypes[key]) {
        sortedData.Likes[dataTypes[key][valKey]] = {};
        sortedData.Dislikes[dataTypes[key][valKey]] = {};
      }
    } else {
      sortedData[key] = {};
      for (let valKey in dataTypes[key]) {
        sortedData[key][dataTypes[key][valKey]] = {};
      }
    }
  }
  console.log(sortedData);
  for (let entry of friendDataArray) {
    for (let question of entry) {
      let offset = question.answer === 1 ? 1 : -1;
      // person 1
      let p = question.p2;
      for (let v of Object.values(question.p1)) {
        for (let t of Object.values(p)) {
          if (sortedData[v.trait][v.val][t.trait] === undefined) {
            sortedData[v.trait][v.val][t.trait] = {};
          }
          if (sortedData[v.trait][v.val][t.trait][t.val] === undefined) {
            sortedData[v.trait][v.val][t.trait][t.val] = 0;
          }
          sortedData[v.trait][v.val][t.trait][t.val] += offset;
        }
      }
      // person 2
      p = question.p1;
      for (let v of Object.values(question.p2)) {
        for (let t of Object.values(p)) {
          if (sortedData[v.trait][v.val][t.trait] === undefined) {
            sortedData[v.trait][v.val][t.trait] = {};
          }
          if (sortedData[v.trait][v.val][t.trait][t.val] === undefined) {
            sortedData[v.trait][v.val][t.trait][t.val] = 0;
          }
          sortedData[v.trait][v.val][t.trait][t.val] += offset;
        }
      }
    }
  }
  console.log(sortedData);
  friendData = graphData(sortedData);
  receivedData = true;
}
function graphData (inputData) {
  let output = {};
  output.links = [];
  for (let [groupName, group] of Object.entries(inputData)) {
    // check if object is a thing
    let isThing = isAThing(groupName);
    for (let [element, eLinks] of Object.entries(group)) {
      let originN;
      if (isThing !== false) originN = isThing + '_' + element;
      else originN = element;
      for (let [tGroupName, tGroup] of Object.entries(eLinks)) {
        let tIsThing = isAThing(tGroupName);
        for (let [tElement, strength] of Object.entries(tGroup)) {
          let targetN;
          if (tIsThing !== false) targetN = tIsThing + '_' + tElement;
          else targetN = tElement;
          if (strength <= 1) continue;
          if (originN === targetN) continue;
          let link = {
            source: originN,
            target: targetN,
            strength: strength / 2
          };
          if (
            output.links.some(e => e.target === originN && e.source === targetN)
          ) {
            continue;
          }

          output.links.push(link);
        }
      }
    }
  }
  output.nodes = [];

  for (let [groupName, group] of Object.entries(inputData)) {
    // check if object is a thing
    let isThing = isAThing(groupName);
    for (let element of Object.keys(group)) {
      let originN;
      if (isThing !== false) originN = isThing + '_' + element;
      else originN = element;
      let node = {
        id: originN,
        group: groupEnum[groupName],
        groupName: groupName,
        label: element
      };
      output.nodes.push(node);
    }
  }
  return output;
}
function isAThing (group) {
  let isAThing;
  if (group === 'Likes') isAThing = 'L';
  else if (group === 'Dislikes') isAThing = 'D';
  else isAThing = false;
  return isAThing;
}
function graphMaker () {
  for (let n of friendData.nodes) {
    nodePos.push({
      id: n.id,
      x: 0,
      y: 0,
      group: n.group,
      opacity: 1
    });
  }

  for (let n of friendData.links) {
    linkPos.push({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      str: n.strength,
      opacity: 1
    });
  }

  simulation = d3
    .forceSimulation()
    .force('charge', d3.forceManyBody().strength(-1800))
    .force('center', d3.forceCenter(width / 2, height / 2));

  simulation.nodes(friendData.nodes).on('tick', simTick);
  simulation.force(
    'link',
    d3
      .forceLink()
      .id(link => link.id)
      .strength(link => link.strength)
  );
  simulation.force('link').links(friendData.links);
  friendData.linkedByIndex = {};
  for (let i = 0; i < friendData.nodes.length; i++) {
    friendData.linkedByIndex[i + ',' + i] = 1;
  }
  friendData.links.forEach(d => {
    friendData.linkedByIndex[d.source.index + ',' + d.target.index] = 1;
  });

  friendData.neigbouring = function (a, b) {
    return friendData.linkedByIndex[a.index + ',' + b.index];
  };
}
function simTick () {
  for (let i = 0; i < nodePos.length; i++) {
    nodePos[i].x = friendData.nodes[i].x;
    nodePos[i].y = friendData.nodes[i].y;
  }
  for (let i = 0; i < linkPos.length; i++) {
    linkPos[i].x1 = friendData.links[i].source.x;
    linkPos[i].y1 = friendData.links[i].source.y;
    linkPos[i].x2 = friendData.links[i].target.x;
    linkPos[i].y2 = friendData.links[i].target.y;
  }
}
function myMouseOver (x, y, rad) {
  return (
    mouseX > x - rad && mouseX < x + rad && mouseY > y - rad && mouseY < y + rad
  );
}
