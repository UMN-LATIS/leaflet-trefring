/**
 * @file Leaflet Treering
 * @author Malik Nusseibeh <nusse007@umn.edu>
 * @version 1.0.0
 */


/**
 * A measurement data object
 * @constructor
 * @param {object} dataObject -
 */
function measurementData(dataObject) {
  this.saveDate = dataObject.saveDate || {};
  this.index = dataObject.index || 0;
  this.year = dataObject.year || 0;
  this.earlywood = dataObject.earlywood || true;
  this.points = dataObject.points || {};
  this.annotations = dataObject.annotations || {};
}


// function Lt(viewer, basePath, options) {

// }


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

  this.MData = new measurementData(options.initialData);
  this.autoScroll = new autoScroll(this.viewer);

  if (options.ppm == 0) {
    alert('Please set up PPM in asset metadata. PPM will default to 468.');
  }
}


/**
 * A function to load the interface of the treering viewer
 */
LTreering.prototype.loadInterface = function() { 
  console.log(this);
}


/**
 * A function to load the JSON data attached to the treering image
 * @param {measurementData} MData - a measurementData object containg the data
 * of treering image
 */
LTreering.prototype.loadData = function(dataObject) {

}



function autoScroll(LtViewer) {
  var self = this;

  autoScroll.prototype.on = function() {
    //map scrolling
    var mapSize = LtViewer.getSize();  // Map size used for map scrolling
    var mousePos = 0;         // An initial mouse position

    Lt.map.on('mousemove', function(e) {
      var oldMousePos = mousePos;    // Save the old mouse position
      mousePos = e.containerPoint;  // Container point of the mouse
      var mouseLatLng = e.latlng;     // latLng of the mouse
      var mapCenter = LtViewer.getCenter();  // Center of the map

      //left bound of the map
      if (mousePos.x <= 40 && mousePos.y > 450 &&
          oldMousePos.x > mousePos.x) {
        Lt.map.panBy([-200, 0]);
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

  autoScroll.prototype.off = function() {
    LtViewer.off('mousemove');
  };

  autoScroll.prototype.reset = function() {
    self.off();
    self.on();
  };
}


