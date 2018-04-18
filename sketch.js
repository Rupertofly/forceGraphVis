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
function recordFrame() {
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
function recordSetup() {
  recorder = new CCapture({
    format: "webm",
    framerate: 60
  });
  canvasObject = document.getElementById("defaultCanvas0");
  recorder.start();
}
// #endregion
let friendData = {};
let nodePos = [];
let linkPos = [];
function preload() {}
var simulation;
let canvas;
var receivedData;
var graphGenerated;
var bNodeSelected = false;
var selectedNode = null;
var gui;
var dataIn;
let guiProps = {
  distance: 0,
  resetGraph: () => threshold()
};
let groupEnum = Object.freeze({
  Gender: 0,
  Age: 1,
  No_Of_Friends: 2,
  First_Language: 3,
  Likes: 4,
  Dislikes: 5
});
function setup() {
  gui = new dat.GUI();
  let strengthCutoff = gui.add(guiProps, "distance", 0, 1).step(0.05);
  let thresher = gui.add(guiProps, "resetGraph");
  let graphGenerated = false;
  receivedData = false;
  var config = {
    apiKey: "AIzaSyCZh7bDhcHYesPc0FeKxriL7EZ2Kopk2us",
    authDomain: "awesomesaucerupert.firebaseapp.com",
    databaseURL: "https://awesomesaucerupert.firebaseio.com",
    projectId: "awesomesaucerupert",
    storageBucket: "awesomesaucerupert.appspot.com",
    messagingSenderId: "465094389233"
  };

  firebase.initializeApp(config);
  let db = firebase.database();
  let ref = db.ref("firstExerciseData");
  ref.once(
    "value",
    data => {
      dataIn = data;
      formatData(data);
    },
    err => console.log(err)
  );
  let theWidth = windowWidth;
  if (windowWidth < 1000) theWidth = 1000;
  canvas = createCanvas(theWidth, windowHeight);
  // recordSetup();
}
function draw() {
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
    let sMax = -500;
    let sMin = 500;
    // check for selection

    bNodeSelected = false;
    selectedNode = null;
    for (let [k, c] of nodePos.entries()) {
      if (myMouseOver(c.x, c.y, 20)) {
        bNodeSelected = true;
        console.log("boom");

        selectedNode = friendData.nodes[k];
        break;
      }
    }
    fill(255);
    if (bNodeSelected) {
    }
    for (let [k, c] of linkPos.entries()) {
      let col = color(255);
      col.setAlpha(c.str * 200);
      if (bNodeSelected) {
        if (
          selectedNode.index === friendData.links[k].source.index ||
          selectedNode.index === friendData.links[k].target.index
        ) {
          col.setAlpha(200);
        } else {
          col.setAlpha(20);
        }
      }
      noFill();
      stroke(col);
      strokeWeight(c.str * 5);
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
          let l = friendData.nodes[k];
          fill(col);
          text(l.groupName, c.x - 20, c.y - 28);
          fill(col);
          text(l.label, c.x - 20, c.y - 12);
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
function formatData(data) {
  let friendDataArray = [];
  for (let k in data.val()) {
    friendDataArray.push(data.val()[k].data);
  }
  console.log(friendDataArray);
  let dataTypes = {
    Gender: ["Man", "Woman", "Non-Binary"],
    Age: ["18", "25", "30", "38", "45", "55", "75"],
    No_Of_Friends: ["2", "12", "50", "100", "200", "600", "1000", "2000"],
    First_Language: ["English", "Mandarin", "Thai", "Arabic", "Italian"],
    things: [
      "Superhero movies",
      "AFL",
      "Premier League Soccer",
      "Heavy Metal Music",
      "Memes",
      "Blazing 420",
      "Hip-hop Music",
      "Cocktail Bars",
      "Motorshows",
      "dogs"
    ]
  };
  let sortedData = {};
  for (let key in dataTypes) {
    if (key === "things") {
      sortedData["Likes"] = {};
      sortedData["Dislikes"] = {};
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
function graphData(inputData) {
  let output = {};
  output.links = [];
  for (let [groupName, group] of Object.entries(inputData)) {
    // check if object is a thing
    let isThing = isAThing(groupName);
    for (let [element, eLinks] of Object.entries(group)) {
      let originN;
      if (isThing !== false) originN = isThing + "_" + element;
      else originN = element;
      for (let [tGroupName, tGroup] of Object.entries(eLinks)) {
        let tIsThing = isAThing(tGroupName);
        for (let [tElement, strength] of Object.entries(tGroup)) {
          let targetN;
          if (tIsThing !== false) targetN = tIsThing + "_" + tElement;
          else targetN = tElement;
          if (strength <= -2) continue;
          if (originN === targetN) continue;
          let link = {
            source: originN,
            target: targetN,
            strength: map(strength, -2, 12, 0, 1)
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
  let sMax = -500;
  let sMin = 500;
  for (let a of output.links) {
    if (a.strength > sMax) sMax = a.strength;
    if (a.strength < sMin) sMin = a.strength;
  }
  console.log("Between" + sMin + " and " + sMax);
  output.nodes = [];

  for (let [groupName, group] of Object.entries(inputData)) {
    // check if object is a thing
    let isThing = isAThing(groupName);
    for (let element of Object.keys(group)) {
      let originN;
      if (isThing !== false) originN = isThing + "_" + element;
      else originN = element;
      let node = {
        id: originN,
        group: groupEnum[groupName],
        groupName: groupName,
        label: element,
        x: 0,
        y: 0
      };
      output.nodes.push(node);
    }
  }
  return output;
}
function isAThing(group) {
  let isAThing;
  if (group === "Likes") isAThing = "L";
  else if (group === "Dislikes") isAThing = "D";
  else isAThing = false;
  return isAThing;
}
function graphMaker() {
  nodePos = [];
  linkPos = [];
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

  simulation = d3.forceSimulation();
  let repelForce = d3
    .forceManyBody()
    .strength(-100)
    .distanceMax(100)
    .distanceMin(1);
  simulation.force("charge", repelForce);
  simulation.force("center", d3.forceCenter(windowWidth / 2, windowHeight / 2));
  simulation.nodes(friendData.nodes).on("tick", simTick);
  simulation.force(
    "link",
    d3
      .forceLink()
      .id(link => link.id)
      .links(friendData.links)
      .strength(link => {
        let o = 0;
        let t = 0;
        for (let c of friendData.links) {
          if (c.origin === link.origin) o++;
          if (c.target === link.origin) o++;
          if (c.origin === link.target) t++;
          if (c.target === link.target) t++;
        }
        return link.strength / Math.min(o, t);
      })
  );

  friendData.linkedByIndex = {};
  for (let i = 0; i < friendData.nodes.length; i++) {
    friendData.linkedByIndex[i + "," + i] = 1;
  }
  friendData.links.forEach(d => {
    friendData.linkedByIndex[d.source.index + "," + d.target.index] = 1;
  });

  friendData.neigbouring = function(a, b) {
    return friendData.linkedByIndex[a.index + "," + b.index];
  };
  simulation.restart();
}
function simTick() {
  for (let i = 0; i < nodePos.length; i++) {
    nodePos[i].x = friendData.nodes[i].x;
    nodePos[i].y = friendData.nodes[i].y;
    if (friendData.nodes[i].x < 1) friendData.nodes[i].x = 1;
    if (friendData.nodes[i].x > width - 30) friendData.nodes[i].x = width - 30;
    if (friendData.nodes[i].y < 1) friendData.nodes[i].y = 1;
    if (friendData.nodes[i].y > height - 30) {
      friendData.nodes[i].y = height - 30;
    }
  }
  for (let i = 0; i < linkPos.length; i++) {
    linkPos[i].x1 = friendData.links[i].source.x;
    linkPos[i].y1 = friendData.links[i].source.y;
    linkPos[i].x2 = friendData.links[i].target.x;
    linkPos[i].y2 = friendData.links[i].target.y;
  }
}
function myMouseOver(x, y, rad) {
  return (
    mouseX > x - rad && mouseX < x + rad && mouseY > y - rad && mouseY < y + rad
  );
}
function threshold() {
  friendData = {};
  formatData(dataIn);
  let graphRec = JSON.parse(JSON.stringify(friendData));
  friendData.links.splice(0, friendData.links.length);

  for (var i = 0; i < graphRec.links.length; i++) {
    if (graphRec.links[i].strength > guiProps.distance) {
      friendData.links.push(graphRec.links[i]);
    }
  }
  graphMaker();
}
