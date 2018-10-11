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
  this.meta = {
    'ppm': options.ppm || 468,
    'saveURL': options.saveURL || '',
    'savePermission': options.savePermission || false,
    'popoutUrl': options.popoutUrl || null,
    'assetName': options.assetName || 'N/A',
    'hasLatewood': options.hasLatewood || true,
  }

  if (options.ppm === 0) {
    alert('Please set up PPM in asset metadata. PPM will default to 468.');
  }

  this.data = new MeasurementData(options.initialData);
  this.autoscroll = new Autoscroll(this.viewer);
  this.mouseLine = new InteractiveMouse(this);
  this.visualAsset = new VisualAsset(this);
  
  this.popout = new Popout(this);
  this.undo = new Undo(this);
  this.redo = new Redo(this);
  
  this.dating = new Dating(this);
  
  this.createPoint = new CreatePoint(this);
  this.zeroGrowth = new CreateZeroGrowth(this);
  this.createBreak = new CreateBreak(this);
  
  this.deletePoint = new DeletePoint(this);
  this.cut = new Cut(this);
  this.insertPoint = new InsertPoint(this);
  this.insertZeroGrowth = new InsertZeroGrowth(this);
  this.insertBreak = new InsertBreak(this);
  
  this.undoRedoBar = new L.easyBar([this.undo.btn, this.redo.btn]);
  this.createTools = new ButtonBar(this, [this.createPoint.btn, this.zeroGrowth.btn, this.createBreak.btn], '<i class="material-icons md-18">straighten</i>', 'Create new measurement point');
  this.editTools = new ButtonBar(this, [this.deletePoint.btn, this.cut.btn, this.insertPoint.btn, this.insertZeroGrowth.btn, this.insertBreak.btn], '<i class="material-icons md-18">edit</i>', 'Edit and delete data points from the series');
  
  this.viewData = new ViewData(this);
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
    
//    editBar.addTo(Lt.map);
//    fileBar.addTo(Lt.map);
//    undoRedoBar.addTo(Lt.map);
  } else {
    self.popout.btn.addTo(self.viewer);
    self.viewData.btn.addTo(self.viewer);
    self.dating.btn.addTo(self.viewer);
    self.createTools.bar.addTo(self.viewer);
    self.editTools.bar.addTo(self.viewer);
    self.undoRedoBar.addTo(self.viewer);
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
};

/*******************************************************************************/



/**
 * A measurement data object
 * @constructor
 * @param {object} dataObject -
 */
function MeasurementData(dataObject) {
  var self = this;
  
  this.saveDate = dataObject.saveDate || {};
  this.index = dataObject.index || 0;
  this.year = dataObject.year || 0;
  this.earlywood = dataObject.earlywood || true;
  this.points = dataObject.points || {};
  this.annotations = dataObject.annotations || {};
  
  MeasurementData.prototype.newPoint = function(start, latLng, hasLatewood) {
    if (start) {
      this.points[this.index] = {'start': true, 'skip': false, 'break': false, 'latLng': latLng};
    } else {
      this.points[this.index] = {'start': false, 'skip': false, 'break': false, 'year': this.year, 'earlywood': this.earlywood, 'latLng': latLng};
      if (hasLatewood) {
        if (this.earlywood) {
          this.earlywood = false;
        } else {
          this.earlywood = true;
          this.year++;
        }
      } else {
        this.year++;
      }
    }
    this.index++;
  };
  
  MeasurementData.prototype.deletePoint = function(i, hasLatewood) {
    if (this.points[i].start) {
      if (this.points[i - 1] != undefined && this.points[i - 1].break) {
        i--;
        var second_points = Object.values(this.points).splice(i + 2, this.index - 1);
        var shift = this.points[i + 2].year - this.points[i - 1].year - 1;
        second_points.map(function(e) {
          e.year -= shift;
          this.points[i] = e;
          i++;
        });
        this.year -= shift;
        this.index = index - 2;
        delete this.points[index];
        delete this.points[index + 1];
      } else {
        var second_points = Object.values(this.points).splice(i + 1, this.index - 1);
        second_points.map(function(e) {
          if (!i) {
            self.points[i] = {'start': true, 'skip': false, 'break': false,
              'latLng': e.latLng};
          } else {
            self.points[i] = e;
          }
          i++;
        });
        this.index--;
        delete this.points[this.index];
      }
    } else if (this.points[i].break) {
      var second_points = Object.values(this.points).splice(i + 2, this.index - 1);
      var shift = this.points[i + 2].year - this.points[i - 1].year - 1;
      second_points.map(function(e) {
        e.year -= shift;
        self.points[i] = e;
        i++;
      });
      this.year -= shift;
      this.index = index - 2;
      delete this.points[this.index];
      delete this.points[this.index + 1];
    } else {
      var new_points = this.points;
      var k = i;
      var second_points = Object.values(this.points).splice(i + 1, this.index - 1);
      second_points.map(function(e) {
        if (!e.start && !e.break) {
          if (hasLatewood) {
            e.earlywood = !e.earlywood;
            if (!e.earlywood) {
              e.year--;
            }
          } else {
            e.year--;
          }
        }
        new_points[k] = e;
        k++;
      });

      this.points = new_points;
      this.index--;
      delete this.points[this.index];
      this.earlywood = !this.earlywood;
      if (this.points[this.index - 1].earlywood) {
        this.year--;
      }
    }
  }
  
  MeasurementData.prototype.cut = function(i, j) {
    if (i > j) {
      var trimmed_points = Object.values(this.points).splice(i, this.index - 1);
      var k = 0;
      this.points = {};
      trimmed_points.map(function(e) {
        if (!k) {
          this.points[k] = {'start': true, 'skip': false, 'break': false,
            'latLng': e.latLng};
        } else {
          this.points[k] = e;
        }
        k++;
      });
      this.index = k;
    } else if (i < j) {
      this.points = Object.values(this.points).splice(0, i);
      this.index = i;
    } else {
      alert('You cannot select the same point');
    }
  };
  
  MeasurementData.prototype.insertPoint = function(latLng, hasLatewood) {
    var i = 0;
    while (this.points[i] != undefined &&
        this.points[i].latLng.lng < latLng.lng) {
      i++;
    }
    if (this.points[i] == null) {
      alert('New point must be within existing points.' +
          'Use the create toolbar to add new points to the series.');
      return;
    }

    var new_points = this.points;
    var second_points = Object.values(this.points).splice(i, this.index - 1);
    var k = i;
    var year_adjusted = this.points[i].year;
    var earlywood_adjusted = true;

    if (this.points[i - 1].earlywood && hasLatewood) {
      year_adjusted = this.points[i - 1].year;
      earlywood_adjusted = false;
    } else if (this.points[i - 1].start) {
      year_adjusted = this.points[i + 1].year;
    } else {
      year_adjusted = this.points[i - 1].year + 1;
    }
    new_points[k] = {'start': false, 'skip': false, 'break': false,
      'year': year_adjusted, 'earlywood': earlywood_adjusted,
      'latLng': latLng};

    var tempK = k;
    
    //visualAsset.newLatLng(new_points, k, latLng);
    k++;

    second_points.map(function(e) {
      if (!e.start && !e.break) {
        if (hasLatewood) {
          e.earlywood = !e.earlywood;
          if (e.earlywood) {
            e.year++;
          }
        }
        else {
          e.year++;
        }
      }
      new_points[k] = e;
      k++;
    });

    this.points = new_points;
    this.index = k;
    if (hasLatewood) {
      this.earlywood = !this.earlywood;
    }
    if (!this.points[this.index - 1].earlywood || !hasLatewood) {
      this.year++;
    }
    
    return tempK;
  };
  
  MeasurementData.prototype.insertZeroGrowth = function(i, latLng, hasLatewood) {
    var new_points = this.points;
    var second_points = Object.values(this.points).splice(i + 1, this.index - 1);
    var k = i + 1;

    var year_adjusted = this.points[i].year + 1;

    new_points[k] = {'start': false, 'skip': false, 'break': false,
      'year': year_adjusted, 'earlywood': true, 'latLng': latLng};
    
//    visualAsset.newLatLng(new_points, k, latLng);
    k++;

    if (hasLatewood) {
      new_points[k] = {'start': false, 'skip': false, 'break': false,
        'year': year_adjusted, 'earlywood': false, 'latLng': latLng};
//      visualAsset.newLatLng(new_points, k, latLng);
      k++;
    }
    
    var tempK = k-1;

    second_points.map(function(e) {
      if (!e.start && !e.break) {
        e.year++;
      }
      new_points[k] = e;
      k++;
    });

    this.points = new_points;
    this.index = k;
    this.year++;
    
    return tempK;
  }
  
  MeasurementData.prototype.year = function() { return this.year; }
  MeasurementData.prototype.earlywood = function() { return this.earlywood; }
  MeasurementData.prototype.points = function() { return this.points; }
  MeasurementData.prototype.index = function() { return this.index; }

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
  var self = this;
  
  this.layer = L.layerGroup().addTo(Lt.viewer);
  this.active = false;
  
  InteractiveMouse.prototype.enable = function() {
    this.active = true;
  }
  
  InteractiveMouse.prototype.disable = function() {
    this.active = false;
    $(Lt.viewer._container).off('mousemove');
    this.layer.clearLayers();
  }
  
  /**
  * A method to create a new line from a given latLng
  * @param {Leatlet LatLng Object} latLng - the latLng coordinate on the viewer to
  * create a line from
  */
  InteractiveMouse.prototype.from = function (latLng) {
    $(Lt.viewer._container).mousemove(function(e) {
      if (self.active) {
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

        if (Lt.data.earlywood || !Lt.meta.hasLatewood) {
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
    if (Lt.data.points !== undefined) {
      Object.values(Lt.data.points).map(function(e, i) {
        if (e != undefined) {
          Lt.visualAsset.newLatLng(Lt.data.points, i, e.latLng);
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
  VisualAsset.prototype.newLatLng = function (pts, i, latLng) {
    var leafLatLng = L.latLng(latLng);

    if (window.name === 'popout') {
      var draggable = true;
    } else {
      var draggable = false;
    }

    var draggable = true;
    var marker;

    //check if index is the start point
    if (pts[i].start) {
      marker = L.marker(leafLatLng, {icon: new MarkerIcon('white', Lt.basePath),
        draggable: draggable, title: 'Start Point', riseOnHover: true});
    } else if (pts[i].break) { //check if point is a break
      marker = L.marker(leafLatLng, {icon: new MarkerIcon('white', Lt.basePath),
        draggable: draggable, title: 'Break Point', riseOnHover: true});
    } else if (Lt.meta.hasLatewood) { //check if point is earlywood
      if (pts[i].earlywood) {
        marker = L.marker(leafLatLng, {icon: new MarkerIcon('light_blue', Lt.basePath),
          draggable: draggable, title: 'Year ' + pts[i].year +
              ', earlywood', riseOnHover: true});
      } else { //otherwise it's latewood
        marker = L.marker(leafLatLng, {icon: new MarkerIcon('dark_blue', Lt.basePath),
          draggable: draggable, title: 'Year ' + pts[i].year +
            ', latewood',
          riseOnHover: true});
      }
    } else {
      marker = L.marker(leafLatLng, {icon: new MarkerIcon('light_blue', Lt.basePath),
        draggable: draggable, title: 'Year ' + pts[i].year,
        riseOnHover: true});
    }

    this.markers[i] = marker;   //add created marker to marker_list
    var self = this;

    //tell marker what to do when being dragged
    this.markers[i].on('drag', function(e) {
      if (!pts[i].start) {
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
      } else if (self.lines[i + 2] !== undefined && !pts[i + 1].start) {
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
    this.markers[i].on('dragend', function(e) {
      Lt.undo.push();
      pts[i].latLng = e.target._latlng;
    });

    //tell marker what to do when clicked
    this.markers[i].on('click', function(e) {
      if (Lt.deletePoint.active) {
        Lt.deletePoint.action(i);
      }
      
      if (Lt.cut.active) {
        if (Lt.cut.point != -1) {
          Lt.cut.action(i);
        } else {
          Lt.cut.fromPoint(i);
        }
      }
      if (Lt.insertZeroGrowth.active) {
        if ((pts[i].earlywood && Lt.meta.hasLatewood) || pts[i].start ||
            pts[i].break) {
          alert('Missing year can only be placed at the end of a year!');
        } else {
          Lt.insertZeroGrowth.action(i);
        }
      }
      if (Lt.insertBreak.active) {
        Lt.insertBreak.action(i);
      }
      if (Lt.dating.active) {
        Lt.dating.action(i);
      }
    });

    //drawing the line if the previous point exists
    if (pts[i - 1] != undefined && !pts[i].start) {
      if (pts[i].earlywood || !Lt.meta.hasLatewood || 
          (!pts[i - 1].earlywood && pts[i].break)) {
        var color = '#00BCD4';
      } else {
        var color = '#00838f';
      }
      this.lines[i] =
          L.polyline([pts[i - 1].latLng, leafLatLng],
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
 * A collapsable button bar
 * @constructor
 * @param 
 */
function ButtonBar(Lt, btns, icon, title) {
  var self = this;
  
  this.btns = btns;

  this.btn = L.easyButton({
    states: [
      {
        stateName: 'collapse',
        icon: icon,
        title: title,
        onClick: function(btn, map) {
          self.btn.state('expand');
          self.expand();
          
//          create.dataPoint.btn.enable();
//          create.zeroGrowth.btn.enable();
//          create.breakPoint.btn.enable();
//
//          data.disable();
//          edit.collapse();
//          annotation.disable();
//          setYear.disable();
        }
      },
      {
        stateName: 'expand',
        icon: '<i class="material-icons md-18">expand_less</i>',
        title: 'Collapse',
        onClick: function(btn, map) {
          self.btn.state('collapse');
          self.collapse();
        }
      }]
  });
  
  this.bar = L.easyBar([self.btn].concat(this.btns));
  
  ButtonBar.prototype.expand = function() {
    this.btns.forEach(function(e) { e.enable() });
  }
  
  ButtonBar.prototype.collapse = function() {
    this.btns.forEach(function(e) { e.disable() });
  }
  
  this.collapse();
}

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
        window.open(Lt.meta.popoutUrl, 'popout',
                    'location=yes,height=600,width=800,scrollbars=yes,status=yes');
      }
    }]
  })
}

/**
 * Undo actions
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Undo(Lt) {
  var self = this;
  
  this.stack = new Array();
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'undo',
        icon: '<i class="material-icons md-18">undo</i>',
        title: 'Undo',
        onClick: function(btn, map) {
          self.pop();
        }
      }]
  });
  
  Undo.prototype.push = function() {
    self.btn.enable();
    Lt.redo.btn.disable();
    Lt.redo.stack.length = 0;
    var restore_points = JSON.parse(JSON.stringify(Lt.data.points));
    self.stack.push({'year': Lt.data.year, 'earlywood': Lt.data.earlywood,
      'index': Lt.data.index, 'points': restore_points });
  };
  
  Undo.prototype.pop = function() {
    if (self.stack.length > 0) {
      if (Lt.data.points[Lt.data.index - 1].start) {
        Lt.createPoint.disable();
      } else {
        Lt.mouseLine.from(Lt.data.points[Lt.data.index - 2].latLng);
      }

      Lt.redo.btn.enable();
      var restore_points = JSON.parse(JSON.stringify(Lt.data.points));
      Lt.redo.stack.push({'year': Lt.data.year, 'earlywood': Lt.data.earlywood,
        'index': Lt.data.index, 'points': restore_points});
      var dataJSON = self.stack.pop();

      Lt.data.points = JSON.parse(JSON.stringify(dataJSON.points));

      Lt.data.index = dataJSON.index;
      Lt.data.year = dataJSON.year;
      Lt.data.earlywood = dataJSON.earlywood;

      Lt.visualAsset.reload();

      if (self.stack.length == 0) {
        self.btn.disable();
      }
    }
  };
}

/**
 * Redo actions
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Redo(Lt) {
    var self = this;
  
    this.stack = new Array();
  
    this.btn = L.easyButton({
      states: [
        {
          stateName: 'redo',
          icon: '<i class="material-icons md-18">redo</i>',
          title: 'Redo',
          onClick: function(btn, map) {
            self.pop();
          }
        }]
    });
  
    Redo.prototype.pop = function() {
      Lt.undo.btn.enable();
      var restore_points = JSON.parse(JSON.stringify(Lt.data.points));
      Lt.undo.stack.push({'year': Lt.data.year, 'earlywood': Lt.data.earlywood,
        'index': Lt.data.index, 'points': restore_points});
      var dataJSON = this.stack.pop();

      Lt.data.points = JSON.parse(JSON.stringify(dataJSON.points));

      Lt.data.index = dataJSON.index;
      Lt.data.year = dataJSON.year;
      Lt.data.earlywood = dataJSON.earlywood;

      Lt.visualAsset.reload();

      if (this.stack.length == 0) {
        this.btn.disable();
      }
    };
}

/**
 * Set date of chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Dating(Lt) {
  var self = this;
  
  this.active = false;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">access_time</i>',
        title: 'Set the year of any point and adjust all other points',
        onClick: function(btn, map) {
//          annotation.disable();
//          edit.collapse();
//          create.collapse();
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
  
  Dating.prototype.action = function(i) {
    if (Lt.data.points[i].year != undefined) {
      var popup = L.popup({closeButton: false})
          .setContent(
          '<input type="number" style="border:none;width:50px;" value="' +
          Lt.data.points[i].year + '" id="year_input"></input>')
          .setLatLng(Lt.data.points[i].latLng)
          .openOn(Lt.viewer);

      document.getElementById('year_input').select();

      $(Lt.viewer._container).click(function(e) {
        popup.remove(Lt.viewer);
        self.disable();
      });

      $(document).keypress(function(e) {
        var key = e.which || e.keyCode;
        if (key === 13) {
          var new_year = parseInt(document.getElementById('year_input').value);
          popup.remove(Lt.viewer);

          var date = new Date();
          var max = date.getFullYear();

          if (new_year > max) {
            alert('Year cannot exceed ' + max + '!');
          } else {
            Lt.undo.push();

            var shift = new_year - Lt.data.points[i].year;

            Object.values(Lt.data.points).map(function(e, i) {
              if (Lt.data.points[i].year != undefined) {
                Lt.data.points[i].year += shift;
              }
            });
            Lt.data.year += shift;
            Lt.visualAsset.reload();
          }
          self.disable();
        }
      });
    }
  };
  
  Dating.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
  };

  Dating.prototype.disable = function() {
    this.btn.state('inactive');
    $(Lt.viewer._container).off('click');
    $(document).off('keypress');
    this.active = false;
  };
}

/**
 * Create measurement points
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function CreatePoint(Lt) {
  var self = this;
  
  this.active = false;
  this.startPoint = true;
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">linear_scale</i>',
        title: 'Create measurable points',
        onClick: function(btn, map) {
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'End (Esc)',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
      
  CreatePoint.prototype.enable = function() {
    self.btn.state('active');
    Lt.mouseLine.enable();

    document.getElementById('map').style.cursor = 'pointer';

    $(document).keyup(function(e) {
      var key = e.which || e.keyCode;
      if (key === 27) {
        self.disable();
      }
    });

    $(Lt.viewer._container).click(function(e) {
      document.getElementById('map').style.cursor = 'pointer';

      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.undo.push();

      if (self.startPoint) {
        var popup = L.popup({closeButton: false}).setContent(
            '<input type="number" style="border:none; width:50px;"' +
            'value="' + Lt.data.year + '" id="year_input"></input>')
            .setLatLng(latLng)
            .openOn(Lt.viewer);

        document.getElementById('year_input').select();

        $(document).keypress(function(e) {
          var key = e.which || e.keyCode;
          if (key === 13) {
            Lt.data.year = parseInt(document.getElementById('year_input').value);
            popup.remove(Lt.viewer);
          }
        });
        Lt.data.newPoint(self.startPoint, latLng, Lt.meta.hasLatewood);
        self.startPoint = false;
      } else {
        Lt.data.newPoint(self.startPoint, latLng, Lt.meta.hasLatewood);
      }

      //call newLatLng with current index and new latlng
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index-1, latLng);

      //create the next mouseline from the new latlng
      Lt.mouseLine.from(latLng);

      self.active = true;   //activate dataPoint after one point is made
    });
  };
  
  CreatePoint.prototype.disable = function() {
    $(document).off('keyup');
    // turn off the mouse clicks from previous function
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.mouseLine.disable();
    document.getElementById('map').style.cursor = 'default';
    this.startPoint = true;
  };
}

/**
 * Add a zero growth measurement
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function CreateZeroGrowth(Lt) {
  var self = this;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'skip-year',
        icon: '<i class="material-icons md-18">exposure_zero</i>',
        title: 'Add a zero growth year',
        onClick: function(btn, map) {
          self.add();
        }
      }]
  });
  
  CreateZeroGrowth.prototype.add = function() {
    if (Lt.data.index) {
      var latLng = Lt.data.points[Lt.data.index - 1].latLng;

      Lt.undo.push();

      Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': false,
        'year': Lt.data.year, 'earlywood': true, 'latLng': latLng};
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
      Lt.data.index++;
      if (Lt.meta.hasLatewood) {
        Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': false,
          'year': Lt.data.year, 'earlywood': false, 'latLng': latLng};
        Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
        Lt.data.index++;
      }
      Lt.data.year++;
    } else {
      alert('First year cannot be missing!');
    }
  };      
}

/**
 * Add a break in a measurement
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function CreateBreak(Lt) {
  var self = this;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">broken_image</i>',
        title: 'Create a break point',
        onClick: function(btn, map) {
          Lt.createPoint.disable();
          self.enable();
          Lt.mouseLine.from(Lt.data.points[Lt.data.index - 1].latLng);
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  })
  
  CreateBreak.prototype.enable = function() {
    self.btn.state('active');

    Lt.mouseLine.enable();

    document.getElementById('map').style.cursor = 'pointer';

    $(Lt.viewer._container).click(function(e) {
      document.getElementById('map').style.cursor = 'pointer';

      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.mouseLine.from(latLng);

      Lt.undo.push();

      Lt.viewer.dragging.disable();
      Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': true,
        'latLng': latLng};
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
      Lt.data.index++;
      self.disable();

      Lt.createPoint.enable();
    });
  };
  
  CreateBreak.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    Lt.viewer.dragging.enable();
    Lt.mouseLine.disable();
  };
      
}

/**
 * Delete a measurement point
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function DeletePoint(Lt) {
  var self = this;
  
  this.active = false;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">delete</i>',
        title: 'Delete a point',
        onClick: function(btn, map) {
//          edit.cut.disable();
//          edit.addData.disable();
//          edit.addZeroGrowth.disable();
//          edit.addBreak.disable();
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
  
  DeletePoint.prototype.action = function(i) {
    Lt.undo.push();
    
    Lt.data.deletePoint(i, Lt.meta.hasLatewood);

    Lt.visualAsset.reload();
  };
  
  DeletePoint.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    document.getElementById('map').style.cursor = 'pointer';
  };
  
  DeletePoint.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    this.active = false;
    document.getElementById('map').style.cursor = 'default';
  };
  
}

/**
 * Delete several points on either end of a chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Cut(Lt) {
  var self = this;
  
  this.active = false;
  this.point = -1;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">content_cut</i>',
        title: 'Cut a portion of the series',
        onClick: function(btn, map) {
//          edit.deletePoint.disable();
//          edit.addData.disable();
//          edit.addZeroGrowth.disable();
//          edit.addBreak.disable();
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
  
  Cut.prototype.fromPoint = function(i) {
    this.point = i;
  };
  
  Cut.prototype.action = function(i) {
    Lt.undo.push();
    
    Lt.data.cut(this.point, i);

    Lt.visualAsset.reload();
    this.disable();
  };

  Cut.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    document.getElementById('map').style.cursor = 'pointer';
    this.point = -1;
  };
  
  Cut.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    this.active = false;
    document.getElementById('map').style.cursor = 'default';
    this.point = -1;
  };
            
}

/**
 * Insert a new measurement point in the middle of chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function InsertPoint(Lt) {
  var self = this;
  
  this.active = false;
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">add_circle_outline</i>',
        title: 'Add a point in the middle of the series',
        onClick: function(btn, map) {
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
     
  InsertPoint.prototype.action = function() {
    document.getElementById('map').style.cursor = 'pointer';

    $(Lt.viewer._container).click(function(e) {
      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.undo.push();
      
      var k = Lt.data.insertPoint(latLng, Lt.meta.hasLatewood);
      if (k != null) {
        Lt.visualAsset.newLatLng(Lt.data.points, k, latLng);
        Lt.visualAsset.reload();
      }
      
      self.disable();
    });
  };
  
  InsertPoint.prototype.enable = function() {
    this.btn.state('active');
    this.action();
    this.active = true;
  };
  
  InsertPoint.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    this.active = false;
    document.getElementById('map').style.cursor = 'default';
  };
}
  
/**
 * Insert a zero growth measurement in the middle of a chronology
 * @constructor
 * @param {Ltrering} Lt - Leaflet treering object
 */
function InsertZeroGrowth(Lt) {
  var self = this;
  
  this.active = false;
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">exposure_zero</i>',
        title: 'Add a zero growth year in the middle of the series',
        onClick: function(btn, map) {
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Cancel',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  })
  
  
  InsertZeroGrowth.prototype.action = function(i) {
    var latLng = Lt.data.points[i].latLng;

    Lt.undo.push();
    
    var k = Lt.data.insertZeroGrowth(i, latLng, Lt.meta.hasLatewood);
    if (k !== null) {
      if (Lt.meta.hasLatewood) Lt.visualAsset.newLatLng(Lt.data.points, k-1, latLng);
      Lt.visualAsset.newLatLng(Lt.data.points, k, latLng);
      Lt.visualAsset.reload();
    }
    
    this.disable();
  };
  
  InsertZeroGrowth.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    document.getElementById('map').style.cursor = 'pointer';
  };
  
  InsertZeroGrowth.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    document.getElementById('map').style.cursor = 'default';
    this.active = false;
    Lt.viewer.dragging.enable();
    Lt.mouseLine.disable();
  };

}

/**
 * Insert a break in the middle of a chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function InsertBreak(Lt) {
  var self = this;
  
  this.active = false;
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'inactive',
        icon: '<i class="material-icons md-18">broken_image</i>',
        title: 'Add a break in the series',
        onClick: function(btn, map) {
          self.enable();
        }
      },
      {
        stateName: 'active',
        icon: '<i class="material-icons md-18">clear</i>',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  })
  
  InsertBreak.prototype.action = function(i) {
    var new_points = Lt.data.points;
    var second_points = Object.values(Lt.data.points).splice(i + 1, Lt.data.index - 1);
    var first_point = true;
    var second_point = false;
    var k = i + 1;

    Lt.mouseLine.enable();
    Lt.mouseLine.from(Lt.data.points[i].latLng);

    $(Lt.viewer._container).click(function(e) {
      var latLng = Lt.viewer.mouseEventToLatLng(e);
      Lt.viewer.dragging.disable();

      if (first_point) {
        Lt.mouseLine.from(latLng);
        new_points[k] = {'start': false, 'skip': false, 'break': true,
          'latLng': latLng};
        Lt.visualAsset.newLatLng(new_points, k, latLng);
        k++;
        first_point = false;
        second_point = true;
      } else if (second_point) {
        self.disable();
        second_point = false;
        self.active = false;
        Lt.mouseLine.layer.clearLayers();

        new_points[k] = {'start': true, 'skip': false, 'break': false,
          'latLng': latLng};
        Lt.visualAsset.newLatLng(new_points, k, latLng);
        k++;

        var popup = L.popup({closeButton: false}).setContent(
            '<input type="number" style="border:none;width:50px;"' +
            'value="' + second_points[0].year +
            '" id="year_input"></input>').setLatLng(latLng)
            .openOn(Lt.viewer);

        document.getElementById('year_input').select();

        $(document).keypress(function(e) {
          var key = e.which || e.keyCode;
          if (key === 13) {
            var new_year = parseInt(document.getElementById('year_input').value);
            popup.remove(Lt.viewer);

            var shift = new_year - second_points[0].year;

            second_points.map(function(e) {
              e.year += shift;
              new_points[k] = e;
              k++;
            });
            Lt.data.year += shift;

            $(Lt.viewer._container).off('click');

            Lt.undo.push();

            Lt.data.points = new_points;
            Lt.data.index = k;

            Lt.visualAsset.reload();
            self.disable();
          }
        });
      } else {
        self.disable();
        Lt.visualAsset.reload();
      }
    });
  };
      
  InsertBreak.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    document.getElementById('map').style.cursor = 'pointer';
  };
  
  InsertBreak.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('inactive');
    this.active = false;
    document.getElementById('map').style.cursor = 'default';
    Lt.viewer.dragging.enable();
    Lt.mouseLine.disable();
  };
}

function ViewData(Lt) {
  var self = this;
  
  this.btn = L.easyButton({
    states: [
      {
        stateName: 'collapse',
        icon: '<i class="material-icons md-18">view_list</i>',
        title: 'View and download data',
        onClick: function(btn, map) {
          self.enable();

//          create.collapse();
//          setYear.disable();
//          edit.collapse();
//          annotation.disable();
        }
      },
      {
        stateName: 'expand',
        icon: '<i class="material-icons md-18">clear</i>',
        title: 'Collapse',
        onClick: function(btn, map) {
          self.disable();
        }
      }]
  });
  
  this.dialog = L.control.dialog({'size': [340, 400], 'anchor': [5, 50], 'initOpen': false})
    .setContent('<h3>There are no data points to measure</h3>')
    .addTo(Lt.viewer);
  
  ViewData.prototype.distance = function(p1, p2) {
    var lastPoint = Lt.viewer.project(p1, Lt.viewer.getMaxZoom());
    var newPoint = Lt.viewer.project(p2, Lt.viewer.getMaxZoom());
    var length = Math.sqrt(Math.pow(Math.abs(lastPoint.x - newPoint.x), 2) +
        Math.pow(Math.abs(newPoint.y - lastPoint.y), 2));
    var pixelsPerMillimeter = 1;
    Lt.viewer.eachLayer(function(layer) {
      if (layer.options.pixelsPerMillimeter > 0) {
        pixelsPerMillimeter = Lt.meta.ppm;
      }
    });
    length = length / pixelsPerMillimeter;
    var retinaFactor = 1;
    if (L.Browser.retina) {
      retinaFactor = 2; // this is potentially incorrect for 3x+ devices
    }
    return length * retinaFactor;
  }
  
  ViewData.prototype.download = function() {
    
    var toFourCharString = function(n) {
      var string = n.toString();

      if (string.length == 1) {
        string = '   ' + string;
      } else if (string.length == 2) {
        string = '  ' + string;
      } else if (string.length == 3) {
        string = ' ' + string;
      } else if (string.length == 4) {
        string = string;
      } else if (string.length >= 5) {
        alert('Value exceeds 4 characters');
        throw 'error in toFourCharString(n)';
      } else {
        alert('toSixCharString(n) unknown error');
        throw 'error';
      }
      return string;
    };

    var toSixCharString = function(n) {
      var string = n.toString();

      if (string.length == 1) {
        string = '     ' + string;
      } else if (string.length == 2) {
        string = '    ' + string;
      } else if (string.length == 3) {
        string = '   ' + string;
      } else if (string.length == 4) {
        string = '  ' + string;
      } else if (string.length == 5) {
        string = ' ' + string;
      } else if (string.length >= 6) {
        alert('Value exceeds 5 characters');
        throw 'error in toSixCharString(n)';
      } else {
        alert('toSixCharString(n) unknown error');
        throw 'error';
      }
      return string;
    };

    var toEightCharString = function(n) {
      var string = n.toString();
      if (string.length == 0) {
        string = string + '        ';
      } else if (string.length == 1) {
        string = string + '       ';
      } else if (string.length == 2) {
        string = string + '      ';
      } else if (string.length == 3) {
        string = string + '     ';
      } else if (string.length == 4) {
        string = string + '    ';
      } else if (string.length == 5) {
        string = string + '   ';
      } else if (string.length == 6) {
        string = string + '  ';
      } else if (string.length == 7) {
        string = string + ' ';
      } else if (string.length >= 8) {
        alert('Value exceeds 7 characters');
        throw 'error in toEightCharString(n)';
      } else {
        alert('toSixCharString(n) unknown error');
        throw 'error';
      }
      return string;
    };
    
    if (Lt.data.points != undefined && Lt.data.points[1] != undefined) {
      
      var sum_points;
      var sum_string = '';
      var last_latLng;
      var break_length;
      var length_string;
      
      if (Lt.meta.hasLatewood) {

        var sum_string = '';
        var ew_string = '';
        var lw_string = '';

        y = Lt.data.points[1].year;
        var sum_points = Object.values(Lt.data.points).filter(function(e) {
          if (e.earlywood != undefined) {
            return !(e.earlywood);
          } else {
            return true;
          }
        });

        if (sum_points[1].year % 10 > 0) {
          sum_string = sum_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(sum_points[1].year));
        }

        var break_point = false;
        sum_points.map(function(e, i, a) {
          
          if (e.start) {
            last_latLng = e.latLng;
          } else if (e.break) {
            break_length = 
              Math.round(data.distance(last_latLng, e.latLng) * 1000);
              break_point = true;
          } else {
            if (e.year % 10 == 0) {
              sum_string = sum_string.concat('\r\n' +
                  toEightCharString(Lt.meta.assetName) +
                  toFourCharString(e.year));
            }
            while (e.year > y) {
              sum_string = sum_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                sum_string = sum_string.concat('\r\n' +
                    toFourCharString(e.year));
              }
            }

            var length = Math.round(self.distance(last_latLng, e.latLng) * 1000);
            if (break_point) {
              length += break_length;
              break_point = false;
            }
            if (length == 9999) {
              length = 9998;
            }
            if (length == 999) {
              length = 998;
            }

            length_string = toSixCharString(length);

            sum_string = sum_string.concat(length_string);
            last_latLng = e.latLng;
            y++;
          }
        });
        sum_string = sum_string.concat(' -9999');

        y = Lt.data.points[1].year;

        if (Lt.data.points[1].year % 10 > 0) {
          ew_string = ew_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(Lt.data.points[1].year));
          lw_string = lw_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(Lt.data.points[1].year));
        }

        break_point = false;
        Object.values(Lt.data.points).map(function(e, i, a) {
          if (e.start) {
            last_latLng = e.latLng;
          } else if (e.break) {
            break_length = 
              Math.round(self.distance(last_latLng, e.latLng) * 1000);
            break_point = true;
          } else {
            if (e.year % 10 == 0) {
              if (e.earlywood) {
                ew_string = ew_string.concat('\r\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              } else {
                lw_string = lw_string.concat('\r\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              }
            }
            while (e.year > y) {
              ew_string = ew_string.concat('    -1');
              lw_string = lw_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                ew_string = ew_string.concat('\r\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
                lw_string = lw_string.concat('\r\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              }
            }

            length = Math.round(self.distance(last_latLng, e.latLng) * 1000);
            if (break_point) {
              length += break_length;
              break_point = false;
            }
            if (length == 9999) {
              length = 9998;
            }
            if (length == 999) {
              length = 998;
            }

            length_string = toSixCharString(length);

            if (e.earlywood) {
              ew_string = ew_string.concat(length_string);
              last_latLng = e.latLng;
            } else {
              lw_string = lw_string.concat(length_string);
              last_latLng = e.latLng;
              y++;
            }
          }
        });
        ew_string = ew_string.concat(' -9999');
        lw_string = lw_string.concat(' -9999');

        console.log(sum_string);
        console.log(ew_string);
        console.log(lw_string);

        var zip = new JSZip();
        zip.file((Lt.meta.assetName + '.raw'), sum_string);
        zip.file((Lt.meta.assetName + '.lwr'), lw_string);
        zip.file((Lt.meta.assetName + '.ewr'), ew_string);

      } else {

        var y = Lt.data.points[1].year;
        sum_points = Object.values(Lt.data.points);

        if (sum_points[1].year % 10 > 0) {
          sum_string = sum_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(sum_points[1].year));
        }
        sum_points.map(function(e, i, a) {
          if (!e.start) {
            if (e.year % 10 == 0) {
              sum_string = sum_string.concat('\r\n' +
                  toEightCharString(Lt.meta.assetName) +
                  toFourCharString(e.year));
            }
            while (e.year > y) {
              sum_string = sum_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                sum_string = sum_string.concat('\r\n' +
                    toFourCharString(e.year));
              }
            }

            length = Math.round(self.distance(last_latLng, e.latLng) * 1000);
            if (length == 9999) {
              length = 9998;
            }
            if (length == 999) {
              length = 998;
            }

            length_string = toSixCharString(length);

            sum_string = sum_string.concat(length_string);
            last_latLng = e.latLng;
            y++;
          } else {
            last_latLng = e.latLng;
          }
        });
        sum_string = sum_string.concat(' -9999');

        var zip = new JSZip();
        zip.file((Lt.meta.assetName + '.raw'), sum_string);
      }

      zip.generateAsync({type: 'blob'})
          .then(function(blob) {
            saveAs(blob, (Lt.meta.assetName + '.zip'));
          });
    } else {
      alert('There is no data to download');
    }
  };
  
  ViewData.prototype.clean = function() {
    for (var i in Lt.data.points) {
      if (Lt.data.points[i] === null || Lt.data.points[i] === undefined) {
        delete Lt.data.points[i];
      }
    }
  };
  
  ViewData.prototype.enable = function() {
    this.btn.state('expand');
    var string;
    if (Lt.data.points[0] != undefined) {
      var y = Lt.data.points[1].year;
      string = '<div><button id="download-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>download</button><button id="refresh-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>refresh</button><button id="delete-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>delete all</button></div><table><tr>' +
          '<th style="width: 45%;">Year</th>' +
          '<th style="width: 70%;">Length</th></tr>';

      var break_point = false;
      var last_latLng;
      var break_length;
      var break_point;
      var length;
      this.clean();
      Object.values(Lt.data.points).map(function(e, i, a) {
        
        if (e.start) {
          last_latLng = e.latLng;
        } else if (e.break) {
          break_length =
            Math.round(self.distance(last_latLng, e.latLng) * 1000) / 1000;
          break_point = true;
        } else {
          while (e.year > y) {
            string = string.concat('<tr><td>' + y +
                '-</td><td>N/A</td></tr>');
            y++;
          }
          length = Math.round(self.distance(last_latLng, e.latLng) * 1000) / 1000;
          if (break_point) {
            length += break_length;
            length = Math.round(length * 1000) / 1000;
            break_point = false;
          }
          if (length == 9.999) {
            length = 9.998;
          }
          if (Lt.meta.hasLatewood) {
            var wood;
            var row_color;
            if (e.earlywood) {
              wood = 'E';
              row_color = '#00d2e6';
            } else {
              wood = 'L';
              row_color = '#00838f';
              y++;
            }
            string =
                string.concat('<tr style="color:' + row_color + ';">');
            string = string.concat('<td>' + e.year + wood + '</td><td>'+
                length + ' mm</td></tr>');
          } else {
            y++;
            string = string.concat('<tr style="color: #00d2e6;">');
            string = string.concat('<td>' + e.year + '</td><td>' +
                length + ' mm</td></tr>');
          }
          last_latLng = e.latLng;
        }
      });
      this.dialog.setContent(string + '</table>');
    } else {
      string = '<div><button id="download-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          'disabled>download</button>' +
          '<button id="refresh-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>refresh</button><button id="delete-button"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>delete all</button></div>' +
          '<h3>There are no data points to measure</h3>';
      this.dialog.setContent(string);
    }
    this.dialog.lock();
    this.dialog.open();
    $('#download-button').click(self.download);
    $('#refresh-button').click(function() {
      self.disable();
      self.enable();
    });
    $('#delete-button').click(function() {
      self.dialog.setContent(
          '<p>This action will delete all data points.' +
          'Annotations will not be effected.' +
          'Are you sure you want to continue?</p>' +
          '<p><button id="confirm-delete"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>confirm</button><button id="cancel-delete"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>cancel</button></p>');

      $('#confirm-delete').click(function() {
        Lt.undo.push();

        Lt.data.points = {};
        Lt.data.year = 0;
        Lt.data.earlywood = true;
        Lt.data.index = 0;

        Lt.visualAsset.reload();

        self.disable();
      });
      $('#cancel-delete').click(function() {
        self.disable();
        self.enable();
      });
    });
  },
  
  ViewData.prototype.disable = function() {
    $(Lt.viewer._container).off('click');
    this.btn.state('collapse');
    $('#confirm-delete').off('click');
    $('#cancel-delete').off('click');
    $('#download-button').off('click');
    $('#refresh-button').off('click');
    $('#delete-button').off('click');
    this.dialog.close();
  };
}
