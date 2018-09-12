/**
 * @file Leaflet Treering
 * @author Malik Nusseibeh <nusse007@umn.edu>
 * @version 1.0.0
 */

'use strict';

/**
 * A leaflet treering object
 * @constructor
 * @param {Leaflet Map Object} viewer - the leaflet map object that will used
 * as a viewer for treering image.
 * @param {string} basePath - this is a path to the treering image folder
 * @param {object} options - 
 */
function LTreering(viewer, basePath, options) {
  this.viewer = viewer;
  this.basePath = basePath;

  //options
  this.ppm = options.ppm || 468;
  this.saveURL = options.saveURL || '';
  this.savePermission = options.savePermission || false;
  this.popoutUrl = options.popoutUrl || null;
  //this.initialData = options.initialData || {};
  this.assetName = options.assetName || 'N/A';
  this.hasLatewood = options.hasLatewood || true;

  if (options.ppm === 0) {
    alert('Please set up PPM in asset metadata. PPM will default to 468.');
  }

  this.mData = new MeasurementData(options.initialData);
  this.autoscroll = new Autoscroll(this.viewer);
  this.mouseLine = new InteractiveMouse(this);
  this.visualAsset = new VisualAsset(this);
  
  this.popout = new Popout(this);
  
//  this.undo = new Undo(this);
}


/**
 * Load the interface of the treering viewer
 */
LTreering.prototype.loadInterface = function () {
  var self = this;
  console.log(self);

  self.autoscroll.on();
  self.viewer.on('resize', function () {
    self.autoscroll.reset();
  });

  $('#map').css('cursor', 'default');
  
  // if popout is opened display measuring tools
  if (window.name == 'popout') {
//    miniMap.addTo(Lt.map);

//    data.btn.addTo(Lt.map);
//    annotation.btn.addTo(Lt.map);
//    setYear.btn.addTo(Lt.map);
//    createBar.addTo(Lt.map);
//    editBar.addTo(Lt.map);
//    fileBar.addTo(Lt.map);
//    undoRedoBar.addTo(Lt.map);
  } else {
    self.popout.btn.addTo(self.viewer);
//    data.btn.addTo(Lt.map);
//    fileBar.addTo(Lt.map);
  }

  //L.control.layers(baseLayer, overlay).addTo(self.viewer);
  
  self.loadData();
  
};


/**
 * Load the JSON data attached to the treering image
 */
LTreering.prototype.loadData = function () {
  this.visualAsset.reload();
//  annotation.reload();
//
//  setYear.disable();
//  annotation.disable();
//  edit.collapse();
//  create.collapse();
};

/*******************************************************************************/



/**
 * A measurement data object
 * @constructor
 * @param {object} dataObject -
 */
function MeasurementData(dataObject) {
  this.saveDate = dataObject.saveDate || {};
  this.index = dataObject.index || 0;
  this.year = dataObject.year || 0;
  this.earlywood = dataObject.earlywood || true;
  this.points = dataObject.points || {};
  this.annotations = dataObject.annotations || {};
}

/**
 * A mouse autoscroll object
 * @constructor
 * @param {Leaflet Map Object} LtViewer - a refrence to the leaflet map object
 */
function Autoscroll(LtViewer) {
  /**
  * A method to turn on autoscroll based on viewer dimmensions
  */
  Autoscroll.prototype.on = function () {
    //map scrolling
    var mapSize = LtViewer.getSize();  // Map size used for map scrolling
    var mousePos = 0;         // An initial mouse position

    LtViewer.on('mousemove', function (e) {
      var oldMousePos = mousePos;    // Save the old mouse position
      mousePos = e.containerPoint;  // Container point of the mouse
//      var mouseLatLng = e.latlng;     // latLng of the mouse
//      var mapCenter = LtViewer.getCenter();  // Center of the map

      //left bound of the map
      if (mousePos.x <= 40 && mousePos.y > 450 &&
          oldMousePos.x > mousePos.x) {
        LtViewer.panBy([-200, 0]);
      }
      //right bound of the map
      if (mousePos.x + 40 > mapSize.x &&
          mousePos.y > 100 && oldMousePos.x < mousePos.x) {
        LtViewer.panBy([200, 0]);
      }
      //upper bound of the map
      if (mousePos.x > 100 && mousePos.x + 100 < mapSize.x &&
          mousePos.y < 40 && oldMousePos.y > mousePos.y) {
        LtViewer.panBy([0, -70]);
      }
      //lower bound of the map
      if (mousePos.x >= 40 && mousePos.y > mapSize.y - 40 &&
          oldMousePos.y < mousePos.y) {
        LtViewer.panBy([0, 70]);
      }
    });
  };

  /**
  * A method to turn off autoscroll
  */
  Autoscroll.prototype.off = function () {
    LtViewer.off('mousemove');
  };

  /**
  * A method to reset autoscroll when the viewer's dimmensions are resized
  */
  Autoscroll.prototype.reset = function () {
    this.off();
    this.on();
  };
}


// Colored icons for points
function MarkerIcon(color, LtBasePath) {

  var colors = {
    'light_blue': { 'path': 'images/light_blue_tick_icon.png',
                    'size': [32, 48] },
    'dark_blue' : { 'path': 'images/dark_blue_tick_icon.png',
                    'size': [32, 48] },
    'white'     : { 'path': 'images/white_tick_icon.png',
                    'size': [32, 48] },
    'red'       : { 'path': 'images/red_dot_icon.png',
                    'size': [12, 12] }
  };

  return L.icon({
    iconUrl : LtBasePath + colors[color].path,
    iconSize: colors[color].size
  });

    // light_blue: L.icon({
    //   iconUrl: Lt.basePath + 'images/light_blue_tick_icon.png',
    //   iconSize: [32, 48] // size of the icon
    // }),
    // dark_blue: L.icon({
    //   iconUrl: Lt.basePath + 'images/dark_blue_tick_icon.png',
    //   iconSize: [32, 48] // size of the icon
    // }),
    // white: L.icon({
    //   iconUrl: Lt.basePath + 'images/white_tick_icon.png',
    //   iconSize: [32, 48] // size of the icon
    // }),
    // red: L.icon({
    //   iconUrl: Lt.basePath + 'images/red_dot_icon.png',
    //   iconSize: [12, 12] // size of the icon
    // }),
}

/**
 * An object for the line created between a click location and the cursor
 * @constructor
 * @param {LTreering} Lt - a refrence to the leaflet treering object
 */
function InteractiveMouse(Lt) {
  
  this.layer = L.layerGroup().addTo(Lt.viewer);
  
  /**
  * A method to create a new line from a given latLng
  * @param {Leatlet LatLng Object} latLng - the latLng coordinate on the viewer to
  * create a line from
  */
  InteractiveMouse.prototype.from = function (latLng) {
    var self = this;
    
    $(Lt.viewer._container).mousemove(function(e) {
      if (Lt.create.dataPoint.active) {
        self.layer.clearLayers();
        var mousePoint = Lt.viewer.mouseEventToLayerPoint(e);
        var mouseLatLng = Lt.viewer.mouseEventToLatLng(e);
        var point = Lt.viewer.latLngToLayerPoint(latLng);

        /* Getting the four points for the h bars,
      this is doing 90 degree rotations on mouse point */
        var newX = mousePoint.x +
            (point.x - mousePoint.x) * Math.cos(Math.PI / 2) -
            (point.y - mousePoint.y) * Math.sin(Math.PI / 2);
        var newY = mousePoint.y +
            (point.x - mousePoint.x) * Math.sin(Math.PI / 2) +
            (point.y - mousePoint.y) * Math.cos(Math.PI / 2);
        var topRightPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        var newX = mousePoint.x +
            (point.x - mousePoint.x) * Math.cos(Math.PI / 2 * 3) -
            (point.y - mousePoint.y) * Math.sin(Math.PI / 2 * 3);
        var newY = mousePoint.y +
            (point.x - mousePoint.x) * Math.sin(Math.PI / 2 * 3) +
            (point.y - mousePoint.y) * Math.cos(Math.PI / 2 * 3);
        var bottomRightPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        //doing rotations 90 degree rotations on latlng
        var newX = point.x +
            (mousePoint.x - point.x) * Math.cos(Math.PI / 2) -
            (mousePoint.y - point.y) * Math.sin(Math.PI / 2);
        var newY = point.y +
            (mousePoint.x - point.x) * Math.sin(Math.PI / 2) +
            (mousePoint.y - point.y) * Math.cos(Math.PI / 2);
        var topLeftPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        var newX = point.x +
            (mousePoint.x - point.x) * Math.cos(Math.PI / 2 * 3) -
            (mousePoint.y - point.y) * Math.sin(Math.PI / 2 * 3);
        var newY = point.y +
            (mousePoint.x - point.x) * Math.sin(Math.PI / 2 * 3) +
            (mousePoint.y - point.y) * Math.cos(Math.PI / 2 * 3);
        var bottomLeftPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        if (Lt.mData.earlywood || !Lt.hasLatewood) {
          var color = '#00BCD4';
        } else {
          var color = '#00838f';
        }

        self.layer.addLayer(L.polyline([latLng, mouseLatLng],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));
        self.layer.addLayer(L.polyline([topLeftPoint, bottomLeftPoint],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));
        self.layer.addLayer(L.polyline([topRightPoint, bottomRightPoint],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));
      }
    });
  }
}


/**
 * An object for all visual assets on the map such as markers and lines
 * @constructor
 * @param {LTreering} Lt - a refrence to the leaflet treering object
 */
function VisualAsset(Lt) {
  this.markers = new Array();
  this.lines = new Array();
  this.markerLayer = L.layerGroup().addTo(Lt.viewer);
  this.lineLayer = L.layerGroup().addTo(Lt.viewer);
  this.previousLatLng = undefined;
  
  
  /**
   * A method to reload all visual assets on the viewer
   */
  VisualAsset.prototype.reload = function () {
    //erase the markers
    this.markerLayer.clearLayers();
    this.markers = new Array();
    //erase the lines
    this.lineLayer.clearLayers();
    this.lines = new Array();

    //plot the data back onto the map
    if (Lt.mData.points !== undefined) {
      Object.values(Lt.mData.points).map(function(e, i) {
        if (e != undefined) {
          Lt.visualAsset.newLatLng(Lt.mData.points, i, e.latLng);
        }
      });
    }
  };
  
  /**
   * A method used to create new markers and lines on the viewer
   * @param {Array} points - 
   * @param {int} i - index of points
   * @param {Leaflet LatLng Object} latLng -
   */
  VisualAsset.prototype.newLatLng = function (points, i, latLng) {
    leafLatLng = L.latLng(latLng);

    if (window.name === 'popout') {
      var draggable = true;
    } else {
      var draggable = false;
    }

    var draggable = true;

    //check if index is the start point
    if (points[i].start) {
      var marker = L.marker(leafLatLng, {icon: new MarkerIcon('white', Lt.basePath),
        draggable: draggable, title: 'Start Point', riseOnHover: true});
    } else if (p[i].break) { //check if point is a break
      var marker = L.marker(leafLatLng, {icon: new MarkerIcon('white', Lt.basePath),
        draggable: draggable, title: 'Break Point', riseOnHover: true});
    } else if (Lt.hasLatewood) { //check if point is earlywood
      if (points[i].earlywood) {
        var marker = L.marker(leafLatLng, {icon: new MarkerIcon('light_blue', Lt.basePath),
          draggable: draggable, title: 'Year ' + points[i].year +
              ', earlywood', riseOnHover: true});
      } else { //otherwise it's latewood
        var marker = L.marker(leafLatLng, {icon: new MarkerIcon('dark_blue', Lt.basePath),
          draggable: draggable, title: 'Year ' + points[i].year +
            ', latewood',
          riseOnHover: true});
      }
    } else {
      var marker = L.marker(leafLatLng, {icon: new MarkerIcon('light_blue', Lt.basePath),
        draggable: draggable, title: 'Year ' + points[i].year,
        riseOnHover: true});
    }

    this.markers[i] = marker;   //add created marker to marker_list
    var self = this;

    //tell marker what to do when being dragged
    this.markers[i].on('drag', function(e) {
      if (!points[i].start) {
        self.lineLayer.removeLayer(self.lines[i]);
        self.lines[i] =
            L.polyline([self.lines[i]._latlngs[0], e.target._latlng],
            { color: self.lines[i].options.color,
              opacity: '.75', weight: '3'});
        self.lineLayer.addLayer(self.lines[i]);
      }
      if (self.lines[i + 1] !== undefined) {
        self.lineLayer.removeLayer(self.lines[i + 1]);
        self.lines[i + 1] =
            L.polyline([e.target._latlng, self.lines[i + 1]._latlngs[1]],
            { color: self.lines[i + 1].options.color,
              opacity: '.75',
              weight: '3'
            });
        self.lineLayer.addLayer(self.lines[i + 1]);
      } else if (self.lines[i + 2] !== undefined && !points[i + 1].start) {
        self.lineLayer.removeLayer(self.lines[i + 2]);
        self.lines[i + 2] =
            L.polyline([e.target._latlng, self.lines[i + 2]._latlngs[1]],
            { color: self.lines[i + 2].options.color,
              opacity: '.75',
              weight: '3' });
        self.lineLayer.addLayer(self.lines[i + 2]);
      }
    });

    //tell marker what to do when the draggin is done
//    this.markers[i].on('dragend', function(e) {
//      undo.push();
//      points[i].latLng = e.target._latlng;
//    });

//    //tell marker what to do when clicked
//    this.markers[i].on('click', function(e) {
//      if (Lt.edit.deletePoint.active) {
//        Lt.edit.deletePoint.action(i);
//      }
//      console.log(points[i]);
//
//      if (Lt.edit.cut.active) {
//        if (edit.cut.point != -1) {
//          Lt.edit.cut.action(edit.cut.point, i);
//        } else {
//          Lt.edit.cut.point = i;
//        }
//      }
//      if (Lt.edit.addZeroGrowth.active) {
//        if ((points[i].earlywood && Lt.hasLatewood) || points[i].start ||
//            points[i].break) {
//          alert('Missing year can only be placed at the end of a year!');
//        } else {
//          Lt.edit.addZeroGrowth.action(i);
//        }
//      }
//      if (Lt.edit.addBreak.active) {
//        Lt.edit.addBreak.action(i);
//      }
//      if (setYear.active) {
//        setYear.action(i);
//      }
//    });

    //drawing the line if the previous point exists
    if (points[i - 1] != undefined && !points[i].start) {
      if (points[i].earlywood || !Lt.hasLatewood || 
          (!points[i - 1].earlywood && points[i].break)) {
        var color = '#00BCD4';
      } else {
        var color = '#00838f';
      }
      this.lines[i] =
          L.polyline([points[i - 1].latLng, leafLatLng],
          {color: color, opacity: '.75', weight: '3'});
      this.lineLayer.addLayer(this.lines[i]);
    }

    this.previousLatLng = leafLatLng;
    //add the marker to the marker layer
    this.markerLayer.addLayer(this.markers[i]);   
  };
}


/*****************************************************************************/

/**
 * A popout object
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Popout(Lt) {
  var self = this;
  
  this.btn = L.easyButton({
    states: [{
      stateName: 'popout',
      icon: '<i class="material-icons md-18">launch</i>',
      title: 'Popout Window',
      onClick: function() {
        window.open(Lt.popoutUrl, 'popout',
                    'location=yes,height=600,width=800,scrollbars=yes,status=yes');
      }
    }]
  })
}

///**
// * A undo button
// @param {Ltreering} Lt - Leaflet treering object
// */
//function Undo(Lt) {
//  var self = this;
//  
//  this.stack = new Array();
//  
//  this.push = function() {
//    self.btn.enable();
//    Lt.redo.btn.disable();
//    Lt.redo.stack.length = 0;
//    var restore_points = JSON.parse(JSON.stringify(points));
//    self.stack.push({'year': year, 'earlywood': earlywood,
//      'index': index, 'points': restore_points });
//  };
//  
//  this.pop = function() {
//    if (self.stack.length > 0) {
//      if (points[index - 1].start) {
//        create.dataPoint.disable();
//      } else {
//        interactiveMouse.hbarFrom(points[index - 2].latLng);
//      }
//
//      redo.btn.enable();
//      var restore_points = JSON.parse(JSON.stringify(points));
//      redo.stack.push({'year': year, 'earlywood': earlywood,
//        'index': index, 'points': restore_points});
//      dataJSON = self.stack.pop();
//
//      points = JSON.parse(JSON.stringify(dataJSON.points));
//
//      index = dataJSON.index;
//      year = dataJSON.year;
//      earlywood = dataJSON.earlywood;
//
//      visualAsset.reload();
//
//      if (self.stack.length == 0) {
//        self.btn.disable();
//      }
//    }
//  };
//  
//  this.btn = L.easyButton({
//    states: [
//      {
//        stateName: 'undo',
//        icon: '<i class="material-icons md-18">undo</i>',
//        title: 'Undo',
//        onClick: function(btn, map) {
//          self.pop();
//        }
//      }]
//  });
//}


