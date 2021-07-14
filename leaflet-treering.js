/**
 * @file Leaflet Treering
 * @author Malik Nusseibeh <nusse007@umn.edu>
 * @version 1.0.0
 */

// 'use strict';

/**
 * A leaflet treering object
 * @constructor
 * @param {Leaflet Map Object} viewer - the leaflet map object that will used
 *   as a viewer for treering image.
 * @param {string} basePath - this is a path to the treering image folder
 * @param {object} options -
 */
function LTreering (viewer, basePath, options) {
  this.viewer = viewer;
  this.basePath = basePath;

  var getURL = window.location.href;
  var parsedURL = new URL(getURL);
  var urlParams = new URLSearchParams(parsedURL.search);
  var latData = urlParams.get("lat");
  var lngData = urlParams.get("lng");
  if (latData && lngData) {
    setTimeout(function() {
      viewer.setView([latData, lngData], 16); //  max zoom level is 18
    }, 500);
  }

  //options
  this.meta = {
    'ppm': options.ppm || 468,
    'saveURL': options.saveURL || '',
    'savePermission': options.savePermission || false,
    'popoutUrl': options.popoutUrl || null,
    'assetName': options.assetName || 'N/A',
    'attributesObjectArray': options.attributesObjectArray || [],
  }

  this.preferences = { // catch for if forwardDirection or subAnnual are undefined/null on line ~2830
    'forwardDirection': options.initialData.forwardDirection,
    'subAnnual': options.initialData.subAnnual
  }

  this.measurementOptions = new MeasurementOptions(this);

  this.data = new MeasurementData(options.initialData, this);
  this.aData = new AnnotationData(options.initialData.annotations);
  if (options.initialData.ppm) {
    this.meta.ppm = options.initialData.ppm;
  };

  /* Current helper tools:
   * closestPointIndex -> will find the absolute closest point and its index or its point[i] value
  */
  this.helper = new Helper(this);

  //error alerts in 'measuring' mode aka popout window
  //will not alert in 'browsing' mode aka DE browser window
  if (window.name.includes('popout') && options.ppm === 0 && !options.initialData.ppm) {
    alert('Calibration needed: set ppm in asset metadata or use calibration tool.');
  }

  this.autoscroll = new Autoscroll(this.viewer);
  this.mouseLine = new MouseLine(this);
  this.visualAsset = new VisualAsset(this);
  this.annotationAsset = new AnnotationAsset(this);
  this.panhandler = new Panhandler(this);

  this.scaleBarCanvas = new ScaleBarCanvas(this);
  this.metaDataText = new MetaDataText(this);

  this.popout = new Popout(this);
  this.undo = new Undo(this);
  this.redo = new Redo(this);

  this.viewData = new ViewData(this);

  this.imageAdjustment = new ImageAdjustment(this);
  //this.PixelAdjustment = new PixelAdjustment(this);
  this.calibration = new Calibration(this);

  this.dating = new Dating(this);

  this.createPoint = new CreatePoint(this);
  this.zeroGrowth = new CreateZeroGrowth(this);
  this.createBreak = new CreateBreak(this);

  this.deletePoint = new DeletePoint(this);
  this.cut = new Cut(this);
  this.insertPoint = new InsertPoint(this);
  this.convertToStartPoint = new ConvertToStartPoint(this);
  this.insertZeroGrowth = new InsertZeroGrowth(this);
  this.insertBreak = new InsertBreak(this);

  this.saveLocal = new SaveLocal(this);
  this.loadLocal = new LoadLocal(this);
  var ioBtns = [this.saveLocal.btn, this.loadLocal.btn];
  if (options.savePermission) {
    this.saveCloud = new SaveCloud(this);
    ioBtns.push(this.saveCloud.btn);
  }

  this.keyboardShortCutDialog = new KeyboardShortCutDialog(this);

  this.popoutPlots = new PopoutPlots(this);

  this.undoRedoBar = new L.easyBar([this.undo.btn, this.redo.btn]);
  this.annotationTools = new ButtonBar(this, [this.annotationAsset.createBtn, this.annotationAsset.deleteBtn], 'comment', 'Manage annotations');
  this.createTools = new ButtonBar(this, [this.createPoint.btn, this.mouseLine.btn, this.zeroGrowth.btn, this.createBreak.btn], 'straighten', 'Create new measurements');
  // add this.insertBreak.btn below once fixed
  this.editTools = new ButtonBar(this, [this.dating.btn, this.insertPoint.btn, this.convertToStartPoint.btn, this.deletePoint.btn, this.insertZeroGrowth.btn, this.cut.btn], 'edit', 'Edit existing measurements');
  this.ioTools = new ButtonBar(this, ioBtns, 'folder_open', 'Save or upload a record of measurements, annotations, etc.');
  this.settings = new ButtonBar(this, [this.measurementOptions.btn, this.calibration.btn, this.keyboardShortCutDialog.btn], 'settings', 'Measurement preferences & distance calibration');

  this.tools = [this.viewData, this.calibration, this.dating, this.createPoint, this.createBreak, this.deletePoint, this.cut, this.insertPoint, this.convertToStartPoint, this.insertZeroGrowth, this.insertBreak, this.annotationAsset, this.imageAdjustment, this.measurementOptions];

  this.baseLayer = {
    'Tree Ring': baseLayer,
    'GL Layer': layer
  };

  this.overlay = {
    'Points': this.visualAsset.markerLayer,
    'H-bar': this.mouseLine.layer,
    'Lines': this.visualAsset.lineLayer,
    'Annotations': this.annotationAsset.markerLayer
  };

  /**
   * Load the interface of the treering viewer
   * @function loadInterface
   */
  LTreering.prototype.loadInterface = function() {
    console.log(this);

    this.autoscroll.on();
    this.viewer.on('resize', () => {
      this.autoscroll.reset();
    });
    var map = this.viewer;
    $(map.getContainer()).css('cursor', 'default');

    L.control.layers(this.baseLayer, this.overlay).addTo(this.viewer);

    // test placement
    this.popoutPlots.btn.addTo(this.viewer);

    // if popout is opened display measuring tools
    if (window.name.includes('popout')) {
      this.viewData.btn.addTo(this.viewer);
      this.ioTools.bar.addTo(this.viewer);
      this.imageAdjustment.btn.addTo(this.viewer);
      //this.PixelAdjustment.btn.addTo(this.viewer);
      this.createTools.bar.addTo(this.viewer);
      this.editTools.bar.addTo(this.viewer);
      this.annotationTools.bar.addTo(this.viewer);
      this.settings.bar.addTo(this.viewer);
      this.undoRedoBar.addTo(this.viewer);
    } else {
      this.popout.btn.addTo(this.viewer);
      this.viewData.btn.addTo(this.viewer);
      this.ioTools.bar.addTo(this.viewer);
      this.imageAdjustment.btn.addTo(this.viewer);
      //this.PixelAdjustment.btn.addTo(this.viewer);
      //defaults overlay 'points' option to disabled
      map.removeLayer(this.visualAsset.markerLayer);
    }

    // right and left click controls
    this.viewer.on('contextmenu', () => {
      this.disableTools();
    });

    // disable tools w/ esc
    L.DomEvent.on(window, 'keydown', (e) => {
       if (e.keyCode == 27) {
         this.disableTools();
       }
    }, this);

    this.scaleBarCanvas.load();

    this.metaDataText.initialize();

    this.loadData();

  };

  /**
   * Load the JSON data attached to the treering image
   * @function loadData
   */
  LTreering.prototype.loadData = function() {
    this.measurementOptions.preferencesInfo();
    this.visualAsset.reload();
    this.annotationAsset.reload();
    if ( this.meta.savePermission ) {
      // load the save information in buttom left corner
      this.saveCloud.displayDate();
    };
    this.metaDataText.updateText();
  };

  /**
   * Disable any tools
   * @function disableTools
   */
  LTreering.prototype.disableTools = function() {
    if (this.annotationAsset.dialogAnnotationWindow && this.annotationAsset.createBtn.active) { // if user trying to create annotation, destroy dialog & marker
      this.annotationAsset.dialogAnnotationWindow.destroy();
      this.annotationAsset.annotationIcon.removeFrom(this.viewer);
    } else if (this.annotationAsset.dialogAnnotationWindow) {
      this.annotationAsset.dialogAnnotationWindow.destroy();
    };

    if (this.annotationAsset.dialogAttributesWindow) {
      this.annotationAsset.dialogAttributesWindow.destroy();
      delete this.annotationAsset.dialogAttributesWindow;
    };

    this.tools.forEach(e => { e.disable() });
  };

  LTreering.prototype.collapseTools = function() {
    this.annotationTools.collapse();
    this.createTools.collapse();
    this.editTools.collapse();
    this.ioTools.collapse();
    this.settings.collapse();
  };

  // we need the max native zoom, which is set on the tile layer and not the map. getMaxZoom will return a synthetic value which is no good for measurement
  LTreering.prototype.getMaxNativeZoom = function () {
      var maxNativeZoom = null;
      this.viewer.eachLayer(function (l) {
        if (l.options.maxNativeZoom) {
          maxNativeZoom = l.options.maxNativeZoom;
        }
      });
      return maxNativeZoom;
  };
}

/*******************************************************************************/

/**
 * A measurement data object
 * @constructor
 * @param {object} dataObject
 * @param {object} LTreeRing - Lt
 */
function MeasurementData (dataObject, Lt) {
  var measurementOptions = Lt.measurementOptions
  this.saveDate = dataObject.saveDate || dataObject.SaveDate || {};
  this.index = dataObject.index || 0;
  this.year = dataObject.year || 0;
  this.earlywood = dataObject.earlywood || true;
  this.points = dataObject.points || [];
  this.annotations = dataObject.annotations || {};

  const forwardInTime = 'forward';
  const backwardInTime = 'backward';

  function directionCheck () {
    const forwardString = 'forward';
    const backwardString = 'backward';
    if (measurementOptions.forwardDirection) { // check if years counting up
      return forwardString;
    } else { // otherwise years counting down
      return backwardString;
    };
  }

 /**
  * Add a new point into the measurement data
  * @function newPoint
  */
  MeasurementData.prototype.newPoint = function(start, latLng) {
    let direction = directionCheck();

    if (start) {
      this.points[this.index] = {'start': true, 'skip': false, 'break': false, 'latLng': latLng};
    } else {
      this.points[this.index] = {'start': false, 'skip': false, 'break': false, 'year': this.year, 'earlywood': this.earlywood, 'latLng': latLng};
      if (measurementOptions.subAnnual) { // check if points alternate ew & lw
        if (this.earlywood) {
          this.earlywood = false;
        } else {
          this.earlywood = true;
          if (direction == forwardInTime) {
            this.year++;
          } else if (direction == backwardInTime) {
            this.year--;
          };
        }
      } else {
        if (direction == forwardInTime) {
          this.year++;
        } else if (direction == backwardInTime) {
          this.year--;
        };
      };
    };


    this.index++;

    // update every time a point is placed
    Lt.metaDataText.updateText();
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  };

  /**
   * delete a point from the measurement data
   * @function deletePoint
   */
  MeasurementData.prototype.deletePoint = function(i) {
    let direction = directionCheck();

    var second_points;
    if (this.points[i].start) {
      if (this.points[i - 1] != undefined && this.points[i - 1].break) {
        i--;
        second_points = this.points.slice().splice(i + 2, this.index - 1);
        second_points.map(e => {
          this.points[i] = e;
          i++;
        });
        this.index -= 2;
        delete this.points[this.index];
        delete this.points[this.index + 1];
      } else {
        second_points = this.points.slice().splice(i + 1, this.index - 1);
        second_points.map(e => {
          if (!i) {
            this.points[i] = {'start': true, 'skip': false, 'break': false,
              'latLng': e.latLng};
          } else {
            this.points[i] = e;
          }
          i++;
        });
        this.index--;
        delete this.points[this.index];
      }
    } else if (this.points[i].break) {
      second_points = this.points.slice().splice(i + 2, this.index - 1);
      second_points.map(e => {
        this.points[i] = e;
        i++;
      });
      this.index -= 2;
      delete this.points[this.index];
      delete this.points[this.index + 1];
    } else {
      console.log(this.index);
      var new_points = this.points;
      var k = i;
      second_points = this.points.slice().splice(i + 1, this.index - 1);
      second_points.map(e => {
        if (e && !e.start && !e.break) {
          if (measurementOptions.subAnnual) {
            e.earlywood = !e.earlywood;
            if (!e.earlywood) {
              if (direction == forwardInTime) {
                e.year--;
              } else if (direction == backwardInTime) {
                e.year++;
              };
            };
          } else {
            if (direction == forwardInTime) {
              e.year--;
            } else if (direction == backwardInTime) {
              e.year++;
            };
          }
        }
        new_points[k] = e;
        k++;
      });

      this.points = new_points;
      this.index--;
      delete this.points[this.index];
      this.earlywood = !this.earlywood;
      console.log(this.index);
      if (this.points[this.index - 1].earlywood) {
        this.year--;
      }
    }

    Lt.metaDataText.updateText(); // updates after a point is deleted
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  };

  /**
   * remove a range of points from the measurement data
   * @function cut
   */
  MeasurementData.prototype.cut = function(i, j) {
    function removeNulls (e) {
      if (e != null) {
        return e
      };
    };

    if (i > j) {
      this.points.splice(j,i-j+1);
    } else if (i < j) {
      this.points.splice(i,j-i+1);
    } else {
      alert('You cannot select the same point');
    };

    var trimmed_points = this.points.filter(removeNulls); // remove null points
    var k = 0;
    this.points = {};
    trimmed_points.map(e => {
      if (!k) {
        this.points[k] = {'start': true, 'skip': false, 'break': false,
          'latLng': e.latLng};
      } else {
        this.points[k] = e;
      }
      k++;
    });
    this.index = k;
    this.points = trimmed_points;

    //Correct years to delete gap in timeline
    year = this.points[1].year;
    second = false;
    this.points.map(e=>{
      if(e && !e.start && !e.break){
        if(Lt.measurementOptions.subAnnual)
        {
          e.year = year;
          if(second)
          {
            Lt.measurementOptions.forwardDirection? year++: year--;
            e.earlywood = false;
            second = false;
          }
          else{
            e.earlywood = true;
            second = true;
          }
        }
        else{
          e.year = year;
          Lt.measurementOptions.forwardDirection? year++: year--;
        }
      }
    });

    if(Lt.measurementOptions.subAnnual)
    {
      if(Lt.measurementOptions.forwardDirection && !this.points[this.points.length-1].earlywood)
      {
        this.year = this.points[this.points.length-1].year+1;
        this.earlywood = true;
      }
      else if(!Lt.measurementOptions.forwardDirection && this.points[this.points.length-1].earlywood)
      {
        this.year = this.points[this.points.length-1].year-1;
      }
    }
    else
    {
      this.year = Lt.measurementOptions.forwardDirection? this.points[this.points.length-1].year+1: this.points[this.points.length-1].year-1;
    }

    Lt.metaDataText.updateText(); // updates after points are cut
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  };

  /**
   * insert a point in the middle of the measurement data
   * @function insertPoint
   */
  MeasurementData.prototype.insertPoint = function(latLng) {
    let direction = directionCheck();
    var disList = [];

    // closest point index
    var i = Lt.helper.closestPointIndex(latLng);
    if (!i && i != 0) {
      alert('New point must be within existing points. Use the create toolbar to add new points to the series.');
      return;
    };

    var new_points = this.points;
    var second_points = this.points.slice().splice(i);
    var k = i;
    var year_adjusted;
    var earlywood_adjusted = true;


    if (this.points[i - 1] && this.points[i]) {
      if (this.points[i - 1].earlywood && measurementOptions.subAnnual) { // case 1: subAnnual enabled & previous point ew
        earlywood_adjusted = false;
        if (direction == forwardInTime) {
          year_adjusted = this.points[i - 1].year;
        } else if (direction == backwardInTime) {
          year_adjusted = this.points[i].year;
        };

      } else if (this.points[i - 1].start || this.points[i].start) { // case 2: previous or closest point is start
          year_adjusted = this.points[i].year;
          if (this.points[i - 2] && this.points[i - 2].earlywood && measurementOptions.subAnnual && direction == forwardInTime) {
            earlywood_adjusted = false;
          } else if (this.points[i - 2] && !this.points[i - 2].earlywood && measurementOptions.subAnnual && direction == backwardInTime) {
            earlywood_adjusted = true;
          } else if (direction == backwardInTime) {
            earlywood_adjusted = false;
          };

      } else { // case 3: subAnnual disabled or previous point lw
        if (direction == forwardInTime) {
          year_adjusted = this.points[i - 1].year + 1;
        } else if (direction == backwardInTime) {
          year_adjusted = this.points[i].year;
        };
      };
    } else {
      alert('Please insert new point closer to connecting line.')
    };

    if (year_adjusted === undefined) {
      return;
    };

    new_points[k] = {'start': false, 'skip': false, 'break': false,
      'year': year_adjusted, 'earlywood': earlywood_adjusted,
      'latLng': latLng};

    var tempK = k;

    k++;

    second_points.map(e => {
      if(!e) {
       return;
      }
      if (!e.start && !e.break) {
        if (measurementOptions.subAnnual) { // case 1: subAnnual enabled
          e.earlywood = !e.earlywood;
          if (e.earlywood) {
            if (direction == forwardInTime) {
              e.year++;
            } else if (direction == backwardInTime) {
              e.year--;
            };
          };

        } else { // case 2: subAnnual disabled
          if (direction == forwardInTime) {
            e.year++;
          } else if (direction == backwardInTime) {
            e.year--;
          };
        };
      };
      new_points[k] = e;
      k++;
    });

    this.points = new_points;
    this.index = k;
    if (measurementOptions.subAnnual) {
      this.earlywood = !this.earlywood;
    };
    if (!this.points[this.index - 1].earlywood || !measurementOptions.subAnnual) { // add year if forward
      if (direction == forwardInTime) {
        this.year++
      } else {
        this.year--
      };
    };

    Lt.metaDataText.updateText(); // updates after a single point is inserted
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
    return tempK;
  };

  /**
   * insert a zero growth year in the middle of the measurement data
   * @function insertZeroGrowth
   */
  MeasurementData.prototype.insertZeroGrowth = function(i, latLng) {
    let direction = directionCheck();
    var new_points = this.points;
    var second_points = this.points.slice().splice(i + 1, this.index - 1);
    var k = i + 1;

    var subAnnualIncrement = Lt.measurementOptions.subAnnual == true;
    var annualIncrement = Lt.measurementOptions.subAnnual == false;

    // ensure correct inserted point order
    if (direction == forwardInTime) {
      var firstEWCheck = true;
      var secondEWCheck = false;
      var firstYearAdjusted = this.points[i].year + 1;
      var secondYearAdjusted = firstYearAdjusted;
    } else if (direction == backwardInTime) {
      var firstEWCheck = false;
      var secondEWCheck = true;
      var firstYearAdjusted = this.points[i].year;
      var secondYearAdjusted = this.points[i].year - 1;
      if (annualIncrement) {
        var firstEWCheck = true;
        var firstYearAdjusted = secondYearAdjusted;
      }
    }

    new_points[k] = {'start': false, 'skip': false, 'break': false,
      'year': firstYearAdjusted, 'earlywood': firstEWCheck, 'latLng': latLng};

    k++;

    if (subAnnualIncrement) {
      new_points[k] = {'start': false, 'skip': false, 'break': false,
        'year': secondYearAdjusted, 'earlywood': secondEWCheck, 'latLng': latLng};
      k++;
    }

    var tempK = k-1;

    second_points.map(e => {
      if (e && !e.start && !e.break) {
        if (direction == forwardInTime) {
          e.year++;
        } else if (direction == backwardInTime) {
          e.year--;
        };
      };
      new_points[k] = e;
      k++;
    });

    this.points = new_points;
    this.index = k;

    if (direction == forwardInTime) {
      this.year++;
    } else if (direction == backwardInTime) {
      this.year--;
    };

    Lt.metaDataText.updateText(); // updates after a single point is inserted
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
    return tempK;
  };

  /**
   * remove any entries in the data
   * @function clean
   */
  MeasurementData.prototype.clean =function() {
    for (var i in this.points) {
      if (this.points[i] === null || this.points[i] === undefined) {
        delete this.points[i];
      }
    }
  };

  /**
   * getter for all data
   * @function data
   */
  MeasurementData.prototype.data = function() {
    return {'saveDate': this.saveDate, 'year': this.year,
        'earlywood': this.earlywood, 'index': this.index, 'points': this.points,
        'annotations': this.annotations};
  };
}

function AnnotationData (annotations) {
  if (annotations !== undefined) {
    this.annotations = annotations.annotations || annotations;
    this.index = annotations.index || 0;
  } else {
    this.annotations = {};
    this.index = 0;
  }

  AnnotationData.prototype.deleteAnnotation = function(i) {
    delete this.annotations[i];
  }
}

/**
 * Autoscroll feature for mouse
 * @constructor
 * @param {Leaflet Map Object} viewer - a refrence to the leaflet map object
 */
function Autoscroll (viewer) {

  /**
   * Turn on autoscroll based on viewer dimmensions
   * @function on
   */
  Autoscroll.prototype.on = function() {
    var mapSize = viewer.getSize();   // Map size used for map scrolling
    var mousePos = 0;                 // An initial mouse position

    viewer.on('mousemove', (e) => {
      var modifierState = event.getModifierState("Shift");
      // Don't autopan if shift is held
      if(modifierState) {
        return;
      }
      var oldMousePos = mousePos;     // Save the old mouse position
      mousePos = e.containerPoint;    // Container point of the mouse

      //left bound of the map
      if (mousePos.x <= 40 && mousePos.y > 60 && oldMousePos.x > mousePos.x) {
        viewer.panBy([-200, 0]);
      }
      //right bound of the map
      if (mousePos.x + 40 > mapSize.x && mousePos.y > 100 && oldMousePos.x < mousePos.x) {
        viewer.panBy([200, 0]);
      }
      //upper bound of the map
      if (mousePos.x > 390 && mousePos.x + 60 < mapSize.x && mousePos.y < 40 && oldMousePos.y > mousePos.y) {
        viewer.panBy([0, -70]);
      }
      //lower bound of the map
      if (mousePos.x >= 40 && mousePos.y > mapSize.y - 40 && oldMousePos.y < mousePos.y) {
        viewer.panBy([0, 70]);
      }
    });
  };

  /**
   * Turn off autoscroll
   * @function off
   */
  Autoscroll.prototype.off = function() {
    viewer.off('mousemove');
  };

  /**
   * Reset autoscroll when the viewer's dimmensions are resized
   * @function reset
   */
  Autoscroll.prototype.reset = function() {
    this.off();
    this.on();
  };
}

/**
 * A function that returns a leaflet icon given a particular color
 * @function
 * @param {string} color - a color string
 * @param {string} LtBasePath - the base path of the asset
 */
function MarkerIcon(color, imagePath) {

  var colors = {
    'light_blue': { 'path': imagePath + 'images/light_blue_rect_circle_dot_crosshair.png',
                    'size': [32, 48] },
    'dark_blue' : { 'path': imagePath + 'images/dark_blue_rect_circle_dot_crosshair.png',
                    'size': [32, 48] },
    'white_start'   : { 'path': imagePath + 'images/white_tick_icon.png',
                    'size': [32, 48] },
    'white_break'   : { 'path': imagePath + 'images/white_rect_circle_dot_crosshair.png',
                    'size': [32, 48] },
    'red'       : { 'path': imagePath + 'images/red_dot_icon.png',
                    'size': [12, 12] },
    'light_red'  : { 'path': imagePath + 'images/cb_light_red_tick_icon.png',
                    'size': [32, 48] },
    'pale_red' : { 'path': imagePath + 'images/cb_pale_red_tick_icon.png',
                    'size': [32, 48] },
  };

  return L.icon({
    iconUrl : colors[color].path,
    iconSize: colors[color].size
  });
}

/**
 * The mouse line created between a click location and the cursor
 * @constructor
 * @param {LTreering} Lt - a refrence to the leaflet treering object
 */
function MouseLine (Lt) {
  this.layer = L.layerGroup().addTo(Lt.viewer);
  this.active = false;
  this.pathGuide = false;

  this.btn = new Button ('expand', 'Toggle appearance of measurement h-bar',
             () => { Lt.disableTools; this.btn.state('active'); this.pathGuide = true },
             () => { this.btn.state('inactive'); this.pathGuide = false }
            );

  /**
   * Enable the mouseline
   * @function enable
   */
  MouseLine.prototype.enable = function() {
    this.active = true;
  }

  /**
   * Disable the mouseline
   * @function disable
   */
  MouseLine.prototype.disable = function() {
    this.active = false;
    $(Lt.viewer.getContainer()).off('mousemove');
    this.layer.clearLayers();
  }

  /**
   * A method to create a new line from a given latLng
   * @function from
   * @param {Leatlet LatLng Object} latLng - the latLng coordinate on the viewer
   *   to create a line from
   */
  MouseLine.prototype.from = function(latLng) {
    var newX, newY;

    var scalerCoefficient = 1.3; // multiplys length between point & mouse
    function newCoordCalc (pointA, pointB, pointC) {
      return pointA + (scalerCoefficient * (pointB - pointC));
    };

    $(Lt.viewer.getContainer()).mousemove(e => {
      if (this.active) {
        this.layer.clearLayers();
        var mousePoint = Lt.viewer.mouseEventToLayerPoint(e);
        var mouseLatLng = Lt.viewer.mouseEventToLatLng(e);
        var point = Lt.viewer.latLngToLayerPoint(latLng);

        /* Getting the four points for the h bars, this is doing 90 degree rotations on mouse point */
        newX = newCoordCalc(mousePoint.x, mousePoint.y, point.y);
        newY = newCoordCalc(mousePoint.y, point.x, mousePoint.x);
        var topRightPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        newX = newCoordCalc(mousePoint.x, point.y, mousePoint.y);
        newY = newCoordCalc(mousePoint.y, mousePoint.x, point.x);
        var bottomRightPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        //doing rotations 90 degree rotations on latlng
        newX = newCoordCalc(point.x, point.y, mousePoint.y);
        newY = newCoordCalc(point.y, mousePoint.x, point.x);
        var topLeftPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        newX = newCoordCalc(point.x, mousePoint.y, point.y);
        newY = newCoordCalc(point.y, point.x, mousePoint.x);
        var bottomLeftPoint = Lt.viewer.layerPointToLatLng([newX, newY]);

        //color for h-bar
        var color;
        if (Lt.data.earlywood || !Lt.measurementOptions.subAnnual) {
          color = '#00BCD4';
        } else {
          color = '#00838f';
        }

        if (this.pathGuide) {
          // y = mx + b
          var m = (mousePoint.y - point.y) / (mousePoint.x - point.x);
          var b = point.y - (m * point.x);

          // finds x value along a line some distance away
          // found by combining linear equation & distance equation
          // https://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
          function distanceToX (xNaut, distance) {
            var x = xNaut + (distance / (Math.sqrt(1 + (m ** 2))));
            return x;
          };

          function linearEq (x) {
            var y = (m * x) + b;
            return y;
          };

          var pathLength = 100;
          if (mousePoint.x < point.x) { // mouse left of point
            var pathLengthOne = pathLength;
            var pathLengthTwo = -pathLength;
          } else { // mouse right of point
            var pathLengthOne = -pathLength;
            var pathLengthTwo = pathLength;
          };

          var xOne = distanceToX(point.x, pathLengthOne);
          var xTwo = distanceToX(mousePoint.x, pathLengthTwo);

          if (mousePoint.y < point.y) { // mouse below point
            var verticalFixOne = point.y + pathLength;
            var verticalFixTwo = mousePoint.y - pathLength;
          } else { // mouse above point
            var verticalFixOne = point.y - pathLength;
            var verticalFixTwo = mousePoint.y + pathLength;
          };

          var yOne = linearEq(xOne) || verticalFixOne; // for vertical measurements
          var yTwo = linearEq(xTwo) || verticalFixTwo; // vertical asymptotes: slope = undefined

          var latLngOne = Lt.viewer.layerPointToLatLng([xOne, yOne]);
          var latLngTwo = Lt.viewer.layerPointToLatLng([xTwo, yTwo]);

          // path guide for point
          this.layer.addLayer(L.polyline([latLng, latLngOne],
              {interactive: false, color: color, opacity: '.75',
                weight: '3'}));

          // path guide for mouse
          this.layer.addLayer(L.polyline([mouseLatLng, latLngTwo],
              {interactive: false, color: color, opacity: '.75',
                weight: '3'}));

        };

        this.layer.addLayer(L.polyline([latLng, mouseLatLng],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));

        this.layer.addLayer(L.polyline([topLeftPoint, bottomLeftPoint],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));
        this.layer.addLayer(L.polyline([topRightPoint, bottomRightPoint],
            {interactive: false, color: color, opacity: '.75',
              weight: '3'}));
      }
    });
  }
}

/**
  * Method to reduce MarkerIcon usage
  * @function getMarker
  * @param {Leaflet latlng} iconLatLng
  * @param {Marker icon} color
  * @param {Icon imagepath} iconImagePath
  * @param {Drag ability} iconDrag
  * @param {Marker title} title
  */
function getMarker(iconLatLng, color, iconImagePath, iconDrag, title) {
  return L.marker(iconLatLng, {
        icon: new MarkerIcon(color, iconImagePath),
        draggable: iconDrag,
        title: title,
        riseOnHover: true
      })
  };

/**
 * Visual assets on the map such as markers and lines
 * @constructor
 * @param {LTreering} Lt - a refrence to the leaflet treering object
 */
function VisualAsset (Lt) {
  this.markers = new Array();
  this.lines = new Array();
  this.markerLayer = L.layerGroup().addTo(Lt.viewer);
  this.lineLayer = L.layerGroup().addTo(Lt.viewer);
  this.previousLatLng = undefined;

  /**
   * Reload all visual assets on the viewer
   * @function reload
   */
  VisualAsset.prototype.reload = function() {
    //erase the markers
    this.markerLayer.clearLayers();
    this.markers = new Array();
    //erase the lines
    this.lineLayer.clearLayers();
    this.lines = new Array();

    //plot the data back onto the map
    if (Lt.data.points !== undefined) {
      Object.values(Lt.data.points).map((e, i) => {
        if (e != undefined) {
          this.newLatLng(Lt.data.points, i, e.latLng);
        }
      });
    }
  }

  /**
   * A method used to create new markers and lines on the viewer
   * @function newLatLng
   * @param {Array} points -
   * @param {int} i - index of points
   * @param {Leaflet LatLng Object} latLng -
   */
  VisualAsset.prototype.newLatLng = function(pts, i, latLng) {
    var leafLatLng = L.latLng(latLng);

    var draggable = false;
    if (window.name.includes('popout')) {
      draggable = true;
    }

    var marker;

    if (pts[i].start) { //check if index is the start point
      marker = getMarker(leafLatLng, 'white_start', Lt.basePath, draggable, 'Start');
    } else if (pts[i].break) { //check if point is a break
      marker = getMarker(leafLatLng, 'white_break', Lt.basePath, draggable, 'Break');
    } else if (Lt.measurementOptions.subAnnual) { //check if point subAnnual
        if (pts[i].earlywood) { //check if point is earlywood
          if (pts[i].year % 10 == 0) {
            // which marker asset is used depends on measurement direction
            if (Lt.measurementOptions.forwardDirection) { // check if years counting up
              marker = getMarker(leafLatLng, 'pale_red', Lt.basePath, draggable, 'Year ' + pts[i].year + ', earlywood');
            } else { // otherwise years counting down & marker assets need to be flipped
              marker = getMarker(leafLatLng, 'light_red', Lt.basePath, draggable, 'Year ' + pts[i].year + ', latewood');
            };
          } else {
            if (Lt.measurementOptions.forwardDirection) {
              marker = getMarker(leafLatLng, 'light_blue', Lt.basePath, draggable, 'Year ' + pts[i].year + ', earlywood');
            } else {
              marker = getMarker(leafLatLng, 'dark_blue', Lt.basePath, draggable, 'Year ' + pts[i].year + ', latewood');
            }
          }
        } else { //otherwise it's latewood
            if (pts[i].year % 10 == 0) {
              if (Lt.measurementOptions.forwardDirection) { // check if years counting up
                marker = getMarker(leafLatLng, 'light_red', Lt.basePath, draggable, 'Year ' + pts[i].year + ', latewood');
              } else { // otherwise years counting down
                marker = getMarker(leafLatLng, 'pale_red', Lt.basePath, draggable, 'Year ' + pts[i].year + ', earlywood');
              };
            } else {
              if (Lt.measurementOptions.forwardDirection) {
                marker = getMarker(leafLatLng, 'dark_blue', Lt.basePath, draggable, 'Year ' + pts[i].year + ', latewood');
              } else {
                marker = getMarker(leafLatLng, 'light_blue', Lt.basePath, draggable, 'Year ' + pts[i].year + ', earlywood');
              }
            }
        }
    } else {
      if (pts[i].year % 10 == 0) {
        marker = getMarker(leafLatLng, 'light_red', Lt.basePath, draggable, 'Year ' + pts[i].year)
      } else {
        marker = getMarker(leafLatLng, 'light_blue', Lt.basePath, draggable, 'Year ' + pts[i].year)
      }
    };

    this.markers[i] = marker;   //add created marker to marker_list

    //tell marker what to do when being dragged
    this.markers[i].on('drag', (e) => {
      if (!pts[i].start) {
        this.lineLayer.removeLayer(this.lines[i]);
        this.lines[i] =
            L.polyline([this.lines[i]._latlngs[0], e.target._latlng],
            { color: this.lines[i].options.color,
              opacity: '.75', weight: '3'});
        this.lineLayer.addLayer(this.lines[i]);
      }
      if (this.lines[i + 1] !== undefined) {
        this.lineLayer.removeLayer(this.lines[i + 1]);
        this.lines[i + 1] =
            L.polyline([e.target._latlng, this.lines[i + 1]._latlngs[1]],
            { color: this.lines[i + 1].options.color,
              opacity: '.75',
              weight: '3'
            });
        this.lineLayer.addLayer(this.lines[i + 1]);
      } else if (this.lines[i + 2] !== undefined && !pts[i + 1].start) {
        this.lineLayer.removeLayer(this.lines[i + 2]);
        this.lines[i + 2] =
            L.polyline([e.target._latlng, this.lines[i + 2]._latlngs[1]],
            { color: this.lines[i + 2].options.color,
              opacity: '.75',
              weight: '3' });
        this.lineLayer.addLayer(this.lines[i + 2]);
      }
    });

    //tell marker what to do when the draggin is done
    this.markers[i].on('dragend', (e) => {
      Lt.undo.push();
      pts[i].latLng = e.target._latlng;
      Lt.annotationAsset.reloadAssociatedYears();
    });

    //tell marker what to do when clicked
    this.markers[i].on('click', (e) => {
      if (Lt.deletePoint.active) {
        Lt.deletePoint.action(i);
      };

      if (Lt.convertToStartPoint.active) {
        Lt.convertToStartPoint.action(i);
      };

      if (Lt.cut.active) {
        if (Lt.cut.point != -1) {
          Lt.cut.action(i);
        } else {
          Lt.cut.fromPoint(i);
        };
      };

      if (Lt.insertZeroGrowth.active) {
        var subAnnual = Lt.measurementOptions.subAnnual;
        var pointEW = pts[i].earlywood == true;
        var pointLW = pts[i].earlywood == false;
        var yearsIncrease = Lt.measurementOptions.forwardDirection == true;
        var yearsDecrease = Lt.measurementOptions.forwardDirection == false;

        if ((subAnnual && ((pointEW && yearsIncrease) || (pointLW && yearsDecrease)))
            || pts[i].start || pts[i].break) {
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
      var opacity = '.5';
      var weight = '3';
      if (pts[i].earlywood || !Lt.measurementOptions.subAnnual ||
          (!pts[i - 1].earlywood && pts[i].break)) {
        var color = '#17b0d4'; // original = #00BCD4 : actual = #5dbcd
      } else {
        var color = '#026d75'; // original = #00838f : actual = #14848c
      };

      var comparisonPt = null;
      if (Lt.measurementOptions.forwardDirection) { // years counting up
        comparisonPt = pts[i].year
      } else { // years counting down
        comparisonPt = pts[i - 1].year;
      };

      //mark decades with red line
      if (comparisonPt % 10 == 0 && !pts[i].break) {
        var opacity = '.6';
        var weight = '5';
        if (Lt.measurementOptions.subAnnual && pts[i].earlywood) {
          var color = '#e06f4c' // actual pale_red = #FC9272
        } else {
          var color = '#db2314' // actual light_red = #EF3B2C
        };
      };

      this.lines[i] =
          L.polyline([pts[i - 1].latLng, leafLatLng],
          {color: color, opacity: opacity, weight: weight});
      this.lineLayer.addLayer(this.lines[i]);
    }

    this.previousLatLng = leafLatLng;
    //add the marker to the marker layer
    this.markerLayer.addLayer(this.markers[i]);
  };
}

function AnnotationAsset(Lt) {
  this.markers = new Array();
  this.markerLayer = L.layerGroup().addTo(Lt.viewer);

  this.colorDivIcon = L.divIcon( {className: '#ff1c22'} ); // default red color

  this.createBtn = new Button (
    'comment',
    'Create annotations (Ctrl-a)',
    () => { Lt.disableTools(); this.enable(this.createBtn) },
    () => { this.disable(this.createBtn) }
  );
  this.createBtn.active = false;

  this.deleteBtn = new Button (
    'delete',
    'Delete an annotation',
    () => { Lt.disableTools(); this.enable(this.deleteBtn) },
    () => { this.disable(this.deleteBtn) }
  );
  this.deleteBtn.active = false;

  // crtl-a to activate createBtn
  L.DomEvent.on(window, 'keydown', (e) => {
    if (e.keyCode == 65 && e.getModifierState("Control") && window.name.includes('popout')) { // 65 refers to 'a'
      e.preventDefault();
      e.stopPropagation();
      Lt.disableTools();
      this.enable(this.createBtn);
    }
  }, this);

  // Only creating an annotation is tied to button enabling. Editing & deleting
  // are connected to saveAnnotation()
  AnnotationAsset.prototype.enable = function (btn) {
    btn.state('active');
    btn.active = true;
    Lt.viewer.getContainer().style.cursor = 'pointer';

    this.latLng = {};
    if (btn === this.createBtn) {
      Lt.viewer.doubleClickZoom.disable();
      $(Lt.viewer.getContainer()).click(e => {
        Lt.disableTools();
        Lt.collapseTools();
        this.createBtn.active = true; // disableTools() deactivates all buttons, need create annotation active

        this.latLng = Lt.viewer.mouseEventToLatLng(e);

        // display icon
        this.annotationIcon = L.marker([0, 0], {
          icon: this.colorDivIcon,
          draggable: true,
          riseOnHover: true,
        });

        this.annotationIcon.setLatLng(this.latLng);

        this.annotationIcon.addTo(Lt.viewer);

        this.createAnnotationDialog();

      });
    };;
  };

  AnnotationAsset.prototype.disable = function (btn) {
    if (!btn) { // for Lt.disableTools()
      this.disable(this.createBtn);
      this.disable(this.deleteBtn);
      return
    };

    $(Lt.viewer.getContainer()).off('click');
    btn.state('inactive');
    btn.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
  };

  AnnotationAsset.prototype.createAnnotationDialog = function (annotation, index) {
    this.index = index;

    if (annotation) { // set all meta data objects, catches for undefined elsewhere
      this.latLng = annotation.latLng;
      this.color = annotation.color;
      this.text = annotation.text;
      this.code = annotation.code;
      this.description = annotation.description;
      this.checkedUniqueNums = annotation.checkedUniqueNums;
      this.calculatedYear = annotation.calculatedYear;
      this.yearAdjustment = annotation.yearAdjustment;
      this.year = annotation.year;
    } else {
      // want this.color to stay constant between creating annotations
      this.text = '';
      this.code = [];
      this.description = [];
      this.checkedUniqueNums = [];
      this.calculatedYear = 0;
      this.yearAdjustment = 0;
      this.year = 0;
    };

    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {;
      var cookieNameArray = cookieArray[i].split('=');
      var cookieNameIndex = cookieNameArray.indexOf('attributesObjectArray');
      var cookieAttributesObjectArray = cookieNameArray[cookieNameIndex + 1];
    };

    var defaultAttributes = [
      { 'title': 'Anatomical Anomaly',
        'options': [
                    {
                      'title': 'Fire Scar',
                      'code': 'FS',
                      'uniqueNum': '000000'
                    },
                    {
                      'title': 'Frost Ring',
                      'code': 'FR',
                      'uniqueNum': '000001'
                    },
                    {
                      'title': 'Intra-Annual Density Fluctuation',
                      'code': 'IADF',
                      'uniqueNum': '000002'
                    },
                    {
                      'title': 'Tramatic Resin Duct',
                      'code': 'TRD',
                      'uniqueNum': '000003'
                    },
                  ]
      },
      { 'title': 'Location',
        'options': [
                    {
                      'title': 'Earlywood',
                      'code': 'EW',
                      'uniqueNum': '000010'
                    },
                    {
                      'title': 'Latewood',
                      'code': 'LW',
                      'uniqueNum': '000020'
                    },
                    {
                      'title': 'Dormant',
                      'code': 'D',
                      'uniqueNum': '000030'
                    },
                  ]
      }
    ];

    if (!Lt.meta.attributesObjectArray || Lt.meta.attributesObjectArray.length == 0) {
      try {
        this.attributesObjectArray = JSON.parse(cookieAttributesObjectArray);
      }
      catch (error) {
        this.attributesObjectArray = defaultAttributes;
      }
    } else {
      if (Lt.meta.attributesObjectArray.length == 0) {
        this.attributesObjectArray = defaultAttributes;
      } else {
        this.attributesObjectArray = Lt.meta.attributesObjectArray;
      };
    };

    if (this.createBtn.active == false) {
      this.annotationIcon = this.markers[this.index];
    };

    let size = this.annotationDialogSize || [284, 265];
    let anchor = this.annotationDialogAnchor || [50, 5];

    this.dialogAnnotationWindow = L.control.dialog({
      'minSize': [284, 265],
      'maxSize': [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      'size': size,
      'anchor': anchor,
      'initOpen': true
    }).setContent(
      '<div id="tab" class="tab"> \
        <button class="tabLinks" id="summary-btn">Summary</button> \
        <button class="tabLinks" id="edit-summary-btn">Edit</button> \
      </div> \
      <div id="summary-tab" class="tabContent"></div> \
      <div id="edit-summary-tab" class="tabContent"></div>',
    ).addTo(Lt.viewer);

    // remember annotation size/location each times its resized/moved
    $(this.dialogAnnotationWindow._map).on('dialog:resizeend', () => { this.annotationDialogSize = this.dialogAnnotationWindow.options.size } );
    $(this.dialogAnnotationWindow._map).on('dialog:moveend', () => { this.annotationDialogAnchor = this.dialogAnnotationWindow.options.anchor } );

    // move between tabs & save edits
    var summaryBtn = document.getElementById('summary-btn');
    $(() => {
      $(summaryBtn).click(() => {
        if (this.dialogAttributesWindow) {
          this.dialogAttributesWindow.destroy();
          delete this.dialogAttributesWindow
        };
        this.summaryContent();
        this.openTab('summary-btn', 'summary-tab');
      });
    });

    var editBtn = document.getElementById('edit-summary-btn');
    if (window.name.includes('popout')) {
      $(editBtn).click(() => {
        this.editContent();
        this.openTab('edit-summary-btn', 'edit-summary-tab');
      });
    } else {
      editBtn.remove();
      summaryBtn.style.borderTopRightRadius = '10px';
      summaryBtn.style.borderBottomRightRadius = '10px';
    };

    // save & close dialog window when dialog closed w/ built in close button
    $(this.dialogAnnotationWindow._map).on('dialog:closed', (dialog) => {
      if (this.dialogAnnotationWindow && (dialog.originalEvent._content === this.dialogAnnotationWindow._content)) {
        if (this.createBtn.active) {
          this.saveAnnotation();
        } else {
          this.saveAnnotation(this.index);
          delete this.annotation;
          delete this.index;
        };

        if (this.dialogAttributesWindow) {
          this.dialogAttributesWindow.destroy();
          delete this.dialogAttributesWindow;
        };

        this.dialogAnnotationWindow.destroy();
        delete this.dialogAnnotationWindow;
      };
    });

    this.dialogAnnotationWindow.open();

    if (this.createBtn.active) { // if action is to create an annotation
      $(document).ready(() => {
        editBtn.click();
      });
    } else {
      $(document).ready(() => {
        summaryBtn.click();
      });
    };

  };

  AnnotationAsset.prototype.createAttributesDialog = function (attributeIndex) {
    this.attributeIndex = attributeIndex;

    let size = this.attributesDialogSize || [273, 215];
    let anchor = this.attributesDialogAnchor || [50, 294];

    this.dialogAttributesWindow = L.control.dialog({
      'minSize': [273, 215],
      'maxSize': [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      'size': size,
      'anchor': anchor,
      'initOpen': true
    }).setContent(
      '<div id="attributes-options"> \
        <label class="attribute-label" id="title-label" for="title-input">Title: </label> \
        <button class="annotation-btn" id="create-option"><i class="fa fa-plus" aria-hidden="true"></i></button> \
        <textarea class="attribute-textbox" id="title-input" placeholder="Title."></textarea> \
      </div> \
      <hr id="attributes-hr"> \
      <div> \
        <p id="attributes-warning"> Use ESC to exit without saving. </p> \
      </div>'
    ).addTo(Lt.viewer);

    // remember annotation size/location each times its resized/moved
    $(this.dialogAttributesWindow._map).on('dialog:resizeend', () => { this.attributesDialogSize = this.dialogAttributesWindow.options.size; console.log(this.attributesDialogSize);} );
    $(this.dialogAttributesWindow._map).on('dialog:moveend', () => { this.attributesDialogAnchor = this.dialogAttributesWindow.options.anchor } );

    let divIndex = -1;

    var addAttributeOption = document.getElementById('create-option');
    $(addAttributeOption).click(() => {
      divIndex += 1;
      var newOptionDiv = document.createElement('div');
      newOptionDiv.id = divIndex;

      var optionTitle = document.createElement('label');
      optionTitle.className = 'attribute-label';
      optionTitle.innerHTML = 'Option: '
      newOptionDiv.appendChild(optionTitle);

      var optionDeleteBtn = document.createElement('button');
      optionDeleteBtn.className = 'annotation-btn';
      optionDeleteBtn.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
      $(optionDeleteBtn).click(() => {
        // remove div & option description/code from this.description & this.code
        let descriptionTextarea = newOptionDiv.getElementsByTagName('DIV')[0].getElementsByTagName('TEXTAREA')[0];
        let codeTextarea = newOptionDiv.getElementsByTagName('DIV')[0].getElementsByTagName('TEXTAREA')[1];

        if (this.description.includes(descriptionTextarea.value)) {
          var indexOfDescriptor = this.description.indexOf(descriptionTextarea.value);
          this.description.splice(indexOfDescriptor, 1);
        };

        if (this.code.includes(codeTextarea.value)) {
          var indexOfCodeEntry = this.code.indexOf(codeTextarea.value);
          this.code.splice(indexOfCodeEntry, 1);
        };

        $(newOptionDiv).remove();

        // remove option from existing attribute
        if (this.attributeIndex || this.attributeIndex == 0) {
          let existingAttributeObject = this.attributesObjectArray[this.attributeIndex];
          existingAttributeObject.options.splice(newOptionDiv.id, 1);
        };
      });
      newOptionDiv.appendChild(optionDeleteBtn);

      var optionTextDiv = document.createElement('div');

      var optionTextbox = document.createElement('textarea');
      optionTextbox.className += 'attribute-option attribute-textbox';
      optionTextbox.placeholder = 'Description.';
      optionTextDiv.appendChild(optionTextbox);

      var optionTextCode = document.createElement('textarea');
      optionTextCode.className += 'attribute-option attribute-textbox';
      optionTextCode.placeholder = 'Code.';
      optionTextDiv.appendChild(optionTextCode);

      newOptionDiv.appendChild(optionTextDiv)

      var fullOptionDiv = document.getElementById('attributes-options');
      fullOptionDiv.appendChild(newOptionDiv);
    });

    // destroy window without saving anything with ESC
    $(document).keyup((e) => {
      if (e.keyCode === 27 && this.dialogAttributesWindow) {
        this.dialogAttributesWindow.destroy();
        delete this.dialogAttributesWindow
      };
    });

    /* Model for saving attributes:
    var attributesObjectArray = [
      { 'title': 'title 1',
        'options': [
                    {
                      'title': 'option 1',
                      'code': 'code 1',
                      'uniqueNum': 'uniqueNum 1'
                    },
                    {
                      'title': 'option 2',
                      'code': 'code 2',
                      'uniqueNum': 'uniqueNum 2'
                    },
                  ]
      };
    ];
    */

    // save & close dialog window when dialog closed w/ built in close button
    this.alertCount = 0
    $(this.dialogAttributesWindow._map).on('dialog:closed', (dialog) => {
      if (this.dialogAttributesWindow && (dialog.originalEvent._content === this.dialogAttributesWindow._content)) {
        let allOptionsTitled = false;
        let newAttributeObject = new Object ();
        let optionsArray = [];

        var titleText = document.getElementById('title-input').value;
        var optionsElmList = document.getElementsByClassName('attribute-option');

        if (optionsElmList.length == 0) {
          this.dialogAttributesWindow.open();
          alert("Attribute must have at least one option.");
        };

        function uniqueNumber () {
          let randomNumString = ''
          for (var t = 0; t <= 5; t++) {
            randomNum = Math.floor(Math.random() * 10)
            randomNumString += String(randomNum);
          };
          return randomNumString;
        };

        for (var i = 0, j = 0; i < optionsElmList.length; i += 2, j += 1) { // i index for textarea elements, j index for optionObjects. 2i = j
          if (titleText == "" || optionsElmList[i].value == "") {
            this.dialogAttributesWindow.open();
            if (this.alertCount == 0) { // alert fires 3 times without catch for unknown reason
              this.alertCount += 1;
              alert("Attribute must have a title and all options must be named.");
            };
            allOptionsTitled = false;
            break;
          } else {
            // optionsElmList[i] is the option text, optionsElmList[i + 1] is the option code
            // based on the order they are created above
            let option = optionsElmList[i].value
            let code = optionsElmList[i + 1].value || '-'; // '-' is filler
            if (this.attributeIndex || this.attributeIndex == 0) {
              let existingAttributeObject = this.attributesObjectArray[this.attributeIndex];
              if (!existingAttributeObject.options[j]) { //  if option was deleted or added
                var optionObject = new Object ();
              } else {
                var optionObject = existingAttributeObject.options[j];
              };
              optionObject.title = option;
              optionObject.code = code;
              allOptionsTitled = true;
              if (!existingAttributeObject.options[j]) { //  if option was deleted or added
                optionObject.uniqueNum = uniqueNumber();
                existingAttributeObject.options.push(optionObject);
              };
            } else {
              let optionObject = new Object ();
              optionObject.title = option;
              optionObject.code = code;
              optionObject.uniqueNum = uniqueNumber();
              optionsArray.push(optionObject);
              allOptionsTitled = true;
            };
          };
        };

        if (allOptionsTitled === true && (this.attributeIndex != 0 && !this.attributeIndex)) { // new attribute being created
          newAttributeObject.title = document.getElementById('title-input').value;
          newAttributeObject.options = optionsArray;
          this.attributesObjectArray.push(newAttributeObject);

          this.dialogAttributesWindow.destroy();
          delete this.dialogAttributesWindow
          this.createCheckboxes(document.getElementById('attributes-options-div'));

        } else if (allOptionsTitled === true && (this.attributeIndex || this.attributeIndex == 0)) { // existing attribute was edited.
          let existingAttributeObject = this.attributesObjectArray[this.attributeIndex];
          existingAttributeObject.title = document.getElementById('title-input').value;

          this.dialogAttributesWindow.destroy();
          delete this.dialogAttributesWindow
          delete this.attributeIndex;
          this.createCheckboxes(document.getElementById('attributes-options-div'));
        };
      };
    });
  };

  AnnotationAsset.prototype.createCheckboxes = function (attributesOptionsDiv) {
    attributesOptionsDiv.innerHTML = '';

    for (let [attributeIndex, attributeObject] of this.attributesObjectArray.entries()) {
      let soloAttributeDiv = document.createElement('div');

      let title = document.createElement('p');
      title.className = 'option-title';
      title.innerHTML = attributeObject.title;
      soloAttributeDiv.appendChild(title);

      let deleteAttributeBtn = document.createElement('button');
      deleteAttributeBtn.className = 'annotation-btn attribute-btn';
      deleteAttributeBtn.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
      $(deleteAttributeBtn).click((e) => {
        var divToDelete = e.target.parentNode.parentNode; // user will click <i> image not button
        for (let checkboxDiv of divToDelete.getElementsByTagName('DIV')) {
          let descriptor = checkboxDiv.getElementsByTagName('INPUT')[0].id
          let code = checkboxDiv.getElementsByTagName('INPUT')[0].value

          // remove descriptor and code from this.description & this.code
          if (this.description.includes(descriptor)) {
            let indexOfDescriptor = this.description.indexOf(descriptor);
            this.description.splice(indexOfDescriptor, 1);
          };

          if (this.code.includes(code)) {
            var indexOfCodeEntry = this.code.indexOf(code);
            this.code.splice(indexOfCodeEntry, 1);
          };
        };

        delete this.attributesObjectArray.splice(attributeIndex, 1);
        $(divToDelete).remove();
      });
      soloAttributeDiv.appendChild(deleteAttributeBtn);

      let editAttributeBtn = document.createElement('button');
      editAttributeBtn.className = 'annotation-btn attribute-btn';
      editAttributeBtn.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>';
      $(editAttributeBtn).click((e) => {
        // edits saved with createAttributesDialog save button
        this.createAttributesDialog(attributeIndex);
        this.dialogAttributesWindow.open();

        let inputTitle = document.getElementById('title-input');
        inputTitle.value = attributeObject.title;

        // reset attribute code & description
        let optionNodes = soloAttributeDiv.childNodes;
        for (let node of optionNodes) {
          if (node.tagName == 'div' || node.tagName == 'DIV') { // each checkbox is held in its own div
            // firstchild = checkbox input
            let inputDescription = node.firstChild.id;
            let inputCode = node.firstChild.value;

            document.getElementById('create-option').click();

            // get second to last textarea created aka the most recent description textarea
            let textareaDescriptionInput = document.getElementsByClassName('attribute-textbox')[document.getElementsByClassName('attribute-textbox').length - 2];
            textareaDescriptionInput.value = inputDescription;
            let inputDescriptionIndex = this.description.indexOf(inputDescription);

            // get last textarea created aka the most recent code textarea
            let textareaCodeInput = document.getElementsByClassName('attribute-textbox')[document.getElementsByClassName('attribute-textbox').length - 1];
            if (inputCode != '-') { // '-' is used as filler
              textareaCodeInput.value = inputCode;
            };
            let inputCodeIndex = this.code.indexOf(inputCode);

            $(textareaDescriptionInput).change(() => {
              if (node.firstChild.checked && inputDescriptionIndex !== -1) {
                this.description[inputDescriptionIndex] = textareaDescriptionInput.value;
              };
            });

            $(textareaCodeInput).change(() => {
              if (node.firstChild.checked && inputCodeIndex !== -1) {
                if (!textareaCodeInput.value) {
                  this.code[inputCodeIndex] = '-'; // '-' is used as filler
                } else {
                  this.code[inputCodeIndex] = textareaCodeInput.value;
                };
              };
            });
          };
        };

      });
      soloAttributeDiv.appendChild(editAttributeBtn);

      let optionsArray = attributeObject.options || [];
      for (let option of optionsArray) {
        /* option =
              {
                'title': 'option 1',
                'code': 'code 1',
                'uniqueNum': 'number 1',
              },
        */
        let optionTitle = option.title;
        let optionCode = option.code;
        let optionUniqueNum = option.uniqueNum;

        let soloOptionDiv = document.createElement('div');
        soloOptionDiv.className = 'attribute-option-divs';

        let checkbox = document.createElement('input');
        checkbox.className = 'checkboxes';
        checkbox.type = 'checkbox';
        checkbox.id = optionTitle;
        checkbox.value = optionCode;
        checkbox.name = optionUniqueNum;

        if (this.checkedUniqueNums && this.checkedUniqueNums.includes(checkbox.name)) {
          checkbox.checked = true;
        };

        $(checkbox).change(() => { // any checkbox changes are saved;
          this.code = [];
          this.description = [];
          this.checkedUniqueNums = [];

          checkboxClass = document.getElementsByClassName('checkboxes')
          for (let checkboxIndex in checkboxClass) {
            if (checkboxClass[checkboxIndex].checked) {
              this.code.push(checkboxClass[checkboxIndex].value);
              this.description.push(checkboxClass[checkboxIndex].id);
              this.checkedUniqueNums.push(checkboxClass[checkboxIndex].name);
            };
          };
        });
        soloOptionDiv.appendChild(checkbox);

        let label = document.createElement('label');
        label.innerHTML = optionTitle;
        label.for = optionTitle;
        soloOptionDiv.appendChild(label);

        soloAttributeDiv.appendChild(soloOptionDiv);
      };

      attributesOptionsDiv.appendChild(soloAttributeDiv);
    };
  };

  AnnotationAsset.prototype.nearestYear = function (latLng) {
    var closestI = Lt.helper.closestPointIndex(latLng);
    if ((Lt.measurementOptions.forwardDirection == false) || (closestI == Lt.data.points.length)) {
     // correct index when measuring backwards or if closest point is last point
     closestI--;
   };

    var closestPt = Lt.data.points[closestI];
    var closestYear;

    // find closest year to annotation
    if (!closestPt) {
      closestYear = 0;
    } else if (!closestPt.year && closestPt.year != 0) { // case 1: start or break point
      var previousPt = Lt.data.points[closestI - 1];
      var nextPt = Lt.data.points[closestI + 1];

      if (!previousPt) { // case 2: inital start point
        closestYear = nextPt.year
      } else if (!nextPt) { // case 3: last point is a start point
        closestYear = previousPt.year
      } else if (nextPt && !nextPt.year) { // case 4: break point & next point is a start point
        closestYear = Lt.data.points[closestI + 2].year;
      } else if (!previousPt.year) { // case 5: start point & previous point is a break point
        closestYear = Lt.data.points[closestI + 1].year;
      } else { // case 6: start point in middle of point path
        var distanceToPreviousPt = Math.sqrt(Math.pow((closestPt.lng - previousPt.lng), 2) + Math.pow((closestPt.lat - previousPt.lat), 2));
        var distanceToNextPt = Math.sqrt(Math.pow((closestPt.lng - nextPt.lng), 2) + Math.pow((closestPt.lat - nextPt.lat), 2));

        if (distanceToNextPt > distanceToPreviousPt) {
          closestYear = previousPt.year;
        } else {
          closestYear = nextPt.year;
        };
      };
    } else {
      closestYear = closestPt.year;
    };

    return closestYear;
  };

  AnnotationAsset.prototype.createMouseEventListeners = function (index) {
    // how marker reacts when dragged
    this.markers[index].on('dragend', (e) => {
      Lt.aData.annotations[index].latLng = e.target._latlng;
      Lt.annotationAsset.reloadAssociatedYears();
    });

    // how marker reacts when clicked
    $(this.markers[index]).click(() => {
      if (this.deleteBtn.active) { // deleteing
        Lt.aData.deleteAnnotation(index);
        Lt.annotationAsset.reload();
      } else { // viewing or editing
        Lt.collapseTools();
        if (this.dialogAnnotationWindow) {
          this.dialogAnnotationWindow.destroy();
          delete this.dialogAnnotationWindow
        };
        this.createAnnotationDialog(Lt.aData.annotations[index], index);
      };
    });

    // how marker reacts when moussed over
    $(this.markers[index]).mouseover(() => {
      this.markers[index].bindPopup('<div id="mouseover-popup-div"></div>', { minWidth:160, closeButton:false }).openPopup();

      var popupDiv = document.getElementById('mouseover-popup-div');

      if (Lt.aData.annotations[index].text) { // only show text description if text exists
        var popupTextTitle = document.createElement('h5');
        popupTextTitle.className = 'annotation-title';
        popupTextTitle.innerHTML = 'Text: ';
        popupDiv.appendChild(popupTextTitle);

        var popupText = document.createElement('p');
        popupText.className = 'text-content';
        popupText.style.marginTop = 0;
        popupText.style.marginBottom = '4px';
        popupText.innerHTML = Lt.aData.annotations[index].text;
        popupDiv.appendChild(popupText);
      };

      if (Lt.aData.annotations[index].description && Lt.aData.annotations[index].description.length > 0) { // only show attributes if attributes exist/selected
        var popupDescriptionTitle = document.createElement('h5');
        popupDescriptionTitle.className = 'annotation-title';
        popupDescriptionTitle.style.margin = 0;
        popupDescriptionTitle.innerHTML = 'Attributes: '
        popupDiv.appendChild(popupDescriptionTitle);

        var popupDescriptionList = document.createElement('ul');
        popupDescriptionList.style.marginBottom = '3px';
        for (var descriptorIndex in Lt.aData.annotations[index].description) {
          var listElm = document.createElement('li');
          listElm.innerHTML = Lt.aData.annotations[index].description[descriptorIndex];
          popupDescriptionList.appendChild(listElm);
        };
        popupDiv.appendChild(popupDescriptionList);
      };

      var popupYearTitle = document.createElement('h5');
      popupYearTitle.style.margin = 0;
      popupYearTitle.className = 'annotation-title';
      popupYearTitle.innerHTML = 'Associated Year: ';
      popupDiv.appendChild(popupYearTitle);

      var popupYear = document.createElement('span');
      popupYear.className = 'text-content';
      popupYear.style.cssFloat = 'right';
      Lt.aData.annotations[index].calculatedYear = this.nearestYear(Lt.aData.annotations[index].latLng);
      popupYear.innerHTML = Lt.aData.annotations[index].calculatedYear + Lt.aData.annotations[index].yearAdjustment;
      popupDiv.appendChild(popupYear);
    });

    $(this.markers[index]).mouseout(() => {
      this.markers[index].closePopup();
    });
  };

  AnnotationAsset.prototype.openTab = function (btnName, tabName) {
    var i;
    var tabContent;
    var tabLinks;

    tabContent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabContent.length; i++) {
      tabContent[i].style.display = "none";
    };

    tabLinks = document.getElementsByClassName("tabLinks");
    for (i = 0; i < tabLinks.length; i++) {
      tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    };

    if (tabName && btnName) {
      document.getElementById(tabName).style.display = "block";
      document.getElementById(btnName).className += " active";
    };
  };

  AnnotationAsset.prototype.summaryContent = function () {
    var summaryDiv = document.getElementById('summary-tab');
    summaryDiv.innerHTML = '';

    // Start: text
    var summaryTextDiv = document.createElement('div');
    summaryTextDiv.className = 'summaryTextDiv';

    var textTitle = document.createElement('h5');
    textTitle.id = 'text-title';
    textTitle.innerHTML = "Text:";
    summaryTextDiv.appendChild(textTitle);

    var textContent = document.createElement('p');
    textContent.className = 'text-content';
    if (this.text == "") {
      textContent.innerHTML = 'N/A';
    } else {
      textContent.innerHTML = this.text;
    };

    summaryTextDiv.appendChild(textContent);
    summaryDiv.appendChild(summaryTextDiv);
    // End: text

    // Start: attributes
    var summaryAttributesDiv = document.createElement('div');
    summaryAttributesDiv.className = 'summaryAttributesDiv';

    var attributesTitle = document.createElement('h5');
    attributesTitle.className = 'annotation-title'
    attributesTitle.innerHTML = "Attributes:";
    summaryAttributesDiv.appendChild(attributesTitle);

    var attributeCode = document.createElement('p');
    attributeCode.className = 'text-content';
    attributeCode.style.margin = 0;
    var code = '';
    if (this.code && this.code.length > 0) {
      for (var codeEntry of this.code) {
        code += codeEntry;
      }
    } else {
      code = 'N/A';
    };
    attributeCode.innerHTML = 'Attributes Code: ' + code;
    summaryAttributesDiv.appendChild(attributeCode);

    var attributesDescription = document.createElement('p');
    attributesDescription.className = 'text-content';
    attributesDescription.style.margin = 0;
    attributesDescription.innerHTML = 'Attributes:';
    summaryAttributesDiv.appendChild(attributesDescription);

    var attributesList = document.createElement('ul');
    summaryAttributesDiv.appendChild(attributesList);
    if (this.description && this.description.length > 0) {
      var descriptionList = this.description;
    } else {
      var descriptionList = [];
      var descriptorElm = document.createElement('li');
      descriptorElm.innerHTML = 'N/A';
      attributesList.appendChild(descriptorElm);
    };

    for (var descriptor in descriptionList) {
      var descriptorElm = document.createElement('li')
      descriptorElm.innerHTML = descriptionList[descriptor];
      attributesList.appendChild(descriptorElm);
    };

    summaryDiv.appendChild(summaryAttributesDiv);
    // End: attributes

    // START: associated year
    var summaryAssociatedYearDiv = document.createElement('div');
    summaryAssociatedYearDiv.className = 'summaryAssociatedYearDiv';

    var associatedYearTitle = document.createElement('h5');
    associatedYearTitle.innerHTML = 'Associated Year: ';
    associatedYearTitle.className = 'annotation-title';
    summaryAssociatedYearDiv.appendChild(associatedYearTitle);

    var associatedYearSpan = document.createElement('span');
    associatedYearSpan.className = 'text-content';
    this.calculatedYear = this.nearestYear(this.latLng);
    associatedYearSpan.innerHTML = this.calculatedYear + this.yearAdjustment;
    summaryAssociatedYearDiv.appendChild(associatedYearSpan);

    summaryDiv.appendChild(summaryAssociatedYearDiv);
    // END: associated year

    // START: link to annotation
    var summaryLinkDiv = document.createElement('div');
    summaryLinkDiv.className = 'summaryLinkDiv';

    var getURL = window.location.href;
    var parsedURL = new URL(getURL);

    var lat = this.latLng.lat;
    var lng = this.latLng.lng;
    // round to 5 decimal places
    lat = lat.toFixed(5);
    lng = lng.toFixed(5);

    var existingLatParam = parsedURL.searchParams.get("lat");
    var existingLngParam = parsedURL.searchParams.get("lng");
    if (!existingLatParam || !existingLngParam) { // url parameters don't exist
      parsedURL.searchParams.append("lat", lat);
      parsedURL.searchParams.append("lng", lng);
    } else { // url parameters already exist
      parsedURL.searchParams.set("lat", lat);
      parsedURL.searchParams.set("lng", lng);
    };

    var linkTitle = document.createElement('h5');
    linkTitle.innerHTML = '<a href=' + String(parsedURL) + '> Annotation GeoLink</a>';
    linkTitle.className = 'annotation-title';
    linkTitle.id = 'link-title';
    summaryLinkDiv.appendChild(linkTitle)

    var copyLinkBtn = document.createElement('button');
    copyLinkBtn.className = 'annotation-link-btn';
    copyLinkBtn.innerHTML = '<i class="fa fa-clone" aria-hidden="true"></i>';
    $(copyLinkBtn).click(() => {
      window.copyToClipboard(parsedURL);
    });
    summaryLinkDiv.appendChild(copyLinkBtn);

    summaryDiv.appendChild(summaryLinkDiv);
    // END : link to annotation
  };

  AnnotationAsset.prototype.editContent = function () {
    var editDiv = document.getElementById('edit-summary-tab');
    editDiv.innerHTML = ''; // reset div so elements do not duplicate

    // Start: text
    var editTextDiv = document.createElement('div');
    editTextDiv.className = 'editTextDiv';

    var textTitle = document.createElement('h5');
    textTitle.id = 'text-title';
    textTitle.innerHTML = "Text:";
    editTextDiv.appendChild(textTitle);

    var textBox = document.createElement('TEXTAREA');
    textBox.value = this.text;
    $(textBox).change(() => { //  any text changes are saved
      this.text = textBox.value;
    });

    editTextDiv.appendChild(textBox);
    editDiv.appendChild(editTextDiv);
    // End: text

    // Start: attributes
    var editAttributesDiv = document.createElement('div');
    editAttributesDiv.className = 'editAttributesDiv';

    var attributesTitle = document.createElement('h5');
    attributesTitle.className = 'annotation-title'
    attributesTitle.innerHTML = "Attributes:";
    editAttributesDiv.appendChild(attributesTitle);

    // add a new attribute options
    var openAttributeEditButton = document.createElement('button');
    openAttributeEditButton.className = 'annotation-btn';
    openAttributeEditButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
    $(openAttributeEditButton).click(() => {
      if (this.dialogAttributesWindow) {
        this.dialogAttributesWindow.destroy();
        delete this.dialogAttributesWindow;
      };
      this.createAttributesDialog();
      this.dialogAttributesWindow.open();
      document.getElementById('create-option').click(); // add 2 options by default
      document.getElementById('create-option').click();
    });
    editAttributesDiv.appendChild(openAttributeEditButton);

    var attributesOptionsDiv = document.createElement('div');
    attributesOptionsDiv.id = 'attributes-options-div';
    this.createCheckboxes(attributesOptionsDiv);

    editAttributesDiv.appendChild(attributesOptionsDiv);
    editDiv.appendChild(editAttributesDiv);
    // END: attributes

    // START: associated year
    var editAssociatedYearDiv = document.createElement('div');
    editAssociatedYearDiv.className = 'editAssociatedYearDiv';

    var associatedYearTitle = document.createElement('h5');
    associatedYearTitle.innerHTML = 'Associated Year: ';
    associatedYearTitle.className = 'annotation-title';
    editAssociatedYearDiv.appendChild(associatedYearTitle);

    var associatedYearInput = document.createElement('input');
    associatedYearInput.type = 'number';
    this.calculatedYear = this.nearestYear(this.latLng);
    associatedYearInput.value = this.calculatedYear + this.yearAdjustment;
    $(associatedYearInput).change(() => {
      this.year = associatedYearInput.value;
      this.yearAdjustment = associatedYearInput.value - this.calculatedYear;
    });
    editAssociatedYearDiv.appendChild(associatedYearInput);

    editDiv.appendChild(editAssociatedYearDiv);
    // END: associated year

    // START: color selection
    var editColorDiv = document.createElement('div');
    editColorDiv.className = 'editColorDiv';

    var colorTitle = document.createElement('h5');
    colorTitle.className = 'annotation-title';
    colorTitle.innerHTML = 'Color: '
    colorTitle.style.display = 'block';
    editColorDiv.appendChild(colorTitle);

    var colorPalette = {
      'red': '#ff1c22',
      'green': '#17b341',
      'blue': '#1395d1',
      'purple': '#db029f',
    };

    for (color in colorPalette) { // create color buttons
      var colorBtn = document.createElement('button');
      var hexCode = colorPalette[color];
      colorBtn.className = 'color-btn';
      colorBtn.style.backgroundColor = hexCode;
      colorBtn.id = hexCode;
      $(colorBtn).click((e) => {
        this.colorDivIcon = L.divIcon( {className: e.currentTarget.id} );
        this.annotationIcon.setIcon(this.colorDivIcon);

        var colorBtnList = document.getElementsByClassName('color-btn');
        for (var i = 0; i < colorBtnList.length; i++) { // deselect other buttons
          colorBtnList[i].style.boxShadow = "0 0 0 0";
        };
        e.currentTarget.style.boxShadow = "0 0 0 4px #b8b8b8";
      });

      editColorDiv.appendChild(colorBtn);
    };

    for (var j = 0; j < editColorDiv.childNodes.length; j++) {
      var iconColor = this.colorDivIcon.options.className;
      var buttonColor = editColorDiv.childNodes[j].id;
      if (iconColor == buttonColor) {
        editColorDiv.childNodes[j].click();
      };
    };

    editDiv.appendChild(editColorDiv);
    // END: color selection
  };

  AnnotationAsset.prototype.saveAnnotation = function (index) {
    var content = {
      'latLng': this.latLng,
      'color': this.colorDivIcon.options.className,
      'text': this.text,
      'code': this.code,
      'description': this.description,
      'checkedUniqueNums': this.checkedUniqueNums,
      'calculatedYear': this.calculatedYear,
      'yearAdjustment': this.yearAdjustment,
      'year': this.year,
    };
    Lt.meta.attributesObjectArray = this.attributesObjectArray;
    document.cookie = 'attributesObjectArray=' + JSON.stringify(this.attributesObjectArray) + '; max-age=60*60*24*365';

    if (this.createBtn.active) {
      var newIndex = Lt.aData.index;
      Lt.aData.index++;

      Lt.aData.annotations[newIndex] = content;
      this.markers[newIndex] = this.annotationIcon;

      this.createMouseEventListeners(newIndex);

      this.markerLayer.addLayer(this.markers[newIndex]);

      this.disable(this.createBtn);
    } else {
      Lt.aData.annotations[index] = content;
    };
  };

  AnnotationAsset.prototype.reloadAssociatedYears = function () {
      Object.values(Lt.aData.annotations).map((e) => {
        e.calculatedYear = this.nearestYear(e.latLng);
        e.yearAdjustment = e.yearAdjustment || 0;
        e.year = e.calculatedYear + e.yearAdjustment;
      });
  };

  AnnotationAsset.prototype.reload = function () {
    this.markerLayer.clearLayers();
    this.markers = [];
    Lt.aData.index = 0;
    if (Lt.aData.annotations != undefined) {
      // remove null or undefined elements
      var reducedArray = Object.values(Lt.aData.annotations).filter(e => e != undefined);
      Lt.aData.annotations = {};
      reducedArray.map((e, i) => Lt.aData.annotations[i] = e);

      this.reloadAssociatedYears();

      Object.values(Lt.aData.annotations).map((e, i) => {
        var draggable = false;
        if (window.name.includes('popout')) {
          draggable = true;
        };

        e.color = e.color || '#ff1c22';

        this.annotationIcon = L.marker([0, 0], {
          icon: L.divIcon( {className: e.color} ),
          draggable: true,
          riseOnHover: true,
        });

        this.annotationIcon.setLatLng(e.latLng);
        this.annotationIcon.addTo(Lt.viewer);

        this.markers[i] = this.annotationIcon;
        this.createMouseEventListeners(i);

        this.markerLayer.addLayer(this.markers[i]);

        Lt.aData.index++;
      });
    }
  };

};

/**
 * Scale bar for orientation & screenshots
 * @constructor
 * @param {LTreering} - Lt
 */
function ScaleBarCanvas (Lt) {
  var scaleBarDiv = document.createElement('div');
  var nativeWindowWidth = Lt.viewer.getContainer().clientWidth;

  scaleBarDiv.innerHTML =
      '<div id="scale-bar-div"> \
       <canvas id="scale-bar-canvas" width="' + nativeWindowWidth + '" height="100"></canvas> \
       </div>';
  document.getElementsByClassName('leaflet-bottom leaflet-left')[0].appendChild(scaleBarDiv);

  var canvas = document.getElementById("scale-bar-canvas");
  var ctx = canvas.getContext("2d");

  var map = Lt.viewer;

  ScaleBarCanvas.prototype.load = function () {
    var pixelWidth;
    map.eachLayer(function (layer) {
      if (layer.options.maxNativeZoom) {
        var leftMostPt = layer.options.bounds._southWest;
        var rightMostPt = layer.options.bounds._northEast;
        pixelWidth = map.project(rightMostPt, Lt.getMaxNativeZoom()).x;
      }
    });

    var windowZoom = true; // used to set initial zoom level
    function modifyScaleBar() {
      ctx.clearRect(0, 0, nativeWindowWidth, 100);

      if (windowZoom) {
        this.initialZoomLevel = map.getZoom();
        windowZoom = false;
      }

      var metricWidth = pixelWidth / Lt.meta.ppm;
      var currentZoomLevel = map.getZoom();
      var zoomExponentialChange = Math.pow(Math.E, -0.693 * (currentZoomLevel - this.initialZoomLevel)); // -0.693 found from plotting zoom level with respect to length in excel then fitting expoential eq.

      var tenth_metricLength = (metricWidth * zoomExponentialChange) / 10;

      this.value = 'Error';
      this.unit = ' nm';
      this.mmValue = 0;
      this.maxValue = Math.round(tenth_metricLength / 10000);

      this.unitTable =
        {
          row: [
            {
              begin: 10000,
              end: Number.MAX_SAFE_INTEGER,
              value: this.maxValue * 10,
              mmValue: this.maxValue * 1000,
              unit: ' m',
            },

            {
              begin: 5000,
              end: 10000,
              value: 10,
              mmValue: 10000,
              unit: ' m',
            },

            {
              begin: 1000,
              end: 5000,
              value: 5,
              mmValue: 5000,
              unit: ' m',
            },

            {
              begin: 500,
              end: 1000,
              value: 1,
              mmValue: 1000,
              unit: ' m',
            },

            {
              begin: 200,
              end: 500,
              value: 50,
              mmValue: 500,
              unit: ' cm',
            },

            {
              begin: 50,
              end: 200,
              value: 10,
              mmValue: 100,
              unit: ' cm',
            },

            {
              begin: 30,
              end: 50,
              value: 5,
              mmValue: 50,
              unit: ' cm',
            },

            {
              begin: 8,
              end: 30,
              value: 10,
              mmValue: 10,
              unit: ' mm',
            },

            {
              begin: 3,
              end: 8,
              value: 5,
              mmValue: 5,
              unit: ' mm',
            },

            {
              begin: 1,
              end: 3,
              value: 1,
              mmValue: 1,
              unit: ' mm',
            },

            {
              begin: 0.3,
              end: 1,
              value: 0.5,
              mmValue: 0.5,
              unit: ' mm',
            },

            {
              begin: 0.05,
              end: 0.3,
              value: 0.1,
              mmValue: 0.1,
              unit: ' mm',
            },

            {
              begin: 0.03,
              end: 0.05,
              value: 0.05,
              mmValue: 0.05,
              unit: ' mm',
            },

            {
              begin: 0.005,
              end: 0.03,
              value: 0.01,
              mmValue: 0.01,
              unit: ' mm',
            },

            {
              begin: 0.003,
              end: 0.005,
              value: 5,
              mmValue: 0.005,
              unit: ' um',
            },

            {
              begin: 0.0005,
              end: 0.003,
              value: 1,
              mmValue: 0.001,
              unit: ' um',
            },

            {
              begin: Number.MIN_SAFE_INTEGER,
              end: 0.0005,
              value: 0.5,
              mmValue: 0.0005,
              unit: ' um',
            },
          ]
        };

      var table = this.unitTable;
      var i;
      for (i = 0; i < table.row.length; i++) {
        if (table.row[i].end > tenth_metricLength && tenth_metricLength >= table.row[i].begin) {
          this.value = table.row[i].value;
          this.unit = table.row[i].unit;
          this.mmValue = table.row[i].mmValue;
        };
      };

      var stringValue_tenthMetric_ratio = this.mmValue / tenth_metricLength;
      var pixelLength = stringValue_tenthMetric_ratio * (nativeWindowWidth / 10);
      var rounded_metricLength = '~' + String(this.value) + this.unit;

      ctx.fillStyle = '#f7f7f7'
      ctx.globalAlpha = .7;
      ctx.fillRect(0, 70, pixelLength + 70, 30); // background

      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 1;
      ctx.font = "12px Arial"
      ctx.fillText(rounded_metricLength, pixelLength + 15, 90); // scale bar length text

      ctx.fillRect(10, 90, pixelLength, 3); // bottom line
      ctx.fillRect(10, 80, 3, 10); // left major line
      ctx.fillRect(pixelLength + 7, 80, 3, 10); // right major line

      var i;
      for (i = 0; i < 4; i++) {
        var distanceBetweenTicks = pixelLength / 5
        var x = (distanceBetweenTicks) * i;
        ctx.fillRect(x + distanceBetweenTicks + 10, 85, 1, 5); // 10 = initial canvas x value
      };
    }

    map.on("resize", modifyScaleBar);
    map.on("zoom", modifyScaleBar);
  };
};

/*****************************************************************************/

/**
 * A wrapper object around leaflet buttons
 * @constructor
 * @param {string} icon - a material design icon name
 * @param {string} toolTip - a tool tip message
 * @param {function} enable - the function for onClick events
 * @param {function} disable - this is an option function for stateful buttons
 */
function Button(icon, toolTip, enable, disable) {
  var states = [];
  states.push({
    stateName: 'inactive',
    icon: '<i class="material-icons md-18">' + icon + '</i>',
    title: toolTip,
    onClick: enable
  });
  if (disable !== null) {
    if (icon == 'expand') { // only used for mouse line toggle
      var icon = 'compress';
      var title = 'Disable h-bar path guide';
    } else {
      var icon = 'clear';
      var title = 'Cancel';
    }
    states.push({
      stateName: 'active',
      icon: '<i class="material-icons md-18">' + icon + '</i>',
      title: title,
      onClick: disable
    })
  }
  return L.easyButton({states: states});
}

/**
 * A collapsable button bar
 * @constructor
 * @param {LTreering} Lt - a leaflet treering object
 * @param {Button[]} btns - a list of Buttons that belong to the button bar
 * @param {string} icon - a material design icon name
 * @param {string} toolTip - a tool tip message
 */
function ButtonBar(Lt, btns, icon, toolTip) {
  this.btns = btns;

  this.btn = L.easyButton({
    states: [
      {
        stateName: 'collapse',
        icon: '<i class="material-icons md-18">'+icon+'</i>',
        title: toolTip,
        onClick: () => {
          Lt.disableTools();
          Lt.collapseTools();
          this.expand();
        }
      },
      {
        stateName: 'expand',
        icon: '<i class="material-icons md-18">expand_less</i>',
        title: 'Collapse',
        onClick: () => {
          this.collapse();
        }
      }]
  });

  this.bar = L.easyBar([this.btn].concat(this.btns));

  /**
   * Expand the menu bar
   * @function expand
   */
  ButtonBar.prototype.expand = function() {
    this.btn.state('expand');
    this.btns.forEach(e => { e.enable() });
  }

  /**
   * Collapse the menu bar
   * @function collapse
   */
  ButtonBar.prototype.collapse = function() {
    this.btn.state('collapse');
    this.btns.forEach(e => { e.disable() });
  }

  this.collapse();
}

/*****************************************************************************/

/**
 * A popout of the leaflet viewer
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Popout(Lt) {
  this.btn = new Button('launch', 'Enter Popout Mode to access the full suite\nof measurement and annotation tools', () => {
    window.open(Lt.meta.popoutUrl, 'popout' + Math.round(Math.random()*10000),
                'location=yes,height=600,width=800,scrollbars=yes,status=yes');
  });
};

/** A popout with time series plots
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
 function PopoutPlots (Lt) {
   this.btn = new Button('launch',
                         'Open time series plots in a new window',
                         () => {
                           this.win = window.open('plot.html', '', 'height=600,width=' + String(screen.width));

                           this.win.onload = () => {
                             // reset plot from user changes
                             var resetButton = this.win.document.createElement('button');
                             resetButton.className = 'plot-inputs';
                             resetButton.innerHTML = 'Reset plot'
                             resetButton.addEventListener('click', () => {
                               this.parseFiles(fileInput.files);
                             });
                             this.win.document.getElementById('files').insertBefore(resetButton, this.win.document.getElementById('instructions'));

                             // clear all data except core data from plot
                             var clearButton = this.win.document.createElement('button');
                             clearButton.className = 'plot-inputs';
                             clearButton.innerHTML = 'Clear added data'
                             clearButton.addEventListener('click', () => {
                               fileInput.value = null;
                               this.prepData_forPlotting();
                             });
                             this.win.document.getElementById('files').insertBefore(clearButton, this.win.document.getElementById('instructions'));

                             // file input
                             var fileInput = this.win.document.createElement('input');
                             fileInput.className = 'plot-inputs';
                             fileInput.id = 'fileInput';
                             fileInput.type = 'file';
                             fileInput.setAttribute('accept', '.txt, .json, .csv, .rwl');
                             fileInput.setAttribute('multiple', '');
                             fileInput.addEventListener('input', () => {
                               this.parseFiles(fileInput.files);
                             });
                             this.win.document.getElementById('files').insertBefore(fileInput, this.win.document.getElementById('instructions'));

                             // set width & height of buttons based on file input
                             var height = String(parseInt($(fileInput).height()) + 10); // add 10 for padding
                             resetButton.style.height = height;
                             clearButton.style.height = height;

                             // auto-spaghetti plot number limit
                             var numberLimit = this.win.document.getElementById('auto-spaghetti-number')
                             numberLimit.addEventListener('change', () => {
                               this.parseFiles(fileInput.files);
                             });

                             this.prepData_forPlotting();

                           }
                         });

  PopoutPlots.prototype.parseJSONPts = function (pts, name) {
    var years = []; // x-axis
    var widths = []; // y-axis
    this.breakDis = 0;
    pts.map((e, i) => { // collect year & width data from points array
      if (e.start) {
        if (!pts[i - 1] || !pts[i - 1].break) { // first start point or non break start point
          this.prevPt = e;
        } else if (pts[i - 1].break){ // start point after break point
          var j = pts[i - 1].latLng;
          this.breakDis = Lt.helper.trueDistance(pts[i - 1].latLng, e.latLng);
        };
      } else if (e.year) { // measurement point
        years.push(e.year);
        var width  = Lt.helper.trueDistance(this.prevPt.latLng, e.latLng);
        widths.push(width - this.breakDis);

        this.breakDis = 0;
        this.prevPt = e;

      };
    });

    return {years: years, widths: widths, name: name};

  };

  PopoutPlots.prototype.parseFiles = function (files) {
    // FileReader is slow, so need to have seperate functions to keep file order

    if (files.length == 0) { // if no files, just plot core's JSON data
      this.prepData_forPlotting();
      return
    }

    var i = 0
    var parsedFiles = [];
    function addToParsedFiles (file, lastFile) {
      parsedFiles.push(file);

      if (lastFile) {
        Lt.popoutPlots.parseData(parsedFiles);
      } else {
        i++;
        nextFile(i)
      };
    };

    function nextFile (i) {
      var lastFile = false;
      if (i == files.length - 1) {
        lastFile = true;
      }

      let file = files[i];

      if (file.type == 'application/json') {
        addToParsedFiles(file, lastFile);
      } else {
        let fr = new FileReader();
        fr.onload = function(event, i) {
          var parsedFile = Papa.parse(event.target.result, {delimitersToGuess: [',', '\t']});
          addToParsedFiles(parsedFile, lastFile);
        };
        fr.readAsText(file);
      };
    }

    if (files && files.length > 0) { // start function call chain
      nextFile(i);
    };
  };

  PopoutPlots.prototype.parseData = function (files) {
    // need functions to regulate file reading order since FileReader() is slower than JS line execution
    // ie. FileReader called first but finishes after code called below it

    // function call order: parseFile => addToDataset => last file? no => parseFile => ...
    //                                                              yes => createPlots

    var datasets = [];
    // format = [{years: [...], widths: [...], name: '...'}, {years: [...], widths: [...], name: '...'}, ...]
    function addToDataset (set, all_data_parsed, i) {
      datasets.push(set);

      if (all_data_parsed) {
        return Lt.popoutPlots.prepData_forPlotting(datasets);
      } else {
        i++;
        parseFile(i);
      };
    };

    function parseFile (i) {
      var file = files[i];

      var all_data_parsed = false;
      if (i == files.length - 1) {
        all_data_parsed = true;
      };

      if (file.type) { // only data not parsed is JSON files
        let fr = new FileReader();
        fr.onload = function(e) { // use callback function b/c file reading is slow
          var jsonData = fr.result;
          var pts = JSON.parse(jsonData).points;

          if (JSON.parse(jsonData).forwardDirection == false) { // if measured backwards in time, reverse
            var pts = Lt.helper.reverseData(pts);
          };

          if (JSON.parse(jsonData).subAnnual == true) { // remove all earlywood points
            var pts = pts.filter(e => e && !e.earlywood);
          }

          var name = file.name.split('.')[0]; // removes .type
          var ptsSet = Lt.popoutPlots.parseJSONPts(pts, name);
          addToDataset(ptsSet, all_data_parsed, i);
        };
        fr.readAsText(file);

      } else { // data formatted by papaparse
        // format = [[year, name], [1900, 1], [1901, 2], ...]
        var data = file.data;
        if (file.errors.length > 0) { // RWL or space delimited result in errors

          // space delimited has a years in far left column, RWL had specimen names
          // way to tell them apart
          var split_second_row = data[1][0].split(/[\s]+/);
          var test_string = split_second_row[0];
          if (isNaN(parseFloat(test_string))) { // rwl has a string in this spot, space demlimited has year
            var rwlFormat = true;
            // need to remove header if it exists, row = header when 9th character is string
            var headerLength = 0;
            for (array of data) {
              var test_character = array[0].charAt(9);
              if (isNaN(parseFloat(test_character))) {
                headerLength++;
              } else {
                break
              }
            }
            data.splice(0, headerLength);

          } else {
            var rwlFormat = false;
          }

          var formattedData = [];
          var rwlSplitData = [];
          for (array of data) {
            var splitData = array[0].split(/[\s]+/);
            if (!rwlFormat) { // space demlimited
              formattedData.push(splitData);
            } else { // rwl
              rwlSplitData.push(splitData);
            };
          };

          function toMM (num) {
            if (num.length == 4) {
              // 1234 => 1.234
              return num.slice(0, 1) + '.' + num.slice(1);
            } else if (num.length == 3) {
              // 123 => 0.123
              return '0.' + num
            } else if (num.length == 2) {
              // 12 => 0.012
              return '0.0' + num
            } else {
              // 1 => 0.001
              return '0.00' + num
            }
          }

          // format of rwlSplitData = [[name, 1928, width, width],[name, 1930, width, width, ...], ...]
          // change to format = [[year, name, name, ...], [1928, width, width, ...], [1929, width, width...], ...]
          if (rwlSplitData.length > 0) {
            // 1) build header
            var newHeader = ['Year'];
            var currentName = '';
            for (array of rwlSplitData) {
              let rowName = array[0];
              if (rowName != currentName && rowName) {
                newHeader.push(rowName);
                currentName = rowName;
              };
            };
            // add header at end
            // 2) create arrays for all years
            var earliestYear = Number.MAX_SAFE_INTEGER;
            var latestDecade =  -1 * Number.MAX_SAFE_INTEGER;
            var latestYear = 0;
            var rwlData1 = JSON.parse(JSON.stringify(rwlSplitData)); // create new array for data so old one is not modified
            for (array of rwlData1) {
              var year = parseInt(array[1]);
              if (year < earliestYear) { // find first year
                earliestYear = year;
              } else if (year > latestDecade) { // find last year
                array.splice(0, 2) // remove row name & decade/year
                array = array.filter((e) => { // remove sentinel, sentinel = indicator of specimens final width
                  if ((isNaN(parseFloat(e)) == false) &&
                  (parseFloat(e) > 0) &&
                  (e != '999')) {
                    return e
                  }
                });
                var years_to_add = array.length - 1; // add number of widths to found year, subtract 1 b/c RWL starts at 0 not 1
                latestDecade = year;
                latestYear = year + years_to_add;
              }
            }
            for (var k = earliestYear; k <= latestYear; k++) {
              var newArray = [];
              newArray.push(String(k));
              formattedData.push(newArray);
            }
            // 3) format & add widths to data
            var rwlData2 = JSON.parse(JSON.stringify(rwlSplitData)); // create new array for data so old one is not modified
            var prev_name = '';
            var newSet = true;
            for (rwlArray of rwlData2) {
              var curr_name = rwlArray[0];
              if (curr_name == prev_name) {
                newSet = false;
              } else {
                newSet = true;
                prev_name = curr_name;
              }

              var startYear = parseFloat(rwlArray[1]);
              var yearAdj = 0; // index of width in RWL as well as that widths year
              rwlArray.splice(0, 2); // remove row name & decade/year
              for (array of formattedData) {
                var year_in_formattedData = array[0];
                if (yearAdj > rwlArray.length - 1) {
                  yearAdj = 0;
                  break
                }
                var year_in_rwlData = String(startYear + yearAdj);
                if (year_in_rwlData == year_in_formattedData) {
                  var width_to_test = rwlArray[yearAdj];
                  if ((isNaN(parseFloat(width_to_test)) == false) &&
                      (parseFloat(width_to_test) > 0) &&
                      (width_to_test != '999')) {
                    // check that width is not a sentinel (indicator of end of core)
                    var width = toMM(rwlArray[yearAdj])
                    array.push(width);
                    yearAdj++
                  } else { // if sentinel, add -1 (missing data indicator) to rest of formattedData
                    var current_array_index = formattedData.indexOf(array);
                    for (var l = current_array_index; l < formattedData.length; l++) {
                      var array_needing_neg_one = formattedData[l];
                      array_needing_neg_one.push('-1');
                    }
                    break
                  }
                } else if (newSet == true) {
                  array.push('-1')
                }
              }
            }
            // 4) add header
            formattedData.unshift(newHeader);

          };

          var data = formattedData;

        };

        // formatted data from above or data from papaparse (CSV, tab demlimited)
        // files could have multiple data sets
        // format = [[year 1, width 1, width 2], [year 2, width 3, width 4]... ]
        // data[i][j]: i = row index, j = column index
        // empty cells are empty strings ""
        // assumptions: 1) first column = years, 2) following columns = new data set widths

        var headers = [];
        for (header of data[0]) {
          let fixedHeader = header.split(/[\s]+/).join(''); // remove spaces befor eor after header name
          headers.push(fixedHeader);
        }
        headers.splice(0, 1); // remove "Year" header from array so only dataset headers/names remain

        // create X objects for X headers to denote each point set
        var pointSets = [];
        for (header of headers) {
          let set = new Object();
          set.name = header;
          set.years = [];
          set.widths = [];
          pointSets.push(set);
        };

        data.splice(0, 1); // remove headers
        data.forEach((row, j) => {
          row.forEach((col, k) => {
            if (k != 0) { // assume first column is years, skip year now, use later
              // 1) check if width is a measurment or a sentinel for missing data
              // sentinel is a word or negative value
              let width = parseFloat(col);
              if ((isNaN(width) == false) && (width > 0)) {
                // 2) add measurement & year to pointSets
                let set = pointSets[k - 1]; // subtract 1 to account for missing year header is pointSets
                set.widths.push(String(width));
                set.years.push(row[0]);
              }
            }
          });
        });

        // 3) add each point set to datasets
        pointSets.forEach((set, w) => {
          // if w not the last set in pointSets, need to loop until it is so all sets are pushed
          if (pointSets.length > 1 && w != pointSets.length - 1) {
            datasets.push(set);
          } else {
            addToDataset(set, all_data_parsed, i);
          }
        });

      };
    };

    // start function call chain
    var i = 0;
    parseFile(i);

  };

  PopoutPlots.prototype.median = function (data, x_name, y_name, color_loc) {
    // auto spaghetti plot
    // 1) find median width (across all data) per year
    var longestDataLength = 0;
    for (set of data) {
      var setLength = set[y_name].length;
      if (setLength > longestDataLength) {
        longestDataLength = setLength;
      }
    }

    var medianYears = [];
    var medianWidths = [];
    var year_to_find_median_width_for = Number.MAX_SAFE_INTEGER;
    var last_year_to_account_for = -1 * (Number.MAX_SAFE_INTEGER);

    for (set of data) {
      let years = set[x_name].filter(Boolean);

      var sets_first_year = parseInt(years[0])
      if (sets_first_year < year_to_find_median_width_for) { // find oldest (smallest) year in all sets of data
        year_to_find_median_width_for = sets_first_year;
      }

      var sets_last_year = parseInt(years[years.length - 1])
      if (sets_last_year > last_year_to_account_for) { // find most recent (largest) year in all sets of data
        last_year_to_account_for = sets_last_year;
      }
    }

    while (year_to_find_median_width_for <= last_year_to_account_for) {
      var single_year_widths = []
      for (set of data) { // loop through data sets
        for (let i = 0; i < set[x_name].length; i++) { // loop through years & widths of each data set
          if ((set[x_name].length > 0) && (parseInt(set[x_name][i]) == year_to_find_median_width_for)) {
            single_year_widths.push(parseFloat(set[y_name][i]));
          }
        }
      }

      single_year_widths.sort( (a, b) => { return a - b} ); // sort into asscending order
      if (single_year_widths.length == 0) {
        medianWidths.push('0');
      } else if (single_year_widths.length % 2 == 0) { // if even length, need to take average of middle values
        var midUpper = (single_year_widths.length / 2);
        var midLower = (single_year_widths.length / 2) - 1;
        var value = String((single_year_widths[midUpper] + single_year_widths[midLower]) / 2);
        medianWidths.push(value);
      } else {
        var mid = Math.floor(single_year_widths.length / 2);
        medianWidths.push(String(single_year_widths[mid]));
      }
      medianYears.push(String(year_to_find_median_width_for));
      year_to_find_median_width_for++;
    }

    // 2) add to data
    var medianSet = new Object();
    medianSet[y_name] = medianWidths;
    medianSet[x_name] = medianYears;
    medianSet.name = 'Median';
    var color = (color_loc == "line") ? ({color: '#000000'}) : ('#000000');
    medianSet[color_loc] = color;

    return medianSet
  }

  PopoutPlots.prototype.spline = function (data, x_name, y_name, color_loc) {
    var spline_data = [];
    for (i in data[y_name]) {
      let pt_obj = new Object();
      pt_obj.x = parseInt(data[x_name][i]); // ring width
      pt_obj.y = parseFloat(parseFloat(data[y_name][i]).toFixed(4)); // year
      spline_data.push(pt_obj);
    }

    var year_freq = 20;
    var lambda = 9.9784 * Math.log(year_freq) + 3.975;

    // const spline = smoothingSpline(spline_data, { lambda: lambda });
    // spline.points = [ {x: x0, y: y0}, {x: x1, y: y1}, ... ]
    var faux_spline_points = [
    {
        "x": 1800,
        "y": 0.5606886163317539
    },
    {
        "x": 1800.1,
        "y": 0.5607517331523634
    },
    {
        "x": 1800.2,
        "y": 0.5608182376354482
    },
    {
        "x": 1800.3,
        "y": 0.5608915139544085
    },
    {
        "x": 1800.4,
        "y": 0.5609749462826441
    },
    {
        "x": 1800.5,
        "y": 0.561071918793555
    },
    {
        "x": 1800.6,
        "y": 0.5611858156605412
    },
    {
        "x": 1800.7,
        "y": 0.5613200210570027
    },
    {
        "x": 1800.8,
        "y": 0.5614779191563392
    },
    {
        "x": 1800.9,
        "y": 0.5616628941319513
    },
    {
        "x": 1801,
        "y": 0.5618783301572378
    },
    {
        "x": 1801.1,
        "y": 0.5621278708458032
    },
    {
        "x": 1801.2,
        "y": 0.5624161975720665
    },
    {
        "x": 1801.3,
        "y": 0.5627482511506487
    },
    {
        "x": 1801.4,
        "y": 0.5631289723961737
    },
    {
        "x": 1801.5,
        "y": 0.5635633021232619
    },
    {
        "x": 1801.6,
        "y": 0.5640561811465366
    },
    {
        "x": 1801.7,
        "y": 0.5646125502806212
    },
    {
        "x": 1801.8,
        "y": 0.5652373503401356
    },
    {
        "x": 1801.9,
        "y": 0.5659355221397049
    },
    {
        "x": 1802,
        "y": 0.5667120064939479
    },
    {
        "x": 1802.1,
        "y": 0.5675717211221628
    },
    {
        "x": 1802.2,
        "y": 0.5685194913623425
    },
    {
        "x": 1802.3,
        "y": 0.5695601194571475
    },
    {
        "x": 1802.4,
        "y": 0.5706984076492474
    },
    {
        "x": 1802.5,
        "y": 0.5719391581813019
    },
    {
        "x": 1802.6,
        "y": 0.5732871732959784
    },
    {
        "x": 1802.7,
        "y": 0.574747255235945
    },
    {
        "x": 1802.8,
        "y": 0.5763242062438604
    },
    {
        "x": 1802.9,
        "y": 0.5780228285623961
    },
    {
        "x": 1803,
        "y": 0.5798479244342093
    },
    {
        "x": 1803.1,
        "y": 0.5818040331474876
    },
    {
        "x": 1803.2,
        "y": 0.5838946421724962
    },
    {
        "x": 1803.3,
        "y": 0.5861229760250047
    },
    {
        "x": 1803.4,
        "y": 0.5884922592208025
    },
    {
        "x": 1803.5,
        "y": 0.5910057162756579
    },
    {
        "x": 1803.6,
        "y": 0.5936665717053555
    },
    {
        "x": 1803.7,
        "y": 0.596478050025681
    },
    {
        "x": 1803.8,
        "y": 0.5994433757524008
    },
    {
        "x": 1803.9,
        "y": 0.6025657734013077
    },
    {
        "x": 1804,
        "y": 0.6058484674881662
    },
    {
        "x": 1804.1,
        "y": 0.6092942534107331
    },
    {
        "x": 1804.2,
        "y": 0.6129042100946454
    },
    {
        "x": 1804.3,
        "y": 0.6166789873474857
    },
    {
        "x": 1804.4,
        "y": 0.6206192349768704
    },
    {
        "x": 1804.5,
        "y": 0.6247256027903805
    },
    {
        "x": 1804.6,
        "y": 0.6289987405956236
    },
    {
        "x": 1804.7,
        "y": 0.633439298200209
    },
    {
        "x": 1804.8,
        "y": 0.6380479254117156
    },
    {
        "x": 1804.9,
        "y": 0.6428252720377632
    },
    {
        "x": 1805,
        "y": 0.6477719878859295
    },
    {
        "x": 1805.1,
        "y": 0.6528882218476189
    },
    {
        "x": 1805.2,
        "y": 0.6581721191494182
    },
    {
        "x": 1805.3,
        "y": 0.6636213241016733
    },
    {
        "x": 1805.4,
        "y": 0.6692334810147786
    },
    {
        "x": 1805.5,
        "y": 0.6750062341990785
    },
    {
        "x": 1805.6,
        "y": 0.6809372279649553
    },
    {
        "x": 1805.7,
        "y": 0.6870241066227923
    },
    {
        "x": 1805.8,
        "y": 0.6932645144829321
    },
    {
        "x": 1805.9,
        "y": 0.6996560958557727
    },
    {
        "x": 1806,
        "y": 0.7061964950516547
    },
    {
        "x": 1806.1,
        "y": 0.7128828800427796
    },
    {
        "x": 1806.2,
        "y": 0.7197105134486192
    },
    {
        "x": 1806.3,
        "y": 0.7266741815504162
    },
    {
        "x": 1806.4,
        "y": 0.7337686706294755
    },
    {
        "x": 1806.5,
        "y": 0.7409887669670383
    },
    {
        "x": 1806.6,
        "y": 0.7483292568443946
    },
    {
        "x": 1806.7,
        "y": 0.7557849265428345
    },
    {
        "x": 1806.8,
        "y": 0.7633505623435982
    },
    {
        "x": 1806.9,
        "y": 0.771020950527993
    },
    {
        "x": 1807,
        "y": 0.778790877377258
    },
    {
        "x": 1807.1,
        "y": 0.7866547598245412
    },
    {
        "x": 1807.2,
        "y": 0.794605537410419
    },
    {
        "x": 1807.3,
        "y": 0.8026357803272709
    },
    {
        "x": 1807.4,
        "y": 0.8107380587675495
    },
    {
        "x": 1807.5,
        "y": 0.8189049429236336
    },
    {
        "x": 1807.6,
        "y": 0.8271290029879572
    },
    {
        "x": 1807.7,
        "y": 0.835402809152955
    },
    {
        "x": 1807.8,
        "y": 0.8437189316110046
    },
    {
        "x": 1807.9,
        "y": 0.8520699405545595
    },
    {
        "x": 1808,
        "y": 0.8604484061759986
    },
    {
        "x": 1808.1,
        "y": 0.8688466964885113
    },
    {
        "x": 1808.2,
        "y": 0.8772563707883146
    },
    {
        "x": 1808.3,
        "y": 0.8856687861923235
    },
    {
        "x": 1808.4,
        "y": 0.8940752998175295
    },
    {
        "x": 1808.5,
        "y": 0.9024672687808474
    },
    {
        "x": 1808.6,
        "y": 0.91083605019925
    },
    {
        "x": 1808.7,
        "y": 0.9191730011897096
    },
    {
        "x": 1808.8,
        "y": 0.9274694788691413
    },
    {
        "x": 1808.9,
        "y": 0.9357168403545367
    },
    {
        "x": 1809,
        "y": 0.9439064427628108
    },
    {
        "x": 1809.1,
        "y": 0.9520296457273784
    },
    {
        "x": 1809.2,
        "y": 0.9600778189474186
    },
    {
        "x": 1809.3,
        "y": 0.9680423346385001
    },
    {
        "x": 1809.4,
        "y": 0.9759145650162624
    },
    {
        "x": 1809.5,
        "y": 0.9836858822962734
    },
    {
        "x": 1809.6,
        "y": 0.9913476586941553
    },
    {
        "x": 1809.7,
        "y": 0.9988912664255291
    },
    {
        "x": 1809.8,
        "y": 1.0063080777059645
    },
    {
        "x": 1809.9,
        "y": 1.0135894647510988
    },
    {
        "x": 1810,
        "y": 1.0207267997765028
    },
    {
        "x": 1810.1,
        "y": 1.0277116690314045
    },
    {
        "x": 1810.2,
        "y": 1.0345365148994585
    },
    {
        "x": 1810.3,
        "y": 1.0411939937978785
    },
    {
        "x": 1810.4,
        "y": 1.0476767621439436
    },
    {
        "x": 1810.5,
        "y": 1.0539774763548675
    },
    {
        "x": 1810.6,
        "y": 1.0600887928479126
    },
    {
        "x": 1810.7,
        "y": 1.0660033680403378
    },
    {
        "x": 1810.8,
        "y": 1.0717138583493635
    },
    {
        "x": 1810.9,
        "y": 1.0772129201922602
    },
    {
        "x": 1811,
        "y": 1.08249320998625
    },
    {
        "x": 1811.1,
        "y": 1.0875477812739718
    },
    {
        "x": 1811.2,
        "y": 1.0923712760995876
    },
    {
        "x": 1811.3,
        "y": 1.0969587336326068
    },
    {
        "x": 1811.4,
        "y": 1.101305193042581
    },
    {
        "x": 1811.5,
        "y": 1.105405693499021
    },
    {
        "x": 1811.6,
        "y": 1.10925527417147
    },
    {
        "x": 1811.7,
        "y": 1.112848974229466
    },
    {
        "x": 1811.8,
        "y": 1.1161818328425246
    },
    {
        "x": 1811.9,
        "y": 1.1192488891801922
    },
    {
        "x": 1812,
        "y": 1.1220451824119853
    },
    {
        "x": 1812.1,
        "y": 1.1245662658127558
    },
    {
        "x": 1812.2,
        "y": 1.1268097490786029
    },
    {
        "x": 1812.3,
        "y": 1.1287737560109214
    },
    {
        "x": 1812.4,
        "y": 1.1304564104111294
    },
    {
        "x": 1812.5,
        "y": 1.1318558360806246
    },
    {
        "x": 1812.6,
        "y": 1.132970156820817
    },
    {
        "x": 1812.7,
        "y": 1.1337974964331163
    },
    {
        "x": 1812.8,
        "y": 1.1343359787189253
    },
    {
        "x": 1812.9,
        "y": 1.1345837274796515
    },
    {
        "x": 1813,
        "y": 1.134538866516702
    },
    {
        "x": 1813.1,
        "y": 1.1342000660730283
    },
    {
        "x": 1813.2,
        "y": 1.1335681821577548
    },
    {
        "x": 1813.3,
        "y": 1.1326446172215552
    },
    {
        "x": 1813.4,
        "y": 1.1314307737150966
    },
    {
        "x": 1813.5,
        "y": 1.1299280540890544
    },
    {
        "x": 1813.6,
        "y": 1.128137860794098
    },
    {
        "x": 1813.7,
        "y": 1.1260615962808913
    },
    {
        "x": 1813.8,
        "y": 1.1237006630001165
    },
    {
        "x": 1813.9,
        "y": 1.1210564634024325
    },
    {
        "x": 1814,
        "y": 1.1181303999385237
    },
    {
        "x": 1814.1,
        "y": 1.1149243692171142
    },
    {
        "x": 1814.2,
        "y": 1.1114422444791758
    },
    {
        "x": 1814.3,
        "y": 1.1076883931237653
    },
    {
        "x": 1814.4,
        "y": 1.1036671825499047
    },
    {
        "x": 1814.5,
        "y": 1.0993829801566533
    },
    {
        "x": 1814.6,
        "y": 1.0948401533430427
    },
    {
        "x": 1814.7,
        "y": 1.0900430695081025
    },
    {
        "x": 1814.8,
        "y": 1.0849960960508935
    },
    {
        "x": 1814.9,
        "y": 1.0797036003704334
    },
    {
        "x": 1815,
        "y": 1.0741699498657875
    },
    {
        "x": 1815.1,
        "y": 1.068399881799725
    },
    {
        "x": 1815.2,
        "y": 1.0623996128899718
    },
    {
        "x": 1815.3,
        "y": 1.0561757297180343
    },
    {
        "x": 1815.4,
        "y": 1.0497348188653683
    },
    {
        "x": 1815.5,
        "y": 1.0430834669134814
    },
    {
        "x": 1815.6,
        "y": 1.0362282604438413
    },
    {
        "x": 1815.7,
        "y": 1.0291757860379132
    },
    {
        "x": 1815.8,
        "y": 1.0219326302772078
    },
    {
        "x": 1815.9,
        "y": 1.0145053797431756
    },
    {
        "x": 1816,
        "y": 1.0069006210173286
    },
    {
        "x": 1816.1,
        "y": 0.9991251417998718
    },
    {
        "x": 1816.2,
        "y": 0.9911865342659656
    },
    {
        "x": 1816.3,
        "y": 0.9830925917095625
    },
    {
        "x": 1816.4,
        "y": 0.9748511074245425
    },
    {
        "x": 1816.5,
        "y": 0.9664698747048612
    },
    {
        "x": 1816.6,
        "y": 0.9579566868444161
    },
    {
        "x": 1816.7,
        "y": 0.9493193371371046
    },
    {
        "x": 1816.8,
        "y": 0.9405656188768853
    },
    {
        "x": 1816.9,
        "y": 0.9317033253576334
    },
    {
        "x": 1817,
        "y": 0.9227402498733082
    },
    {
        "x": 1817.1,
        "y": 0.9136842103544148
    },
    {
        "x": 1817.2,
        "y": 0.9045431232778841
    },
    {
        "x": 1817.3,
        "y": 0.8953249297573224
    },
    {
        "x": 1817.4,
        "y": 0.8860375709062508
    },
    {
        "x": 1817.5,
        "y": 0.876688987838275
    },
    {
        "x": 1817.6,
        "y": 0.8672871216669361
    },
    {
        "x": 1817.7,
        "y": 0.8578399135057746
    },
    {
        "x": 1817.8,
        "y": 0.8483553044683969
    },
    {
        "x": 1817.9,
        "y": 0.8388412356683227
    },
    {
        "x": 1818,
        "y": 0.8293056482191559
    },
    {
        "x": 1818.1,
        "y": 0.8197563540706848
    },
    {
        "x": 1818.2,
        "y": 0.8102006485176629
    },
    {
        "x": 1818.3,
        "y": 0.8006456976911582
    },
    {
        "x": 1818.4,
        "y": 0.7910986677221492
    },
    {
        "x": 1818.5,
        "y": 0.7815667247417047
    },
    {
        "x": 1818.6,
        "y": 0.7720570348808202
    },
    {
        "x": 1818.7,
        "y": 0.7625767642705011
    },
    {
        "x": 1818.8,
        "y": 0.7531330790418105
    },
    {
        "x": 1818.9,
        "y": 0.743733145325731
    },
    {
        "x": 1819,
        "y": 0.7343841292533234
    },
    {
        "x": 1819.1,
        "y": 0.7250929526066869
    },
    {
        "x": 1819.2,
        "y": 0.7158655597722944
    },
    {
        "x": 1819.3,
        "y": 0.7067076507877849
    },
    {
        "x": 1819.4,
        "y": 0.6976249256907033
    },
    {
        "x": 1819.5,
        "y": 0.6886230845186869
    },
    {
        "x": 1819.6,
        "y": 0.6797078273093037
    },
    {
        "x": 1819.7,
        "y": 0.67088485410013
    },
    {
        "x": 1819.8,
        "y": 0.6621598649287919
    },
    {
        "x": 1819.9,
        "y": 0.6535385598328484
    },
    {
        "x": 1820,
        "y": 0.6450266388499231
    },
    {
        "x": 1820.1,
        "y": 0.6366294850308292
    },
    {
        "x": 1820.2,
        "y": 0.6283512134793122
    },
    {
        "x": 1820.3,
        "y": 0.620195622312415
    },
    {
        "x": 1820.4,
        "y": 0.6121665096471036
    },
    {
        "x": 1820.5,
        "y": 0.604267673600416
    },
    {
        "x": 1820.6,
        "y": 0.5965029122893373
    },
    {
        "x": 1820.7,
        "y": 0.5888760238308544
    },
    {
        "x": 1820.8,
        "y": 0.5813908063420008
    },
    {
        "x": 1820.9,
        "y": 0.574051057939751
    },
    {
        "x": 1821,
        "y": 0.5668605767411385
    },
    {
        "x": 1821.1,
        "y": 0.5598228111871636
    },
    {
        "x": 1821.2,
        "y": 0.5529398110148892
    },
    {
        "x": 1821.3,
        "y": 0.5462132762854384
    },
    {
        "x": 1821.4,
        "y": 0.5396449070598697
    },
    {
        "x": 1821.5,
        "y": 0.5332364033993086
    },
    {
        "x": 1821.6,
        "y": 0.5269894653648264
    },
    {
        "x": 1821.7,
        "y": 0.5209057930175099
    },
    {
        "x": 1821.8,
        "y": 0.5149870864184677
    },
    {
        "x": 1821.9,
        "y": 0.5092350456287684
    },
    {
        "x": 1822,
        "y": 0.5036513707095364
    },
    {
        "x": 1822.1,
        "y": 0.49823741745899675
    },
    {
        "x": 1822.2,
        "y": 0.4929931646240049
    },
    {
        "x": 1822.3,
        "y": 0.48791824668859923
    },
    {
        "x": 1822.4,
        "y": 0.48301229813677876
    },
    {
        "x": 1822.5,
        "y": 0.47827495345257776
    },
    {
        "x": 1822.6,
        "y": 0.4737058471200043
    },
    {
        "x": 1822.7,
        "y": 0.46930461362306986
    },
    {
        "x": 1822.8,
        "y": 0.46507088744580777
    },
    {
        "x": 1822.9,
        "y": 0.4610043030722167
    },
    {
        "x": 1823,
        "y": 0.4571044949863363
    },
    {
        "x": 1823.1,
        "y": 0.453370798167223
    },
    {
        "x": 1823.2,
        "y": 0.44980134957415996
    },
    {
        "x": 1823.3,
        "y": 0.4463939866614971
    },
    {
        "x": 1823.4,
        "y": 0.4431465468835565
    },
    {
        "x": 1823.5,
        "y": 0.4400568676946972
    },
    {
        "x": 1823.6,
        "y": 0.4371227865492492
    },
    {
        "x": 1823.7,
        "y": 0.43434214090153617
    },
    {
        "x": 1823.8,
        "y": 0.4317127682059202
    },
    {
        "x": 1823.9,
        "y": 0.4292325059167219
    },
    {
        "x": 1824,
        "y": 0.42689919148829697
    },
    {
        "x": 1824.1,
        "y": 0.4247104472490756
    },
    {
        "x": 1824.2,
        "y": 0.42266303502392294
    },
    {
        "x": 1824.3,
        "y": 0.420753501511818
    },
    {
        "x": 1824.4,
        "y": 0.41897839341172216
    },
    {
        "x": 1824.5,
        "y": 0.41733425742261093
    },
    {
        "x": 1824.6,
        "y": 0.4158176402434584
    },
    {
        "x": 1824.7,
        "y": 0.41442508857321997
    },
    {
        "x": 1824.8,
        "y": 0.41315314911088513
    },
    {
        "x": 1824.9,
        "y": 0.41199836855541394
    },
    {
        "x": 1825,
        "y": 0.41095729360577465
    },
    {
        "x": 1825.1,
        "y": 0.4100263712050602
    },
    {
        "x": 1825.2,
        "y": 0.40920164927282576
    },
    {
        "x": 1825.3,
        "y": 0.40847907597274297
    },
    {
        "x": 1825.4,
        "y": 0.4078545994684829
    },
    {
        "x": 1825.5,
        "y": 0.4073241679237223
    },
    {
        "x": 1825.6,
        "y": 0.4068837295021369
    },
    {
        "x": 1825.7,
        "y": 0.4065292323673914
    },
    {
        "x": 1825.8,
        "y": 0.4062566246831635
    },
    {
        "x": 1825.9,
        "y": 0.40606185461312344
    },
    {
        "x": 1826,
        "y": 0.40594087032095455
    },
    {
        "x": 1826.1,
        "y": 0.4058896465456482
    },
    {
        "x": 1826.2,
        "y": 0.4059042643275612
    },
    {
        "x": 1826.3,
        "y": 0.4059808312823704
    },
    {
        "x": 1826.4,
        "y": 0.40611545502574836
    },
    {
        "x": 1826.5,
        "y": 0.406304243173377
    },
    {
        "x": 1826.6,
        "y": 0.40654330334094163
    },
    {
        "x": 1826.7,
        "y": 0.4068287431441061
    },
    {
        "x": 1826.8,
        "y": 0.40715667019856605
    },
    {
        "x": 1826.9,
        "y": 0.40752319211998567
    },
    {
        "x": 1827,
        "y": 0.40792441652405803
    },
    {
        "x": 1827.1,
        "y": 0.40835658732612723
    },
    {
        "x": 1827.2,
        "y": 0.4088164936403256
    },
    {
        "x": 1827.3,
        "y": 0.4093010608804299
    },
    {
        "x": 1827.4,
        "y": 0.4098072144602542
    },
    {
        "x": 1827.5,
        "y": 0.410331879793576
    },
    {
        "x": 1827.6,
        "y": 0.41087198229419847
    },
    {
        "x": 1827.7,
        "y": 0.41142444737591805
    },
    {
        "x": 1827.8,
        "y": 0.4119862004525256
    },
    {
        "x": 1827.9,
        "y": 0.4125541669378189
    },
    {
        "x": 1828,
        "y": 0.4131252722455926
    },
    {
        "x": 1828.1,
        "y": 0.4136966478968451
    },
    {
        "x": 1828.2,
        "y": 0.41426624984138166
    },
    {
        "x": 1828.3,
        "y": 0.41483224013620146
    },
    {
        "x": 1828.4,
        "y": 0.41539278083833064
    },
    {
        "x": 1828.5,
        "y": 0.4159460340047461
    },
    {
        "x": 1828.6,
        "y": 0.4164901616924764
    },
    {
        "x": 1828.7,
        "y": 0.417023325958526
    },
    {
        "x": 1828.8,
        "y": 0.4175436888598814
    },
    {
        "x": 1828.9,
        "y": 0.41804941245357713
    },
    {
        "x": 1829,
        "y": 0.4185386587965949
    },
    {
        "x": 1829.1,
        "y": 0.41900981534612386
    },
    {
        "x": 1829.2,
        "y": 0.41946217116002393
    },
    {
        "x": 1829.3,
        "y": 0.4198952406963176
    },
    {
        "x": 1829.4,
        "y": 0.4203085384130418
    },
    {
        "x": 1829.5,
        "y": 0.42070157876822645
    },
    {
        "x": 1829.6,
        "y": 0.4210738762198841
    },
    {
        "x": 1829.7,
        "y": 0.4214249452260655
    },
    {
        "x": 1829.8,
        "y": 0.42175430024479105
    },
    {
        "x": 1829.9,
        "y": 0.42206145573409637
    },
    {
        "x": 1830,
        "y": 0.42234592615198896
    },
    {
        "x": 1830.1,
        "y": 0.42260742632717846
    },
    {
        "x": 1830.2,
        "y": 0.4228464725709105
    },
    {
        "x": 1830.3,
        "y": 0.4230637815651133
    },
    {
        "x": 1830.4,
        "y": 0.4232600699917025
    },
    {
        "x": 1830.5,
        "y": 0.42343605453260363
    },
    {
        "x": 1830.6,
        "y": 0.4235924518697204
    },
    {
        "x": 1830.7,
        "y": 0.42372997868499374
    },
    {
        "x": 1830.8,
        "y": 0.4238493516603088
    },
    {
        "x": 1830.9,
        "y": 0.423951287477613
    },
    {
        "x": 1831,
        "y": 0.42403650281881694
    },
    {
        "x": 1831.1,
        "y": 0.4241058560734419
    },
    {
        "x": 1831.2,
        "y": 0.4241607724614589
    },
    {
        "x": 1831.3,
        "y": 0.4242028189104482
    },
    {
        "x": 1831.4,
        "y": 0.4242335623479813
    },
    {
        "x": 1831.5,
        "y": 0.42425456970163183
    },
    {
        "x": 1831.6,
        "y": 0.4242674078989852
    },
    {
        "x": 1831.7,
        "y": 0.42427364386762356
    },
    {
        "x": 1831.8,
        "y": 0.4242748445351091
    },
    {
        "x": 1831.9,
        "y": 0.42427257682902325
    },
    {
        "x": 1832,
        "y": 0.4242684076769482
    },
    {
        "x": 1832.1,
        "y": 0.42426397270282457
    },
    {
        "x": 1832.2,
        "y": 0.42426118231605414
    },
    {
        "x": 1832.3,
        "y": 0.4242620156224084
    },
    {
        "x": 1832.4,
        "y": 0.424268451727671
    },
    {
        "x": 1832.5,
        "y": 0.4242824697376014
    },
    {
        "x": 1832.6,
        "y": 0.42430604875797107
    },
    {
        "x": 1832.7,
        "y": 0.4243411678945582
    },
    {
        "x": 1832.8,
        "y": 0.42438980625312833
    },
    {
        "x": 1832.9,
        "y": 0.4244539429394631
    },
    {
        "x": 1833,
        "y": 0.4245355570593239
    },
    {
        "x": 1833.1,
        "y": 0.42463663017970676
    },
    {
        "x": 1833.2,
        "y": 0.4247591537124886
    },
    {
        "x": 1833.3,
        "y": 0.4249051215307948
    },
    {
        "x": 1833.4,
        "y": 0.4250765275077074
    },
    {
        "x": 1833.5,
        "y": 0.425275365516353
    },
    {
        "x": 1833.6,
        "y": 0.42550362942981457
    },
    {
        "x": 1833.7,
        "y": 0.4257633131212172
    },
    {
        "x": 1833.8,
        "y": 0.42605641046365084
    },
    {
        "x": 1833.9,
        "y": 0.4263849153302322
    },
    {
        "x": 1834,
        "y": 0.4267508215940663
    },
    {
        "x": 1834.1,
        "y": 0.42715607842908304
    },
    {
        "x": 1834.2,
        "y": 0.42760245621255627
    },
    {
        "x": 1834.3,
        "y": 0.42809168062260927
    },
    {
        "x": 1834.4,
        "y": 0.4286254773373759
    },
    {
        "x": 1834.5,
        "y": 0.42920557203492593
    },
    {
        "x": 1834.6,
        "y": 0.42983369039338476
    },
    {
        "x": 1834.7,
        "y": 0.43051155809087893
    },
    {
        "x": 1834.8,
        "y": 0.4312409008055139
    },
    {
        "x": 1834.9,
        "y": 0.432023444215396
    },
    {
        "x": 1835,
        "y": 0.4328609139986361
    },
    {
        "x": 1835.1,
        "y": 0.4337549637091881
    },
    {
        "x": 1835.2,
        "y": 0.4347069584042605
    },
    {
        "x": 1835.3,
        "y": 0.4357181910168794
    },
    {
        "x": 1835.4,
        "y": 0.43678995448011815
    },
    {
        "x": 1835.5,
        "y": 0.4379235417270159
    },
    {
        "x": 1835.6,
        "y": 0.4391202456906026
    },
    {
        "x": 1835.7,
        "y": 0.4403813593039481
    },
    {
        "x": 1835.8,
        "y": 0.44170817550008235
    },
    {
        "x": 1835.9,
        "y": 0.44310198721205546
    },
    {
        "x": 1836,
        "y": 0.4445640873729231
    },
    {
        "x": 1836.1,
        "y": 0.44609568150894696
    },
    {
        "x": 1836.2,
        "y": 0.4476976255194394
    },
    {
        "x": 1836.3,
        "y": 0.44937068789691376
    },
    {
        "x": 1836.4,
        "y": 0.45111563713389896
    },
    {
        "x": 1836.5,
        "y": 0.45293324172295374
    },
    {
        "x": 1836.6,
        "y": 0.45482427015655724
    },
    {
        "x": 1836.7,
        "y": 0.45678949092727195
    },
    {
        "x": 1836.8,
        "y": 0.4588296725276351
    },
    {
        "x": 1836.9,
        "y": 0.460945583450148
    },
    {
        "x": 1837,
        "y": 0.4631379921873705
    },
    {
        "x": 1837.1,
        "y": 0.46540756917333803
    },
    {
        "x": 1837.2,
        "y": 0.46775459260825597
    },
    {
        "x": 1837.3,
        "y": 0.47017924263386446
    },
    {
        "x": 1837.4,
        "y": 0.4726816993918737
    },
    {
        "x": 1837.5,
        "y": 0.47526214302402703
    },
    {
        "x": 1837.6,
        "y": 0.47792075367203335
    },
    {
        "x": 1837.7,
        "y": 0.4806577114776587
    },
    {
        "x": 1837.8,
        "y": 0.48347319658260307
    },
    {
        "x": 1837.9,
        "y": 0.4863673891286038
    },
    {
        "x": 1838,
        "y": 0.4893404692573706
    },
    {
        "x": 1838.1,
        "y": 0.4923925134403221
    },
    {
        "x": 1838.2,
        "y": 0.4955231834675342
    },
    {
        "x": 1838.3,
        "y": 0.498732037458699
    },
    {
        "x": 1838.4,
        "y": 0.5020186335335567
    },
    {
        "x": 1838.5,
        "y": 0.5053825298118529
    },
    {
        "x": 1838.6,
        "y": 0.5088232844132936
    },
    {
        "x": 1838.7,
        "y": 0.5123404554576092
    },
    {
        "x": 1838.8,
        "y": 0.5159336010645577
    },
    {
        "x": 1838.9,
        "y": 0.5196022793538179
    },
    {
        "x": 1839,
        "y": 0.5233460484451639
    },
    {
        "x": 1839.1,
        "y": 0.5271643655580254
    },
    {
        "x": 1839.2,
        "y": 0.5310562843108505
    },
    {
        "x": 1839.3,
        "y": 0.5350207574217666
    },
    {
        "x": 1839.4,
        "y": 0.5390567376089619
    },
    {
        "x": 1839.5,
        "y": 0.5431631775905329
    },
    {
        "x": 1839.6,
        "y": 0.5473390300846551
    },
    {
        "x": 1839.7,
        "y": 0.5515832478095066
    },
    {
        "x": 1839.8,
        "y": 0.5558947834832461
    },
    {
        "x": 1839.9,
        "y": 0.5602725898239845
    },
    {
        "x": 1840,
        "y": 0.5647156195498848
    },
    {
        "x": 1840.1,
        "y": 0.5692227354712845
    },
    {
        "x": 1840.2,
        "y": 0.5737924407672405
    },
    {
        "x": 1840.3,
        "y": 0.5784231487089119
    },
    {
        "x": 1840.4,
        "y": 0.5831132725675208
    },
    {
        "x": 1840.5,
        "y": 0.5878612256142678
    },
    {
        "x": 1840.6,
        "y": 0.5926654211203503
    },
    {
        "x": 1840.7,
        "y": 0.597524272356996
    },
    {
        "x": 1840.8,
        "y": 0.6024361925953561
    },
    {
        "x": 1840.9,
        "y": 0.6073995951066847
    },
    {
        "x": 1841,
        "y": 0.6124128931621639
    },
    {
        "x": 1841.1,
        "y": 0.6174744243813738
    },
    {
        "x": 1841.2,
        "y": 0.6225822237772964
    },
    {
        "x": 1841.3,
        "y": 0.6277342507113807
    },
    {
        "x": 1841.4,
        "y": 0.6329284645449833
    },
    {
        "x": 1841.5,
        "y": 0.6381628246394545
    },
    {
        "x": 1841.6,
        "y": 0.6434352903562182
    },
    {
        "x": 1841.7,
        "y": 0.6487438210566904
    },
    {
        "x": 1841.8,
        "y": 0.6540863761021998
    },
    {
        "x": 1841.9,
        "y": 0.6594609148541491
    },
    {
        "x": 1842,
        "y": 0.6648653966739542
    },
    {
        "x": 1842.1,
        "y": 0.6702977244184966
    },
    {
        "x": 1842.2,
        "y": 0.6757555749267312
    },
    {
        "x": 1842.3,
        "y": 0.6812365685331088
    },
    {
        "x": 1842.4,
        "y": 0.6867383255721182
    },
    {
        "x": 1842.5,
        "y": 0.6922584663782338
    },
    {
        "x": 1842.6,
        "y": 0.6977946112858998
    },
    {
        "x": 1842.7,
        "y": 0.703344380629606
    },
    {
        "x": 1842.8,
        "y": 0.7089053947437971
    },
    {
        "x": 1842.9,
        "y": 0.7144752739629736
    },
    {
        "x": 1843,
        "y": 0.720051638621567
    },
    {
        "x": 1843.1,
        "y": 0.7256320794100678
    },
    {
        "x": 1843.2,
        "y": 0.7312140684430657
    },
    {
        "x": 1843.3,
        "y": 0.7367950481910993
    },
    {
        "x": 1843.4,
        "y": 0.742372461124762
    },
    {
        "x": 1843.5,
        "y": 0.7479437497145788
    },
    {
        "x": 1843.6,
        "y": 0.7535063564311977
    },
    {
        "x": 1843.7,
        "y": 0.759057723745136
    },
    {
        "x": 1843.8,
        "y": 0.7645952941269445
    },
    {
        "x": 1843.9,
        "y": 0.7701165100472713
    },
    {
        "x": 1844,
        "y": 0.7756188139766304
    },
    {
        "x": 1844.1,
        "y": 0.7810996513536627
    },
    {
        "x": 1844.2,
        "y": 0.7865564794892597
    },
    {
        "x": 1844.3,
        "y": 0.7919867586623535
    },
    {
        "x": 1844.4,
        "y": 0.7973879491518211
    },
    {
        "x": 1844.5,
        "y": 0.8027575112365969
    },
    {
        "x": 1844.6,
        "y": 0.8080929051956456
    },
    {
        "x": 1844.7,
        "y": 0.8133915913079126
    },
    {
        "x": 1844.8,
        "y": 0.8186510298522577
    },
    {
        "x": 1844.9,
        "y": 0.823868681107684
    },
    {
        "x": 1845,
        "y": 0.8290420053530261
    },
    {
        "x": 1845.1,
        "y": 0.8341684985547281
    },
    {
        "x": 1845.2,
        "y": 0.8392457994286826
    },
    {
        "x": 1845.3,
        "y": 0.8442715823782786
    },
    {
        "x": 1845.4,
        "y": 0.8492435218069571
    },
    {
        "x": 1845.5,
        "y": 0.8541592921179572
    },
    {
        "x": 1845.6,
        "y": 0.8590165677147568
    },
    {
        "x": 1845.7,
        "y": 0.8638130230007354
    },
    {
        "x": 1845.8,
        "y": 0.8685463323791859
    },
    {
        "x": 1845.9,
        "y": 0.8732141702536095
    },
    {
        "x": 1846,
        "y": 0.8778142110272195
    },
    {
        "x": 1846.1,
        "y": 0.8823441921458774
    },
    {
        "x": 1846.2,
        "y": 0.8868021032247718
    },
    {
        "x": 1846.3,
        "y": 0.8911859969214696
    },
    {
        "x": 1846.4,
        "y": 0.8954939258934953
    },
    {
        "x": 1846.5,
        "y": 0.8997239427984387
    },
    {
        "x": 1846.6,
        "y": 0.903874100293923
    },
    {
        "x": 1846.7,
        "y": 0.9079424510374837
    },
    {
        "x": 1846.8,
        "y": 0.9119270476866962
    },
    {
        "x": 1846.9,
        "y": 0.9158259428991227
    },
    {
        "x": 1847,
        "y": 0.919637189332327
    },
    {
        "x": 1847.1,
        "y": 0.9233589274288725
    },
    {
        "x": 1847.2,
        "y": 0.9269896487713591
    },
    {
        "x": 1847.3,
        "y": 0.9305279327272606
    },
    {
        "x": 1847.4,
        "y": 0.933972358664134
    },
    {
        "x": 1847.5,
        "y": 0.9373215059495589
    },
    {
        "x": 1847.6,
        "y": 0.9405739539510042
    },
    {
        "x": 1847.7,
        "y": 0.9437282820360748
    },
    {
        "x": 1847.8,
        "y": 0.946783069572239
    },
    {
        "x": 1847.9,
        "y": 0.949736895927092
    },
    {
        "x": 1848,
        "y": 0.9525883404681175
    },
    {
        "x": 1848.1,
        "y": 0.9553360959342431
    },
    {
        "x": 1848.2,
        "y": 0.9579793085496775
    },
    {
        "x": 1848.3,
        "y": 0.9605172379098929
    },
    {
        "x": 1848.4,
        "y": 0.9629491436104929
    },
    {
        "x": 1848.5,
        "y": 0.9652742852470115
    },
    {
        "x": 1848.6,
        "y": 0.9674919224149983
    },
    {
        "x": 1848.7,
        "y": 0.9696013147099755
    },
    {
        "x": 1848.8,
        "y": 0.9716017217274686
    },
    {
        "x": 1848.9,
        "y": 0.9734924030630885
    },
    {
        "x": 1849,
        "y": 0.9752726183122655
    },
    {
        "x": 1849.1,
        "y": 0.9769417601723377
    },
    {
        "x": 1849.2,
        "y": 0.9784997537474462
    },
    {
        "x": 1849.3,
        "y": 0.9799466572433619
    },
    {
        "x": 1849.4,
        "y": 0.9812825288659711
    },
    {
        "x": 1849.5,
        "y": 0.9825074268211607
    },
    {
        "x": 1849.6,
        "y": 0.9836214093146414
    },
    {
        "x": 1849.7,
        "y": 0.9846245345524169
    },
    {
        "x": 1849.8,
        "y": 0.9855168607401952
    },
    {
        "x": 1849.9,
        "y": 0.9862984460838436
    },
    {
        "x": 1850,
        "y": 0.9869693487892739
    },
    {
        "x": 1850.1,
        "y": 0.9875297637813534
    },
    {
        "x": 1850.2,
        "y": 0.9879804328611413
    },
    {
        "x": 1850.3,
        "y": 0.9883222345489389
    },
    {
        "x": 1850.4,
        "y": 0.9885560473648717
    },
    {
        "x": 1850.5,
        "y": 0.9886827498292077
    },
    {
        "x": 1850.6,
        "y": 0.9887032204620306
    },
    {
        "x": 1850.7,
        "y": 0.9886183377836266
    },
    {
        "x": 1850.8,
        "y": 0.9884289803141351
    },
    {
        "x": 1850.9,
        "y": 0.9881360265738149
    },
    {
        "x": 1851,
        "y": 0.987740355082757
    },
    {
        "x": 1851.1,
        "y": 0.9872429633368754
    },
    {
        "x": 1851.2,
        "y": 0.986645324734478
    },
    {
        "x": 1851.3,
        "y": 0.98594903164946
    },
    {
        "x": 1851.4,
        "y": 0.9851556764559237
    },
    {
        "x": 1851.5,
        "y": 0.984266851527699
    },
    {
        "x": 1851.6,
        "y": 0.9832841492387442
    },
    {
        "x": 1851.7,
        "y": 0.9822091619631921
    },
    {
        "x": 1851.8,
        "y": 0.9810434820748067
    },
    {
        "x": 1851.9,
        "y": 0.9797887019475653
    },
    {
        "x": 1852,
        "y": 0.9784464139556033
    },
    {
        "x": 1852.1,
        "y": 0.9770182947951029
    },
    {
        "x": 1852.2,
        "y": 0.9755063584520479
    },
    {
        "x": 1852.3,
        "y": 0.973912703234978
    },
    {
        "x": 1852.4,
        "y": 0.9722394274521325
    },
    {
        "x": 1852.5,
        "y": 0.9704886294119611
    },
    {
        "x": 1852.6,
        "y": 0.9686624074228186
    },
    {
        "x": 1852.7,
        "y": 0.9667628597930773
    },
    {
        "x": 1852.8,
        "y": 0.9647920848311667
    },
    {
        "x": 1852.9,
        "y": 0.9627521808454655
    },
    {
        "x": 1853,
        "y": 0.960645246144289
    },
    {
        "x": 1853.1,
        "y": 0.9584734199644914
    },
    {
        "x": 1853.2,
        "y": 0.956239005256155
    },
    {
        "x": 1853.3,
        "y": 0.9539443458978812
    },
    {
        "x": 1853.4,
        "y": 0.9515917857682425
    },
    {
        "x": 1853.5,
        "y": 0.9491836687457823
    },
    {
        "x": 1853.6,
        "y": 0.9467223387089891
    },
    {
        "x": 1853.7,
        "y": 0.9442101395365452
    },
    {
        "x": 1853.8,
        "y": 0.9416494151068568
    },
    {
        "x": 1853.9,
        "y": 0.9390425092985766
    },
    {
        "x": 1854,
        "y": 0.9363917659902337
    },
    {
        "x": 1854.1,
        "y": 0.9336995275771386
    },
    {
        "x": 1854.2,
        "y": 0.9309681305215911
    },
    {
        "x": 1854.3,
        "y": 0.9281999098028847
    },
    {
        "x": 1854.4,
        "y": 0.9253972003999572
    },
    {
        "x": 1854.5,
        "y": 0.9225623372920261
    },
    {
        "x": 1854.6,
        "y": 0.9196976554582198
    },
    {
        "x": 1854.7,
        "y": 0.9168054898776893
    },
    {
        "x": 1854.8,
        "y": 0.9138881755294593
    },
    {
        "x": 1854.9,
        "y": 0.9109480473926468
    },
    {
        "x": 1855,
        "y": 0.9079874404465645
    },
    {
        "x": 1855.1,
        "y": 0.9050086524132192
    },
    {
        "x": 1855.2,
        "y": 0.902013831986812
    },
    {
        "x": 1855.3,
        "y": 0.8990050906045403
    },
    {
        "x": 1855.4,
        "y": 0.8959845397036836
    },
    {
        "x": 1855.5,
        "y": 0.8929542907214045
    },
    {
        "x": 1855.6,
        "y": 0.8899164550949562
    },
    {
        "x": 1855.7,
        "y": 0.8868731442615498
    },
    {
        "x": 1855.8,
        "y": 0.883826469658405
    },
    {
        "x": 1855.9,
        "y": 0.8807785427226409
    },
    {
        "x": 1856,
        "y": 0.8777314748916571
    },
    {
        "x": 1856.1,
        "y": 0.8746873124058546
    },
    {
        "x": 1856.2,
        "y": 0.8716478407198568
    },
    {
        "x": 1856.3,
        "y": 0.8686147800913043
    },
    {
        "x": 1856.4,
        "y": 0.8655898507781445
    },
    {
        "x": 1856.5,
        "y": 0.8625747730380994
    },
    {
        "x": 1856.6,
        "y": 0.8595712671289395
    },
    {
        "x": 1856.7,
        "y": 0.8565810533086646
    },
    {
        "x": 1856.8,
        "y": 0.8536058518348949
    },
    {
        "x": 1856.9,
        "y": 0.850647382965558
    },
    {
        "x": 1857,
        "y": 0.8477073669583622
    },
    {
        "x": 1857.1,
        "y": 0.8447874399525233
    },
    {
        "x": 1857.2,
        "y": 0.8418889016125729
    },
    {
        "x": 1857.3,
        "y": 0.8390129674843229
    },
    {
        "x": 1857.4,
        "y": 0.8361608531136371
    },
    {
        "x": 1857.5,
        "y": 0.8333337740463501
    },
    {
        "x": 1857.6,
        "y": 0.8305329458282933
    },
    {
        "x": 1857.7,
        "y": 0.8277595840053975
    },
    {
        "x": 1857.8,
        "y": 0.8250149041233438
    },
    {
        "x": 1857.9,
        "y": 0.8223001217282384
    },
    {
        "x": 1858,
        "y": 0.8196164523657029
    },
    {
        "x": 1858.1,
        "y": 0.816965021425269
    },
    {
        "x": 1858.2,
        "y": 0.8143465936710149
    },
    {
        "x": 1858.3,
        "y": 0.8117618437106366
    },
    {
        "x": 1858.4,
        "y": 0.8092114461516011
    },
    {
        "x": 1858.5,
        "y": 0.8066960756016942
    },
    {
        "x": 1858.6,
        "y": 0.804216406668518
    },
    {
        "x": 1858.7,
        "y": 0.8017731139597067
    },
    {
        "x": 1858.8,
        "y": 0.7993668720830447
    },
    {
        "x": 1858.9,
        "y": 0.7969983556459765
    },
    {
        "x": 1859,
        "y": 0.7946682392562917
    },
    {
        "x": 1859.1,
        "y": 0.7923771147606913
    },
    {
        "x": 1859.2,
        "y": 0.7901252429620669
    },
    {
        "x": 1859.3,
        "y": 0.7879128019025377
    },
    {
        "x": 1859.4,
        "y": 0.785739969623939
    },
    {
        "x": 1859.5,
        "y": 0.7836069241686126
    },
    {
        "x": 1859.6,
        "y": 0.781513843578397
    },
    {
        "x": 1859.7,
        "y": 0.7794609058952845
    },
    {
        "x": 1859.8,
        "y": 0.7774482891613763
    },
    {
        "x": 1859.9,
        "y": 0.7754761714186555
    },
    {
        "x": 1860,
        "y": 0.7735447307093175
    },
    {
        "x": 1860.1,
        "y": 0.7716540779146328
    },
    {
        "x": 1860.2,
        "y": 0.7698040552747801
    },
    {
        "x": 1860.3,
        "y": 0.7679944378689689
    },
    {
        "x": 1860.4,
        "y": 0.7662250007767609
    },
    {
        "x": 1860.5,
        "y": 0.7644955190773953
    },
    {
        "x": 1860.6,
        "y": 0.7628057678504843
    },
    {
        "x": 1860.7,
        "y": 0.7611555221752379
    },
    {
        "x": 1860.8,
        "y": 0.7595445571312278
    },
    {
        "x": 1860.9,
        "y": 0.7579726477978698
    },
    {
        "x": 1861,
        "y": 0.756439569254519
    },
    {
        "x": 1861.1,
        "y": 0.7549450470570276
    },
    {
        "x": 1861.2,
        "y": 0.7534886086676277
    },
    {
        "x": 1861.3,
        "y": 0.7520697320246517
    },
    {
        "x": 1861.4,
        "y": 0.7506878950668097
    },
    {
        "x": 1861.5,
        "y": 0.7493425757324488
    },
    {
        "x": 1861.6,
        "y": 0.748033251960368
    },
    {
        "x": 1861.7,
        "y": 0.7467594016888087
    },
    {
        "x": 1861.8,
        "y": 0.7455205028565578
    },
    {
        "x": 1861.9,
        "y": 0.7443160334018754
    },
    {
        "x": 1862,
        "y": 0.7431454712636851
    },
    {
        "x": 1862.1,
        "y": 0.7420082622479746
    },
    {
        "x": 1862.2,
        "y": 0.7409037236326768
    },
    {
        "x": 1862.3,
        "y": 0.7398311405632698
    },
    {
        "x": 1862.4,
        "y": 0.7387897981851533
    },
    {
        "x": 1862.5,
        "y": 0.7377789816440525
    },
    {
        "x": 1862.6,
        "y": 0.7367979760853883
    },
    {
        "x": 1862.7,
        "y": 0.7358460666547225
    },
    {
        "x": 1862.8,
        "y": 0.7349225384975828
    },
    {
        "x": 1862.9,
        "y": 0.734026676759491
    },
    {
        "x": 1863,
        "y": 0.73315776658594
    },
    {
        "x": 1863.1,
        "y": 0.7323150793094431
    },
    {
        "x": 1863.2,
        "y": 0.7314978310099812
    },
    {
        "x": 1863.3,
        "y": 0.7307052239546954
    },
    {
        "x": 1863.4,
        "y": 0.7299364604105517
    },
    {
        "x": 1863.5,
        "y": 0.7291907426445664
    },
    {
        "x": 1863.6,
        "y": 0.7284672729236198
    },
    {
        "x": 1863.7,
        "y": 0.7277652535148589
    },
    {
        "x": 1863.8,
        "y": 0.7270838866853242
    },
    {
        "x": 1863.9,
        "y": 0.7264223747019649
    },
    {
        "x": 1864,
        "y": 0.7257799198317825
    },
    {
        "x": 1864.1,
        "y": 0.7251557325860312
    },
    {
        "x": 1864.2,
        "y": 0.7245490564534622
    },
    {
        "x": 1864.3,
        "y": 0.7239591431671877
    },
    {
        "x": 1864.4,
        "y": 0.7233852444599433
    },
    {
        "x": 1864.5,
        "y": 0.7228266120648907
    },
    {
        "x": 1864.6,
        "y": 0.7222824977149416
    },
    {
        "x": 1864.7,
        "y": 0.7217521531430618
    },
    {
        "x": 1864.8,
        "y": 0.7212348300822362
    },
    {
        "x": 1864.9,
        "y": 0.7207297802655536
    },
    {
        "x": 1865,
        "y": 0.7202362554259222
    },
    {
        "x": 1865.1,
        "y": 0.7197535408451357
    },
    {
        "x": 1865.2,
        "y": 0.719281056000413
    },
    {
        "x": 1865.3,
        "y": 0.7188182539184234
    },
    {
        "x": 1865.4,
        "y": 0.718364587624786
    },
    {
        "x": 1865.5,
        "y": 0.717919510146182
    },
    {
        "x": 1865.6,
        "y": 0.7174824745085755
    },
    {
        "x": 1865.7,
        "y": 0.7170529337381102
    },
    {
        "x": 1865.8,
        "y": 0.71663034086119
    },
    {
        "x": 1865.9,
        "y": 0.7162141489038102
    },
    {
        "x": 1866,
        "y": 0.7158038108923206
    },
    {
        "x": 1866.1,
        "y": 0.7153988308943341
    },
    {
        "x": 1866.2,
        "y": 0.7149989171433768
    },
    {
        "x": 1866.3,
        "y": 0.7146038289143233
    },
    {
        "x": 1866.4,
        "y": 0.7142133254823392
    },
    {
        "x": 1866.5,
        "y": 0.7138271661222148
    },
    {
        "x": 1866.6,
        "y": 0.7134451101089797
    },
    {
        "x": 1866.7,
        "y": 0.7130669167176829
    },
    {
        "x": 1866.8,
        "y": 0.7126923452231492
    },
    {
        "x": 1866.9,
        "y": 0.712321154900493
    },
    {
        "x": 1867,
        "y": 0.7119531050244438
    },
    {
        "x": 1867.1,
        "y": 0.711588008047604
    },
    {
        "x": 1867.2,
        "y": 0.7112258891310005
    },
    {
        "x": 1867.3,
        "y": 0.7108668266134497
    },
    {
        "x": 1867.4,
        "y": 0.710510898833337
    },
    {
        "x": 1867.5,
        "y": 0.7101581841292391
    },
    {
        "x": 1867.6,
        "y": 0.709808760839858
    },
    {
        "x": 1867.7,
        "y": 0.7094627073036972
    },
    {
        "x": 1867.8,
        "y": 0.709120101859396
    },
    {
        "x": 1867.9,
        "y": 0.7087810228455452
    },
    {
        "x": 1868,
        "y": 0.7084455486005363
    },
    {
        "x": 1868.1,
        "y": 0.7081137993504333
    },
    {
        "x": 1868.2,
        "y": 0.7077860628686213
    },
    {
        "x": 1868.3,
        "y": 0.7074626688166902
    },
    {
        "x": 1868.4,
        "y": 0.7071439468553755
    },
    {
        "x": 1868.5,
        "y": 0.706830226645763
    },
    {
        "x": 1868.6,
        "y": 0.7065218378488605
    },
    {
        "x": 1868.7,
        "y": 0.70621911012594
    },
    {
        "x": 1868.8,
        "y": 0.7059223731375733
    },
    {
        "x": 1868.9,
        "y": 0.7056319565452451
    },
    {
        "x": 1869,
        "y": 0.7053481900097172
    },
    {
        "x": 1869.1,
        "y": 0.7050714285103744
    },
    {
        "x": 1869.2,
        "y": 0.7048021282986439
    },
    {
        "x": 1869.3,
        "y": 0.7045407709449342
    },
    {
        "x": 1869.4,
        "y": 0.7042878380187034
    },
    {
        "x": 1869.5,
        "y": 0.704043811090091
    },
    {
        "x": 1869.6,
        "y": 0.7038091717290246
    },
    {
        "x": 1869.7,
        "y": 0.7035844015052825
    },
    {
        "x": 1869.8,
        "y": 0.703369981988915
    },
    {
        "x": 1869.9,
        "y": 0.7031663947496735
    },
    {
        "x": 1870,
        "y": 0.7029741213576259
    },
    {
        "x": 1870.1,
        "y": 0.702793653211944
    },
    {
        "x": 1870.2,
        "y": 0.7026255210295648
    },
    {
        "x": 1870.3,
        "y": 0.7024702653568021
    },
    {
        "x": 1870.4,
        "y": 0.7023284267395135
    },
    {
        "x": 1870.5,
        "y": 0.7022005457243425
    },
    {
        "x": 1870.6,
        "y": 0.7020871628575706
    },
    {
        "x": 1870.7,
        "y": 0.7019888186848933
    },
    {
        "x": 1870.8,
        "y": 0.7019060537529234
    },
    {
        "x": 1870.9,
        "y": 0.7018394086077516
    },
    {
        "x": 1871,
        "y": 0.7017894237957476
    },
    {
        "x": 1871.1,
        "y": 0.7017566373294316
    },
    {
        "x": 1871.2,
        "y": 0.7017415770867641
    },
    {
        "x": 1871.3,
        "y": 0.7017447684121576
    },
    {
        "x": 1871.4,
        "y": 0.7017667366500655
    },
    {
        "x": 1871.5,
        "y": 0.7018080071446477
    },
    {
        "x": 1871.6,
        "y": 0.7018691052404465
    },
    {
        "x": 1871.7,
        "y": 0.7019505562816823
    },
    {
        "x": 1871.8,
        "y": 0.7020528856128161
    },
    {
        "x": 1871.9,
        "y": 0.702176618578324
    },
    {
        "x": 1872,
        "y": 0.7023222805223859
    },
    {
        "x": 1872.1,
        "y": 0.7024903843444201
    },
    {
        "x": 1872.2,
        "y": 0.702681393165349
    },
    {
        "x": 1872.3,
        "y": 0.7028957576608795
    },
    {
        "x": 1872.4,
        "y": 0.7031339285069409
    },
    {
        "x": 1872.5,
        "y": 0.7033963563790231
    },
    {
        "x": 1872.6,
        "y": 0.70368349195334
    },
    {
        "x": 1872.7,
        "y": 0.7039957859054122
    },
    {
        "x": 1872.8,
        "y": 0.7043336889109424
    },
    {
        "x": 1872.9,
        "y": 0.7046976516462815
    },
    {
        "x": 1873,
        "y": 0.7050881247866381
    },
    {
        "x": 1873.1,
        "y": 0.705505536899917
    },
    {
        "x": 1873.2,
        "y": 0.7059502281206415
    },
    {
        "x": 1873.3,
        "y": 0.7064225164750325
    },
    {
        "x": 1873.4,
        "y": 0.706922719989353
    },
    {
        "x": 1873.5,
        "y": 0.7074511566900658
    },
    {
        "x": 1873.6,
        "y": 0.7080081446035885
    },
    {
        "x": 1873.7,
        "y": 0.7085940017557673
    },
    {
        "x": 1873.8,
        "y": 0.709209046173409
    },
    {
        "x": 1873.9,
        "y": 0.7098535958825636
    },
    {
        "x": 1874,
        "y": 0.7105279689095044
    },
    {
        "x": 1874.1,
        "y": 0.7112324526068401
    },
    {
        "x": 1874.2,
        "y": 0.7119672116301763
    },
    {
        "x": 1874.3,
        "y": 0.7127323799619598
    },
    {
        "x": 1874.4,
        "y": 0.7135280915841244
    },
    {
        "x": 1874.5,
        "y": 0.7143544804786969
    },
    {
        "x": 1874.6,
        "y": 0.7152116806278838
    },
    {
        "x": 1874.7,
        "y": 0.716099826013361
    },
    {
        "x": 1874.8,
        "y": 0.7170190506176836
    },
    {
        "x": 1874.9,
        "y": 0.7179694884227097
    },
    {
        "x": 1875,
        "y": 0.7189512734103699
    },
    {
        "x": 1875.1,
        "y": 0.7199644999810879
    },
    {
        "x": 1875.2,
        "y": 0.7210091042089233
    },
    {
        "x": 1875.3,
        "y": 0.722084982585735
    },
    {
        "x": 1875.4,
        "y": 0.7231920316035337
    },
    {
        "x": 1875.5,
        "y": 0.724330147754776
    },
    {
        "x": 1875.6,
        "y": 0.7254992275312558
    },
    {
        "x": 1875.7,
        "y": 0.7266991674251968
    },
    {
        "x": 1875.8,
        "y": 0.7279298639289817
    },
    {
        "x": 1875.9,
        "y": 0.729191213534158
    },
    {
        "x": 1876,
        "y": 0.7304831127333488
    },
    {
        "x": 1876.1,
        "y": 0.7318054086668263
    },
    {
        "x": 1876.2,
        "y": 0.7331577510699974
    },
    {
        "x": 1876.3,
        "y": 0.7345397403262403
    },
    {
        "x": 1876.4,
        "y": 0.7359509768191356
    },
    {
        "x": 1876.5,
        "y": 0.7373910609322835
    },
    {
        "x": 1876.6,
        "y": 0.738859593049333
    },
    {
        "x": 1876.7,
        "y": 0.7403561735538635
    },
    {
        "x": 1876.8,
        "y": 0.7418804028294201
    },
    {
        "x": 1876.9,
        "y": 0.74343188125962
    },
    {
        "x": 1877,
        "y": 0.745010209228188
    },
    {
        "x": 1877.1,
        "y": 0.7466149301965908
    },
    {
        "x": 1877.2,
        "y": 0.7482453599377975
    },
    {
        "x": 1877.3,
        "y": 0.7499007573034437
    },
    {
        "x": 1877.4,
        "y": 0.7515803811446142
    },
    {
        "x": 1877.5,
        "y": 0.7532834903125463
    },
    {
        "x": 1877.6,
        "y": 0.7550093436583639
    },
    {
        "x": 1877.7,
        "y": 0.7567572000334511
    },
    {
        "x": 1877.8,
        "y": 0.7585263182888006
    },
    {
        "x": 1877.9,
        "y": 0.7603159572758855
    },
    {
        "x": 1878,
        "y": 0.762125375845991
    },
    {
        "x": 1878.1,
        "y": 0.7639537734355316
    },
    {
        "x": 1878.2,
        "y": 0.7658001118247236
    },
    {
        "x": 1878.3,
        "y": 0.767663293378289
    },
    {
        "x": 1878.4,
        "y": 0.7695422204615261
    },
    {
        "x": 1878.5,
        "y": 0.7714357954397493
    },
    {
        "x": 1878.6,
        "y": 0.7733429206780509
    },
    {
        "x": 1878.7,
        "y": 0.7752624985419332
    },
    {
        "x": 1878.8,
        "y": 0.7771934313962988
    },
    {
        "x": 1878.9,
        "y": 0.7791346216066023
    },
    {
        "x": 1879,
        "y": 0.7810849715377554
    },
    {
        "x": 1879.1,
        "y": 0.7830433296496185
    },
    {
        "x": 1879.2,
        "y": 0.7850083287784854
    },
    {
        "x": 1879.3,
        "y": 0.7869785478556678
    },
    {
        "x": 1879.4,
        "y": 0.7889525658116486
    },
    {
        "x": 1879.5,
        "y": 0.7909289615774104
    },
    {
        "x": 1879.6,
        "y": 0.7929063140839898
    },
    {
        "x": 1879.7,
        "y": 0.7948832022624227
    },
    {
        "x": 1879.8,
        "y": 0.7968582050432466
    },
    {
        "x": 1879.9,
        "y": 0.7988299013577986
    },
    {
        "x": 1880,
        "y": 0.8007968701365366
    },
    {
        "x": 1880.1,
        "y": 0.8027576485565263
    },
    {
        "x": 1880.2,
        "y": 0.8047106067784597
    },
    {
        "x": 1880.3,
        "y": 0.8066540732092377
    },
    {
        "x": 1880.4,
        "y": 0.8085863762555663
    },
    {
        "x": 1880.5,
        "y": 0.8105058443236228
    },
    {
        "x": 1880.6,
        "y": 0.8124108058207024
    },
    {
        "x": 1880.7,
        "y": 0.814299589153329
    },
    {
        "x": 1880.8,
        "y": 0.8161705227281646
    },
    {
        "x": 1880.9,
        "y": 0.8180219349519617
    },
    {
        "x": 1881,
        "y": 0.8198521542312153
    },
    {
        "x": 1881.1,
        "y": 0.8216594870969122
    },
    {
        "x": 1881.2,
        "y": 0.8234421525743193
    },
    {
        "x": 1881.3,
        "y": 0.8251983478136468
    },
    {
        "x": 1881.4,
        "y": 0.8269262699641865
    },
    {
        "x": 1881.5,
        "y": 0.8286241161755203
    },
    {
        "x": 1881.6,
        "y": 0.8302900835976468
    },
    {
        "x": 1881.7,
        "y": 0.8319223693801484
    },
    {
        "x": 1881.8,
        "y": 0.8335191706721706
    },
    {
        "x": 1881.9,
        "y": 0.8350786846242026
    },
    {
        "x": 1882,
        "y": 0.8365991083851767
    },
    {
        "x": 1882.1,
        "y": 0.8380786492308486
    },
    {
        "x": 1882.2,
        "y": 0.8395155549379552
    },
    {
        "x": 1882.3,
        "y": 0.840908083409629
    },
    {
        "x": 1882.4,
        "y": 0.8422544925489853
    },
    {
        "x": 1882.5,
        "y": 0.8435530402580889
    },
    {
        "x": 1882.6,
        "y": 0.844801984440427
    },
    {
        "x": 1882.7,
        "y": 0.8459995829985979
    },
    {
        "x": 1882.8,
        "y": 0.8471440938355963
    },
    {
        "x": 1882.9,
        "y": 0.8482337748539813
    },
    {
        "x": 1883,
        "y": 0.8492668839570479
    },
    {
        "x": 1883.1,
        "y": 0.8502417333249553
    },
    {
        "x": 1883.2,
        "y": 0.8511568522512603
    },
    {
        "x": 1883.3,
        "y": 0.8520108243066031
    },
    {
        "x": 1883.4,
        "y": 0.8528022330621324
    },
    {
        "x": 1883.5,
        "y": 0.8535296620887897
    },
    {
        "x": 1883.6,
        "y": 0.8541916949574574
    },
    {
        "x": 1883.7,
        "y": 0.8547869152390565
    },
    {
        "x": 1883.8,
        "y": 0.8553139065047336
    },
    {
        "x": 1883.9,
        "y": 0.8557712523253683
    },
    {
        "x": 1884,
        "y": 0.8561575362719079
    },
    {
        "x": 1884.1,
        "y": 0.8564714429794869
    },
    {
        "x": 1884.2,
        "y": 0.8567120613412844
    },
    {
        "x": 1884.3,
        "y": 0.8568785813133348
    },
    {
        "x": 1884.4,
        "y": 0.8569701928534941
    },
    {
        "x": 1884.5,
        "y": 0.8569860859177889
    },
    {
        "x": 1884.6,
        "y": 0.8569254504637033
    },
    {
        "x": 1884.7,
        "y": 0.8567874764477076
    },
    {
        "x": 1884.8,
        "y": 0.8565713538271955
    },
    {
        "x": 1884.9,
        "y": 0.8562762725585658
    },
    {
        "x": 1885,
        "y": 0.85590142259911
    },
    {
        "x": 1885.1,
        "y": 0.8554461307677134
    },
    {
        "x": 1885.2,
        "y": 0.8549102713323801
    },
    {
        "x": 1885.3,
        "y": 0.854293855423827
    },
    {
        "x": 1885.4,
        "y": 0.8535968941723565
    },
    {
        "x": 1885.5,
        "y": 0.8528193987079189
    },
    {
        "x": 1885.6,
        "y": 0.8519613801612856
    },
    {
        "x": 1885.7,
        "y": 0.8510228496623319
    },
    {
        "x": 1885.8,
        "y": 0.8500038183421211
    },
    {
        "x": 1885.9,
        "y": 0.8489042973304893
    },
    {
        "x": 1886,
        "y": 0.8477242977579321
    },
    {
        "x": 1886.1,
        "y": 0.8464639821816604
    },
    {
        "x": 1886.2,
        "y": 0.8451241188670648
    },
    {
        "x": 1886.3,
        "y": 0.843705627506825
    },
    {
        "x": 1886.4,
        "y": 0.8422094277931778
    },
    {
        "x": 1886.5,
        "y": 0.8406364394183283
    },
    {
        "x": 1886.6,
        "y": 0.838987582074791
    },
    {
        "x": 1886.7,
        "y": 0.8372637754549147
    },
    {
        "x": 1886.8,
        "y": 0.8354659392512526
    },
    {
        "x": 1886.9,
        "y": 0.8335949931560939
    },
    {
        "x": 1887,
        "y": 0.8316518568616101
    },
    {
        "x": 1887.1,
        "y": 0.8296375922696595
    },
    {
        "x": 1887.2,
        "y": 0.8275538301181592
    },
    {
        "x": 1887.3,
        "y": 0.8254023433533919
    },
    {
        "x": 1887.4,
        "y": 0.8231849049230687
    },
    {
        "x": 1887.5,
        "y": 0.8209032877742455
    },
    {
        "x": 1887.6,
        "y": 0.8185592648536086
    },
    {
        "x": 1887.7,
        "y": 0.8161546091079711
    },
    {
        "x": 1887.8,
        "y": 0.8136910934846336
    },
    {
        "x": 1887.9,
        "y": 0.811170490930652
    },
    {
        "x": 1888,
        "y": 0.8085945743928245
    },
    {
        "x": 1888.1,
        "y": 0.8059652282881113
    },
    {
        "x": 1888.2,
        "y": 0.8032847829133802
    },
    {
        "x": 1888.3,
        "y": 0.800555680034825
    },
    {
        "x": 1888.4,
        "y": 0.7977803614194756
    },
    {
        "x": 1888.5,
        "y": 0.7949612688338568
    },
    {
        "x": 1888.6,
        "y": 0.792100844044289
    },
    {
        "x": 1888.7,
        "y": 0.7892015288175109
    },
    {
        "x": 1888.8,
        "y": 0.7862657649202348
    },
    {
        "x": 1888.9,
        "y": 0.7832959941192023
    },
    {
        "x": 1889,
        "y": 0.7802946581806658
    },
    {
        "x": 1889.1,
        "y": 0.7772642631455806
    },
    {
        "x": 1889.2,
        "y": 0.7742075721534688
    },
    {
        "x": 1889.3,
        "y": 0.7711274126171689
    },
    {
        "x": 1889.4,
        "y": 0.7680266119502178
    },
    {
        "x": 1889.5,
        "y": 0.7649079975659568
    },
    {
        "x": 1889.6,
        "y": 0.7617743968777924
    },
    {
        "x": 1889.7,
        "y": 0.7586286372989332
    },
    {
        "x": 1889.8,
        "y": 0.7554735462430892
    },
    {
        "x": 1889.9,
        "y": 0.7523119511232059
    },
    {
        "x": 1890,
        "y": 0.7491466793530057
    },
    {
        "x": 1890.1,
        "y": 0.7459805672770651
    },
    {
        "x": 1890.2,
        "y": 0.7428164869673978
    },
    {
        "x": 1890.3,
        "y": 0.7396573194264621
    },
    {
        "x": 1890.4,
        "y": 0.736505945656812
    },
    {
        "x": 1890.5,
        "y": 0.7333652466618856
    },
    {
        "x": 1890.6,
        "y": 0.7302381034446221
    },
    {
        "x": 1890.7,
        "y": 0.7271273970073279
    },
    {
        "x": 1890.8,
        "y": 0.7240360083538274
    },
    {
        "x": 1890.9,
        "y": 0.720966818485894
    },
    {
        "x": 1891,
        "y": 0.71792270840756
    },
    {
        "x": 1891.1,
        "y": 0.7149065102367324
    },
    {
        "x": 1891.2,
        "y": 0.7119208605543583
    },
    {
        "x": 1891.3,
        "y": 0.7089683470572139
    },
    {
        "x": 1891.4,
        "y": 0.7060515574416438
    },
    {
        "x": 1891.5,
        "y": 0.7031730794046601
    },
    {
        "x": 1891.6,
        "y": 0.7003355006423164
    },
    {
        "x": 1891.7,
        "y": 0.6975414088513789
    },
    {
        "x": 1891.8,
        "y": 0.6947933917287002
    },
    {
        "x": 1891.9,
        "y": 0.6920940369703515
    },
    {
        "x": 1892,
        "y": 0.6894459322732283
    },
    {
        "x": 1892.1,
        "y": 0.6868515615731728
    },
    {
        "x": 1892.2,
        "y": 0.6843129937610882
    },
    {
        "x": 1892.3,
        "y": 0.6818321939680001
    },
    {
        "x": 1892.4,
        "y": 0.6794111273244944
    },
    {
        "x": 1892.5,
        "y": 0.677051758961144
    },
    {
        "x": 1892.6,
        "y": 0.6747560540079942
    },
    {
        "x": 1892.7,
        "y": 0.6725259775965307
    },
    {
        "x": 1892.8,
        "y": 0.6703634948562933
    },
    {
        "x": 1892.9,
        "y": 0.6682705709188584
    },
    {
        "x": 1893,
        "y": 0.6662491709146332
    },
    {
        "x": 1893.1,
        "y": 0.6643011105741551
    },
    {
        "x": 1893.2,
        "y": 0.6624276080302811
    },
    {
        "x": 1893.3,
        "y": 0.6606297320160043
    },
    {
        "x": 1893.4,
        "y": 0.6589085512640762
    },
    {
        "x": 1893.5,
        "y": 0.6572651345083549
    },
    {
        "x": 1893.6,
        "y": 0.6557005504807077
    },
    {
        "x": 1893.7,
        "y": 0.6542158679149638
    },
    {
        "x": 1893.8,
        "y": 0.6528121555442594
    },
    {
        "x": 1893.9,
        "y": 0.6514904821007723
    },
    {
        "x": 1894,
        "y": 0.6502519163178625
    },
    {
        "x": 1894.1,
        "y": 0.6490973511154711
    },
    {
        "x": 1894.2,
        "y": 0.6480269761583466
    },
    {
        "x": 1894.3,
        "y": 0.6470408052978679
    },
    {
        "x": 1894.4,
        "y": 0.6461388523857715
    },
    {
        "x": 1894.5,
        "y": 0.6453211312733935
    },
    {
        "x": 1894.6,
        "y": 0.6445876558129451
    },
    {
        "x": 1894.7,
        "y": 0.643938439855055
    },
    {
        "x": 1894.8,
        "y": 0.6433734972516565
    },
    {
        "x": 1894.9,
        "y": 0.6428928418546519
    },
    {
        "x": 1895,
        "y": 0.6424964875153674
    },
    {
        "x": 1895.1,
        "y": 0.6421842708432697
    },
    {
        "x": 1895.2,
        "y": 0.641955319482874
    },
    {
        "x": 1895.3,
        "y": 0.6418085838355162
    },
    {
        "x": 1895.4,
        "y": 0.6417430143035233
    },
    {
        "x": 1895.5,
        "y": 0.6417575612893223
    },
    {
        "x": 1895.6,
        "y": 0.6418511751942568
    },
    {
        "x": 1895.7,
        "y": 0.6420228064210586
    },
    {
        "x": 1895.8,
        "y": 0.6422714053721728
    },
    {
        "x": 1895.9,
        "y": 0.6425959224486316
    },
    {
        "x": 1896,
        "y": 0.6429953080532324
    },
    {
        "x": 1896.1,
        "y": 0.6434683568149343
    },
    {
        "x": 1896.2,
        "y": 0.644013240270698
    },
    {
        "x": 1896.3,
        "y": 0.6446279741845504
    },
    {
        "x": 1896.4,
        "y": 0.6453105743214952
    },
    {
        "x": 1896.5,
        "y": 0.6460590564438053
    },
    {
        "x": 1896.6,
        "y": 0.6468714363168314
    },
    {
        "x": 1896.7,
        "y": 0.6477457297043026
    },
    {
        "x": 1896.8,
        "y": 0.6486799523703243
    },
    {
        "x": 1896.9,
        "y": 0.6496721200791452
    },
    {
        "x": 1897,
        "y": 0.6507202485943006
    },
    {
        "x": 1897.1,
        "y": 0.6518222311771343
    },
    {
        "x": 1897.2,
        "y": 0.6529754710762141
    },
    {
        "x": 1897.3,
        "y": 0.654177249035576
    },
    {
        "x": 1897.4,
        "y": 0.6554248458016781
    },
    {
        "x": 1897.5,
        "y": 0.6567155421191428
    },
    {
        "x": 1897.6,
        "y": 0.6580466187324708
    },
    {
        "x": 1897.7,
        "y": 0.6594153563878745
    },
    {
        "x": 1897.8,
        "y": 0.6608190358298697
    },
    {
        "x": 1897.9,
        "y": 0.6622549378037231
    },
    {
        "x": 1898,
        "y": 0.6637203430547886
    },
    {
        "x": 1898.1,
        "y": 0.6652124522348919
    },
    {
        "x": 1898.2,
        "y": 0.6667281456245481
    },
    {
        "x": 1898.3,
        "y": 0.6682642234108453
    },
    {
        "x": 1898.4,
        "y": 0.669817485780729
    },
    {
        "x": 1898.5,
        "y": 0.6713847329216253
    },
    {
        "x": 1898.6,
        "y": 0.6729627650206708
    },
    {
        "x": 1898.7,
        "y": 0.674548382265549
    },
    {
        "x": 1898.8,
        "y": 0.6761383848432155
    },
    {
        "x": 1898.9,
        "y": 0.6777295729403068
    },
    {
        "x": 1899,
        "y": 0.6793187467448559
    },
    {
        "x": 1899.1,
        "y": 0.6809026820899697
    },
    {
        "x": 1899.2,
        "y": 0.682478057388956
    },
    {
        "x": 1899.3,
        "y": 0.684041526704972
    },
    {
        "x": 1899.4,
        "y": 0.6855897440977923
    },
    {
        "x": 1899.5,
        "y": 0.6871193636280588
    },
    {
        "x": 1899.6,
        "y": 0.6886270393569244
    },
    {
        "x": 1899.7,
        "y": 0.6901094253456851
    },
    {
        "x": 1899.8,
        "y": 0.6915631756540955
    },
    {
        "x": 1899.9,
        "y": 0.6929849443439622
    },
    {
        "x": 1900,
        "y": 0.6943713854760796
    },
    {
        "x": 1900.1,
        "y": 0.6957191960686695
    },
    {
        "x": 1900.2,
        "y": 0.6970252449717765
    },
    {
        "x": 1900.3,
        "y": 0.6982864439925067
    },
    {
        "x": 1900.4,
        "y": 0.6994997049392253
    },
    {
        "x": 1900.5,
        "y": 0.7006619396186445
    },
    {
        "x": 1900.6,
        "y": 0.7017700598387759
    },
    {
        "x": 1900.7,
        "y": 0.7028209774075902
    },
    {
        "x": 1900.8,
        "y": 0.703811604131584
    },
    {
        "x": 1900.9,
        "y": 0.7047388518190304
    },
    {
        "x": 1901,
        "y": 0.7055996322778109
    },
    {
        "x": 1901.1,
        "y": 0.7063909715602658
    },
    {
        "x": 1901.2,
        "y": 0.7071103526988789
    },
    {
        "x": 1901.3,
        "y": 0.7077553729718047
    },
    {
        "x": 1901.4,
        "y": 0.7083236296578889
    },
    {
        "x": 1901.5,
        "y": 0.7088127200343473
    },
    {
        "x": 1901.6,
        "y": 0.7092202413793912
    },
    {
        "x": 1901.7,
        "y": 0.7095437909716037
    },
    {
        "x": 1901.8,
        "y": 0.7097809660889218
    },
    {
        "x": 1901.9,
        "y": 0.709929364008979
    },
    {
        "x": 1902,
        "y": 0.7099865820100729
    },
    {
        "x": 1902.1,
        "y": 0.7099503908662222
    },
    {
        "x": 1902.2,
        "y": 0.7098192553366953
    },
    {
        "x": 1902.3,
        "y": 0.7095918136755665
    },
    {
        "x": 1902.4,
        "y": 0.7092667041387872
    },
    {
        "x": 1902.5,
        "y": 0.7088425649807085
    },
    {
        "x": 1902.6,
        "y": 0.7083180344565884
    },
    {
        "x": 1902.7,
        "y": 0.7076917508204895
    },
    {
        "x": 1902.8,
        "y": 0.7069623523289238
    },
    {
        "x": 1902.9,
        "y": 0.7061284772354528
    },
    {
        "x": 1903,
        "y": 0.7051887637953032
    },
    {
        "x": 1903.1,
        "y": 0.7041420599536959
    },
    {
        "x": 1903.2,
        "y": 0.7029880524127317
    },
    {
        "x": 1903.3,
        "y": 0.7017266375657384
    },
    {
        "x": 1903.4,
        "y": 0.7003577118046579
    },
    {
        "x": 1903.5,
        "y": 0.698881171521988
    },
    {
        "x": 1903.6,
        "y": 0.6972969131114579
    },
    {
        "x": 1903.7,
        "y": 0.6956048329640321
    },
    {
        "x": 1903.8,
        "y": 0.6938048274731253
    },
    {
        "x": 1903.9,
        "y": 0.6918967930308384
    },
    {
        "x": 1904,
        "y": 0.6898806260302982
    },
    {
        "x": 1904.1,
        "y": 0.6877564395547827
    },
    {
        "x": 1904.2,
        "y": 0.6855252134481045
    },
    {
        "x": 1904.3,
        "y": 0.6831881442452359
    },
    {
        "x": 1904.4,
        "y": 0.6807464284810246
    },
    {
        "x": 1904.5,
        "y": 0.6782012626913493
    },
    {
        "x": 1904.6,
        "y": 0.6755538434109919
    },
    {
        "x": 1904.7,
        "y": 0.6728053671745051
    },
    {
        "x": 1904.8,
        "y": 0.6699570305170299
    },
    {
        "x": 1904.9,
        "y": 0.6670100299734778
    },
    {
        "x": 1905,
        "y": 0.6639655620792796
    },
    {
        "x": 1905.1,
        "y": 0.6608250149076154
    },
    {
        "x": 1905.2,
        "y": 0.6575905426920577
    },
    {
        "x": 1905.3,
        "y": 0.6542644912037233
    },
    {
        "x": 1905.4,
        "y": 0.6508492062134197
    },
    {
        "x": 1905.5,
        "y": 0.6473470334924311
    },
    {
        "x": 1905.6,
        "y": 0.6437603188129618
    },
    {
        "x": 1905.7,
        "y": 0.6400914079458566
    },
    {
        "x": 1905.8,
        "y": 0.6363426466630763
    },
    {
        "x": 1905.9,
        "y": 0.6325163807351175
    },
    {
        "x": 1906,
        "y": 0.6286149559341574
    },
    {
        "x": 1906.1,
        "y": 0.6246408558864871
    },
    {
        "x": 1906.2,
        "y": 0.6205971156366484
    },
    {
        "x": 1906.3,
        "y": 0.6164869080864206
    },
    {
        "x": 1906.4,
        "y": 0.612313406134716
    },
    {
        "x": 1906.5,
        "y": 0.6080797826833249
    },
    {
        "x": 1906.6,
        "y": 0.6037892106320645
    },
    {
        "x": 1906.7,
        "y": 0.59944486288025
    },
    {
        "x": 1906.8,
        "y": 0.5950499123289686
    },
    {
        "x": 1906.9,
        "y": 0.5906075318790575
    },
    {
        "x": 1907,
        "y": 0.5861208944296287
    },
    {
        "x": 1907.1,
        "y": 0.5815932381840812
    },
    {
        "x": 1907.2,
        "y": 0.5770280625474441
    },
    {
        "x": 1907.3,
        "y": 0.5724289322305053
    },
    {
        "x": 1907.4,
        "y": 0.5677994119400197
    },
    {
        "x": 1907.5,
        "y": 0.5631430663842582
    },
    {
        "x": 1907.6,
        "y": 0.5584634602732141
    },
    {
        "x": 1907.7,
        "y": 0.5537641583141404
    },
    {
        "x": 1907.8,
        "y": 0.5490487252149778
    },
    {
        "x": 1907.9,
        "y": 0.5443207256859697
    },
    {
        "x": 1908,
        "y": 0.539583724433078
    },
    {
        "x": 1908.1,
        "y": 0.5348412721842838
    },
    {
        "x": 1908.2,
        "y": 0.5300968637314224
    },
    {
        "x": 1908.3,
        "y": 0.5253539798851722
    },
    {
        "x": 1908.4,
        "y": 0.5206161014564602
    },
    {
        "x": 1908.5,
        "y": 0.5158867092551874
    },
    {
        "x": 1908.6,
        "y": 0.511169284092212
    },
    {
        "x": 1908.7,
        "y": 0.5064673067769802
    },
    {
        "x": 1908.8,
        "y": 0.5017842581215248
    },
    {
        "x": 1908.9,
        "y": 0.4971236189348295
    },
    {
        "x": 1909,
        "y": 0.49248887002875624
    },
    {
        "x": 1909.1,
        "y": 0.48788340502604677
    },
    {
        "x": 1909.2,
        "y": 0.48331026881216277
    },
    {
        "x": 1909.3,
        "y": 0.47877241908358564
    },
    {
        "x": 1909.4,
        "y": 0.47427281353831746
    },
    {
        "x": 1909.5,
        "y": 0.46981440987355294
    },
    {
        "x": 1909.6,
        "y": 0.46540016578706134
    },
    {
        "x": 1909.7,
        "y": 0.4610330389770708
    },
    {
        "x": 1909.8,
        "y": 0.45671598714097317
    },
    {
        "x": 1909.9,
        "y": 0.4524519679771744
    },
    {
        "x": 1910,
        "y": 0.44824393918141303
    },
    {
        "x": 1910.1,
        "y": 0.4440947174954955
    },
    {
        "x": 1910.2,
        "y": 0.4400065558299082
    },
    {
        "x": 1910.3,
        "y": 0.43598156613854383
    },
    {
        "x": 1910.4,
        "y": 0.4320218603749547
    },
    {
        "x": 1910.5,
        "y": 0.42812955049176404
    },
    {
        "x": 1910.6,
        "y": 0.42430674844367244
    },
    {
        "x": 1910.7,
        "y": 0.4205555661843421
    },
    {
        "x": 1910.8,
        "y": 0.4168781156666477
    },
    {
        "x": 1910.9,
        "y": 0.41327650884470235
    },
    {
        "x": 1911,
        "y": 0.40975285767151853
    },
    {
        "x": 1911.1,
        "y": 0.40630910810642706
    },
    {
        "x": 1911.2,
        "y": 0.4029465421282539
    },
    {
        "x": 1911.3,
        "y": 0.39966627572135455
    },
    {
        "x": 1911.4,
        "y": 0.39646942486892983
    },
    {
        "x": 1911.5,
        "y": 0.39335710555592845
    },
    {
        "x": 1911.6,
        "y": 0.39033043376569426
    },
    {
        "x": 1911.7,
        "y": 0.38739052548383573
    },
    {
        "x": 1911.8,
        "y": 0.38453849669305157
    },
    {
        "x": 1911.9,
        "y": 0.3817754633784815
    },
    {
        "x": 1912,
        "y": 0.37910254152373846
    },
    {
        "x": 1912.1,
        "y": 0.3765206833332815
    },
    {
        "x": 1912.2,
        "y": 0.3740301858958526
    },
    {
        "x": 1912.3,
        "y": 0.37163118251928384
    },
    {
        "x": 1912.4,
        "y": 0.36932380651268976
    },
    {
        "x": 1912.5,
        "y": 0.367108191184847
    },
    {
        "x": 1912.6,
        "y": 0.3649844698428961
    },
    {
        "x": 1912.7,
        "y": 0.3629527757973561
    },
    {
        "x": 1912.8,
        "y": 0.3610132423551383
    },
    {
        "x": 1912.9,
        "y": 0.3591660028265202
    },
    {
        "x": 1913,
        "y": 0.35741119051790277
    },
    {
        "x": 1913.1,
        "y": 0.35574879585121844
    },
    {
        "x": 1913.2,
        "y": 0.35417823768717005
    },
    {
        "x": 1913.3,
        "y": 0.35269879199943116
    },
    {
        "x": 1913.4,
        "y": 0.3513097347624709
    },
    {
        "x": 1913.5,
        "y": 0.35001034194887964
    },
    {
        "x": 1913.6,
        "y": 0.34879988953153146
    },
    {
        "x": 1913.7,
        "y": 0.3476776534854126
    },
    {
        "x": 1913.8,
        "y": 0.3466429097825346
    },
    {
        "x": 1913.9,
        "y": 0.34569493439686316
    },
    {
        "x": 1914,
        "y": 0.34483300330134203
    },
    {
        "x": 1914.1,
        "y": 0.3440562828427951
    },
    {
        "x": 1914.2,
        "y": 0.34336350085614803
    },
    {
        "x": 1914.3,
        "y": 0.34275327555117996
    },
    {
        "x": 1914.4,
        "y": 0.34222422513508016
    },
    {
        "x": 1914.5,
        "y": 0.3417749678165273
    },
    {
        "x": 1914.6,
        "y": 0.34140412180407576
    },
    {
        "x": 1914.7,
        "y": 0.34111030530619824
    },
    {
        "x": 1914.8,
        "y": 0.3408921365308318
    },
    {
        "x": 1914.9,
        "y": 0.3407482336875624
    },
    {
        "x": 1915,
        "y": 0.34067721498391823
    },
    {
        "x": 1915.1,
        "y": 0.3406776290121529
    },
    {
        "x": 1915.2,
        "y": 0.3407477458951578
    },
    {
        "x": 1915.3,
        "y": 0.3408857661423382
    },
    {
        "x": 1915.4,
        "y": 0.3410898902589967
    },
    {
        "x": 1915.5,
        "y": 0.34135831875493267
    },
    {
        "x": 1915.6,
        "y": 0.34168925213601054
    },
    {
        "x": 1915.7,
        "y": 0.3420808909102369
    },
    {
        "x": 1915.8,
        "y": 0.34253143558440463
    },
    {
        "x": 1915.9,
        "y": 0.3430390866671529
    },
    {
        "x": 1916,
        "y": 0.3436020446643969
    },
    {
        "x": 1916.1,
        "y": 0.34421848256673104
    },
    {
        "x": 1916.2,
        "y": 0.3448864632867183
    },
    {
        "x": 1916.3,
        "y": 0.34560402222198094
    },
    {
        "x": 1916.4,
        "y": 0.34636919476831857
    },
    {
        "x": 1916.5,
        "y": 0.3471800163215171
    },
    {
        "x": 1916.6,
        "y": 0.34803452227754955
    },
    {
        "x": 1916.7,
        "y": 0.34893074803258217
    },
    {
        "x": 1916.8,
        "y": 0.34986672898175897
    },
    {
        "x": 1916.9,
        "y": 0.3508405005224213
    },
    {
        "x": 1917,
        "y": 0.35185009805004913
    },
    {
        "x": 1917.1,
        "y": 0.3528935662197104
    },
    {
        "x": 1917.2,
        "y": 0.3539689867237727
    },
    {
        "x": 1917.3,
        "y": 0.3550744505127855
    },
    {
        "x": 1917.4,
        "y": 0.3562080485378865
    },
    {
        "x": 1917.5,
        "y": 0.3573678717510093
    },
    {
        "x": 1917.6,
        "y": 0.3585520111027079
    },
    {
        "x": 1917.7,
        "y": 0.35975855754452074
    },
    {
        "x": 1917.8,
        "y": 0.36098560202682944
    },
    {
        "x": 1917.9,
        "y": 0.36223123550136266
    },
    {
        "x": 1918,
        "y": 0.3634935489189093
    },
    {
        "x": 1918.1,
        "y": 0.364770671032973
    },
    {
        "x": 1918.2,
        "y": 0.36606088180634333
    },
    {
        "x": 1918.3,
        "y": 0.367362499002702
    },
    {
        "x": 1918.4,
        "y": 0.3686738403865409
    },
    {
        "x": 1918.5,
        "y": 0.3699932237237258
    },
    {
        "x": 1918.6,
        "y": 0.3713189667771908
    },
    {
        "x": 1918.7,
        "y": 0.37264938731151837
    },
    {
        "x": 1918.8,
        "y": 0.37398280309214266
    },
    {
        "x": 1918.9,
        "y": 0.3753175318827327
    },
    {
        "x": 1919,
        "y": 0.37665189144877165
    },
    {
        "x": 1919.1,
        "y": 0.37798425775128186
    },
    {
        "x": 1919.2,
        "y": 0.37931323953573054
    },
    {
        "x": 1919.3,
        "y": 0.38063750374736965
    },
    {
        "x": 1919.4,
        "y": 0.38195571732764394
    },
    {
        "x": 1919.5,
        "y": 0.3832665472225999
    },
    {
        "x": 1919.6,
        "y": 0.3845686603744533
    },
    {
        "x": 1919.7,
        "y": 0.3858607237267713
    },
    {
        "x": 1919.8,
        "y": 0.3871414042232717
    },
    {
        "x": 1919.9,
        "y": 0.3884093688062744
    },
    {
        "x": 1920,
        "y": 0.3896632844215031
    },
    {
        "x": 1920.1,
        "y": 0.39090188794601477
    },
    {
        "x": 1920.2,
        "y": 0.3921241959971231
    },
    {
        "x": 1920.3,
        "y": 0.3933292951261379
    },
    {
        "x": 1920.4,
        "y": 0.39451627188600125
    },
    {
        "x": 1920.5,
        "y": 0.3956842128285666
    },
    {
        "x": 1920.6,
        "y": 0.39683220450428314
    },
    {
        "x": 1920.7,
        "y": 0.397959333466534
    },
    {
        "x": 1920.8,
        "y": 0.3990646862669326
    },
    {
        "x": 1920.9,
        "y": 0.40014734945688185
    },
    {
        "x": 1921,
        "y": 0.40120640958870873
    },
    {
        "x": 1921.1,
        "y": 0.40224102798156686
    },
    {
        "x": 1921.2,
        "y": 0.4032506650214213
    },
    {
        "x": 1921.3,
        "y": 0.4042348558617701
    },
    {
        "x": 1921.4,
        "y": 0.4051931356578681
    },
    {
        "x": 1921.5,
        "y": 0.4061250395618725
    },
    {
        "x": 1921.6,
        "y": 0.4070301027279801
    },
    {
        "x": 1921.7,
        "y": 0.40790786031091586
    },
    {
        "x": 1921.8,
        "y": 0.4087578474635863
    },
    {
        "x": 1921.9,
        "y": 0.40957959933888693
    },
    {
        "x": 1922,
        "y": 0.41037265109219573
    },
    {
        "x": 1922.1,
        "y": 0.41113661327279927
    },
    {
        "x": 1922.2,
        "y": 0.4118713980163543
    },
    {
        "x": 1922.3,
        "y": 0.41257699285596094
    },
    {
        "x": 1922.4,
        "y": 0.4132533853239815
    },
    {
        "x": 1922.5,
        "y": 0.4139005629518883
    },
    {
        "x": 1922.6,
        "y": 0.41451851327411415
    },
    {
        "x": 1922.7,
        "y": 0.41510722382083565
    },
    {
        "x": 1922.8,
        "y": 0.4156666821251144
    },
    {
        "x": 1922.9,
        "y": 0.4161968757213337
    },
    {
        "x": 1923,
        "y": 0.4166977921390566
    },
    {
        "x": 1923.1,
        "y": 0.417169490979616
    },
    {
        "x": 1923.2,
        "y": 0.4176123201164519
    },
    {
        "x": 1923.3,
        "y": 0.41802669948658155
    },
    {
        "x": 1923.4,
        "y": 0.418413049031443
    },
    {
        "x": 1923.5,
        "y": 0.4187717886895552
    },
    {
        "x": 1923.6,
        "y": 0.4191033384022082
    },
    {
        "x": 1923.7,
        "y": 0.41940811810719053
    },
    {
        "x": 1923.8,
        "y": 0.41968654774538294
    },
    {
        "x": 1923.9,
        "y": 0.419939047256644
    },
    {
        "x": 1924,
        "y": 0.42016603657978413
    },
    {
        "x": 1924.1,
        "y": 0.4203680010686414
    },
    {
        "x": 1924.2,
        "y": 0.4205456877390514
    },
    {
        "x": 1924.3,
        "y": 0.42069990901816173
    },
    {
        "x": 1924.4,
        "y": 0.42083147733783927
    },
    {
        "x": 1924.5,
        "y": 0.4209412051243182
    },
    {
        "x": 1924.6,
        "y": 0.4210299048074376
    },
    {
        "x": 1924.7,
        "y": 0.42109838881545936
    },
    {
        "x": 1924.8,
        "y": 0.42114746957927107
    },
    {
        "x": 1924.9,
        "y": 0.4211779595257387
    },
    {
        "x": 1925,
        "y": 0.42119067108454156
    },
    {
        "x": 1925.1,
        "y": 0.42118647324929026
    },
    {
        "x": 1925.2,
        "y": 0.4211664612663728
    },
    {
        "x": 1925.3,
        "y": 0.4211317869484913
    },
    {
        "x": 1925.4,
        "y": 0.42108360210839196
    },
    {
        "x": 1925.5,
        "y": 0.4210230585571559
    },
    {
        "x": 1925.6,
        "y": 0.42095130810678694
    },
    {
        "x": 1925.7,
        "y": 0.42086950256891736
    },
    {
        "x": 1925.8,
        "y": 0.4207787937567759
    },
    {
        "x": 1925.9,
        "y": 0.42068033348038153
    },
    {
        "x": 1926,
        "y": 0.4205752735528798
    },
    {
        "x": 1926.1,
        "y": 0.4204648119979712
    },
    {
        "x": 1926.2,
        "y": 0.4203503316933051
    },
    {
        "x": 1926.3,
        "y": 0.4202332617266205
    },
    {
        "x": 1926.4,
        "y": 0.42011503118427734
    },
    {
        "x": 1926.5,
        "y": 0.41999706916056223
    },
    {
        "x": 1926.6,
        "y": 0.4198808047402292
    },
    {
        "x": 1926.7,
        "y": 0.419767667012794
    },
    {
        "x": 1926.8,
        "y": 0.41965908506591126
    },
    {
        "x": 1926.9,
        "y": 0.41955648799195844
    },
    {
        "x": 1927,
        "y": 0.41946130487500866
    },
    {
        "x": 1927.1,
        "y": 0.41937499784721916
    },
    {
        "x": 1927.2,
        "y": 0.4192991611869568
    },
    {
        "x": 1927.3,
        "y": 0.4192354222168145
    },
    {
        "x": 1927.4,
        "y": 0.41918540825684864
    },
    {
        "x": 1927.5,
        "y": 0.4191507466275278
    },
    {
        "x": 1927.6,
        "y": 0.41913306465230066
    },
    {
        "x": 1927.7,
        "y": 0.419133989647601
    },
    {
        "x": 1927.8,
        "y": 0.41915514893755157
    },
    {
        "x": 1927.9,
        "y": 0.41919816984159114
    },
    {
        "x": 1928,
        "y": 0.4192646796821332
    },
    {
        "x": 1928.1,
        "y": 0.419356315947201
    },
    {
        "x": 1928.2,
        "y": 0.41947475680650564
    },
    {
        "x": 1928.3,
        "y": 0.4196216905989082
    },
    {
        "x": 1928.4,
        "y": 0.4197988056629523
    },
    {
        "x": 1928.5,
        "y": 0.4200077903355305
    },
    {
        "x": 1928.6,
        "y": 0.42025033295679587
    },
    {
        "x": 1928.7,
        "y": 0.4205281218647732
    },
    {
        "x": 1928.8,
        "y": 0.42084284539721956
    },
    {
        "x": 1928.9,
        "y": 0.42119619189274116
    },
    {
        "x": 1929,
        "y": 0.4215898496902473
    },
    {
        "x": 1929.1,
        "y": 0.4220254815107078
    },
    {
        "x": 1929.2,
        "y": 0.4225046476036646
    },
    {
        "x": 1929.3,
        "y": 0.42302888260421334
    },
    {
        "x": 1929.4,
        "y": 0.42359972114265376
    },
    {
        "x": 1929.5,
        "y": 0.42421869785531885
    },
    {
        "x": 1929.6,
        "y": 0.4248873473728058
    },
    {
        "x": 1929.7,
        "y": 0.4256072043296119
    },
    {
        "x": 1929.8,
        "y": 0.42637980335886216
    },
    {
        "x": 1929.9,
        "y": 0.4272066790922567
    },
    {
        "x": 1930,
        "y": 0.42808936616506765
    },
    {
        "x": 1930.1,
        "y": 0.42902932985117714
    },
    {
        "x": 1930.2,
        "y": 0.43002775799362297
    },
    {
        "x": 1930.3,
        "y": 0.4310857690823181
    },
    {
        "x": 1930.4,
        "y": 0.43220448159937624
    },
    {
        "x": 1930.5,
        "y": 0.4333850140313595
    },
    {
        "x": 1930.6,
        "y": 0.4346284848658789
    },
    {
        "x": 1930.7,
        "y": 0.4359360125871316
    },
    {
        "x": 1930.8,
        "y": 0.43730871568435536
    },
    {
        "x": 1930.9,
        "y": 0.43874771263923407
    },
    {
        "x": 1931,
        "y": 0.44025412194110136
    },
    {
        "x": 1931.1,
        "y": 0.441828951532563
    },
    {
        "x": 1931.2,
        "y": 0.4434727671950711
    },
    {
        "x": 1931.3,
        "y": 0.4451860241668477
    },
    {
        "x": 1931.4,
        "y": 0.4469691776858424
    },
    {
        "x": 1931.5,
        "y": 0.44882268298911343
    },
    {
        "x": 1931.6,
        "y": 0.45074699531593204
    },
    {
        "x": 1931.7,
        "y": 0.4527425699055055
    },
    {
        "x": 1931.8,
        "y": 0.45480986199558643
    },
    {
        "x": 1931.9,
        "y": 0.45694932682365136
    },
    {
        "x": 1932,
        "y": 0.45916141962901297
    },
    {
        "x": 1932.1,
        "y": 0.46144645542550683
    },
    {
        "x": 1932.2,
        "y": 0.4638041883338581
    },
    {
        "x": 1932.3,
        "y": 0.4662342322499017
    },
    {
        "x": 1932.4,
        "y": 0.4687362010682899
    },
    {
        "x": 1932.5,
        "y": 0.4713097086875171
    },
    {
        "x": 1932.6,
        "y": 0.4739543690012457
    },
    {
        "x": 1932.7,
        "y": 0.4766697959054404
    },
    {
        "x": 1932.8,
        "y": 0.4794556032967552
    },
    {
        "x": 1932.9,
        "y": 0.4823114050725645
    },
    {
        "x": 1933,
        "y": 0.48523681512710376
    },
    {
        "x": 1933.1,
        "y": 0.4882312934117138
    },
    {
        "x": 1933.2,
        "y": 0.49129368409667185
    },
    {
        "x": 1933.3,
        "y": 0.4944226774062874
    },
    {
        "x": 1933.4,
        "y": 0.49761696356606744
    },
    {
        "x": 1933.5,
        "y": 0.5008752328019729
    },
    {
        "x": 1933.6,
        "y": 0.5041961753368577
    },
    {
        "x": 1933.7,
        "y": 0.5075784813973333
    },
    {
        "x": 1933.8,
        "y": 0.5110208412083747
    },
    {
        "x": 1933.9,
        "y": 0.5145219449951476
    },
    {
        "x": 1934,
        "y": 0.518080482981808
    },
    {
        "x": 1934.1,
        "y": 0.5216949973034068
    },
    {
        "x": 1934.2,
        "y": 0.5253634377386573
    },
    {
        "x": 1934.3,
        "y": 0.529083605977249
    },
    {
        "x": 1934.4,
        "y": 0.5328533037031682
    },
    {
        "x": 1934.5,
        "y": 0.5366703326081894
    },
    {
        "x": 1934.6,
        "y": 0.5405324943783196
    },
    {
        "x": 1934.7,
        "y": 0.5444375907036367
    },
    {
        "x": 1934.8,
        "y": 0.5483834232707965
    },
    {
        "x": 1934.9,
        "y": 0.5523677937684386
    },
    {
        "x": 1935,
        "y": 0.556388503885757
    },
    {
        "x": 1935.1,
        "y": 0.5604432343317557
    },
    {
        "x": 1935.2,
        "y": 0.5645291819202829
    },
    {
        "x": 1935.3,
        "y": 0.5686434224811407
    },
    {
        "x": 1935.4,
        "y": 0.5727830318486614
    },
    {
        "x": 1935.5,
        "y": 0.5769450858558326
    },
    {
        "x": 1935.6,
        "y": 0.5811266603370885
    },
    {
        "x": 1935.7,
        "y": 0.5853248311238326
    },
    {
        "x": 1935.8,
        "y": 0.5895366740513506
    },
    {
        "x": 1935.9,
        "y": 0.593759264951606
    },
    {
        "x": 1936,
        "y": 0.5979896796586969
    },
    {
        "x": 1936.1,
        "y": 0.6022249155980879
    },
    {
        "x": 1936.2,
        "y": 0.6064616565644637
    },
    {
        "x": 1936.3,
        "y": 0.610696507947847
    },
    {
        "x": 1936.4,
        "y": 0.6149260751334761
    },
    {
        "x": 1936.5,
        "y": 0.6191469635123458
    },
    {
        "x": 1936.6,
        "y": 0.6233557784713484
    },
    {
        "x": 1936.7,
        "y": 0.6275491253982947
    },
    {
        "x": 1936.8,
        "y": 0.6317236096797518
    },
    {
        "x": 1936.9,
        "y": 0.6358758367059341
    },
    {
        "x": 1937,
        "y": 0.6400024118653449
    },
    {
        "x": 1937.1,
        "y": 0.6440999188949713
    },
    {
        "x": 1937.2,
        "y": 0.648164854938668
    },
    {
        "x": 1937.3,
        "y": 0.6521936954906854
    },
    {
        "x": 1937.4,
        "y": 0.6561829160446506
    },
    {
        "x": 1937.5,
        "y": 0.6601289920941175
    },
    {
        "x": 1937.6,
        "y": 0.6640283991327098
    },
    {
        "x": 1937.7,
        "y": 0.6678776126559667
    },
    {
        "x": 1937.8,
        "y": 0.6716731081562872
    },
    {
        "x": 1937.9,
        "y": 0.675411361128458
    },
    {
        "x": 1938,
        "y": 0.6790888470656302
    },
    {
        "x": 1938.1,
        "y": 0.6827020874216441
    },
    {
        "x": 1938.2,
        "y": 0.6862477874828782
    },
    {
        "x": 1938.3,
        "y": 0.6897226984945116
    },
    {
        "x": 1938.4,
        "y": 0.6931235717036133
    },
    {
        "x": 1938.5,
        "y": 0.6964471583560435
    },
    {
        "x": 1938.6,
        "y": 0.6996902096982061
    },
    {
        "x": 1938.7,
        "y": 0.702849476974175
    },
    {
        "x": 1938.8,
        "y": 0.7059217114311777
    },
    {
        "x": 1938.9,
        "y": 0.7089036643130191
    },
    {
        "x": 1939,
        "y": 0.7117920868688351
    },
    {
        "x": 1939.1,
        "y": 0.7145838464958912
    },
    {
        "x": 1939.2,
        "y": 0.7172762751914126
    },
    {
        "x": 1939.3,
        "y": 0.7198668211146066
    },
    {
        "x": 1939.4,
        "y": 0.7223529324181315
    },
    {
        "x": 1939.5,
        "y": 0.7247320572541183
    },
    {
        "x": 1939.6,
        "y": 0.7270016437753666
    },
    {
        "x": 1939.7,
        "y": 0.7291591401393276
    },
    {
        "x": 1939.8,
        "y": 0.7312019944963695
    },
    {
        "x": 1939.9,
        "y": 0.7331276549996392
    },
    {
        "x": 1940,
        "y": 0.7349335698055685
    },
    {
        "x": 1940.1,
        "y": 0.7366173656038748
    },
    {
        "x": 1940.2,
        "y": 0.738177383238051
    },
    {
        "x": 1940.3,
        "y": 0.7396121420929526
    },
    {
        "x": 1940.4,
        "y": 0.7409201615467732
    },
    {
        "x": 1940.5,
        "y": 0.7420999609827111
    },
    {
        "x": 1940.6,
        "y": 0.7431500597831505
    },
    {
        "x": 1940.7,
        "y": 0.7440689773297101
    },
    {
        "x": 1940.8,
        "y": 0.7448552330032152
    },
    {
        "x": 1940.9,
        "y": 0.7455073461862785
    },
    {
        "x": 1941,
        "y": 0.7460238362603484
    },
    {
        "x": 1941.1,
        "y": 0.746403445220421
    },
    {
        "x": 1941.2,
        "y": 0.7466458055065824
    },
    {
        "x": 1941.3,
        "y": 0.7467507721770423
    },
    {
        "x": 1941.4,
        "y": 0.7467182002870525
    },
    {
        "x": 1941.5,
        "y": 0.746547944888214
    },
    {
        "x": 1941.6,
        "y": 0.7462398610378285
    },
    {
        "x": 1941.7,
        "y": 0.7457938037915095
    },
    {
        "x": 1941.8,
        "y": 0.7452096282027438
    },
    {
        "x": 1941.9,
        "y": 0.7444871893273228
    },
    {
        "x": 1942,
        "y": 0.7436263422197014
    },
    {
        "x": 1942.1,
        "y": 0.7426271813697347
    },
    {
        "x": 1942.2,
        "y": 0.7414907590069694
    },
    {
        "x": 1942.3,
        "y": 0.7402183667944128
    },
    {
        "x": 1942.4,
        "y": 0.7388112963941019
    },
    {
        "x": 1942.5,
        "y": 0.737270839468939
    },
    {
        "x": 1942.6,
        "y": 0.7355982876820056
    },
    {
        "x": 1942.7,
        "y": 0.7337949326966019
    },
    {
        "x": 1942.8,
        "y": 0.7318620661773384
    },
    {
        "x": 1942.9,
        "y": 0.7298009797857447
    },
    {
        "x": 1943,
        "y": 0.7276129651852976
    },
    {
        "x": 1943.1,
        "y": 0.725299535747313
    },
    {
        "x": 1943.2,
        "y": 0.7228630916804821
    },
    {
        "x": 1943.3,
        "y": 0.7203062548942528
    },
    {
        "x": 1943.4,
        "y": 0.7176316473097629
    },
    {
        "x": 1943.5,
        "y": 0.7148418908384653
    },
    {
        "x": 1943.6,
        "y": 0.7119396073962513
    },
    {
        "x": 1943.7,
        "y": 0.70892741889502
    },
    {
        "x": 1943.8,
        "y": 0.7058079472553076
    },
    {
        "x": 1943.9,
        "y": 0.7025838143874109
    },
    {
        "x": 1944,
        "y": 0.699257642206298
    },
    {
        "x": 1944.1,
        "y": 0.6958322235681488
    },
    {
        "x": 1944.2,
        "y": 0.6923110350768558
    },
    {
        "x": 1944.3,
        "y": 0.688697724275205
    },
    {
        "x": 1944.4,
        "y": 0.684995938707861
    },
    {
        "x": 1944.5,
        "y": 0.6812093259186444
    },
    {
        "x": 1944.6,
        "y": 0.677341533453326
    },
    {
        "x": 1944.7,
        "y": 0.6733962088515523
    },
    {
        "x": 1944.8,
        "y": 0.669376999661472
    },
    {
        "x": 1944.9,
        "y": 0.6652875534242194
    },
    {
        "x": 1945,
        "y": 0.6611315176835115
    },
    {
        "x": 1945.1,
        "y": 0.6569126335765211
    },
    {
        "x": 1945.2,
        "y": 0.6526350166060013
    },
    {
        "x": 1945.3,
        "y": 0.6483028758645754
    },
    {
        "x": 1945.4,
        "y": 0.6439204204492461
    },
    {
        "x": 1945.5,
        "y": 0.6394918594522876
    },
    {
        "x": 1945.6,
        "y": 0.635021401972103
    },
    {
        "x": 1945.7,
        "y": 0.6305132570986693
    },
    {
        "x": 1945.8,
        "y": 0.625971633929782
    },
    {
        "x": 1945.9,
        "y": 0.621400741559321
    },
    {
        "x": 1946,
        "y": 0.6168047890828587
    },
    {
        "x": 1946.1,
        "y": 0.6121879884298114
    },
    {
        "x": 1946.2,
        "y": 0.607554562888428
    },
    {
        "x": 1946.3,
        "y": 0.602908738575681
    },
    {
        "x": 1946.4,
        "y": 0.5982547416156506
    },
    {
        "x": 1946.5,
        "y": 0.5935967981301538
    },
    {
        "x": 1946.6,
        "y": 0.5889391342401616
    },
    {
        "x": 1946.7,
        "y": 0.5842859760668703
    },
    {
        "x": 1946.8,
        "y": 0.5796415497334059
    },
    {
        "x": 1946.9,
        "y": 0.5750100813590812
    },
    {
        "x": 1947,
        "y": 0.5703957970663771
    },
    {
        "x": 1947.1,
        "y": 0.5658028378719435
    },
    {
        "x": 1947.2,
        "y": 0.5612350043665271
    },
    {
        "x": 1947.3,
        "y": 0.5566960120355972
    },
    {
        "x": 1947.4,
        "y": 0.5521895763645224
    },
    {
        "x": 1947.5,
        "y": 0.547719412841428
    },
    {
        "x": 1947.6,
        "y": 0.543289236949614
    },
    {
        "x": 1947.7,
        "y": 0.5389027641744014
    },
    {
        "x": 1947.8,
        "y": 0.5345637100035691
    },
    {
        "x": 1947.9,
        "y": 0.5302757899220785
    },
    {
        "x": 1948,
        "y": 0.5260427194166413
    },
    {
        "x": 1948.1,
        "y": 0.5218680590365982
    },
    {
        "x": 1948.2,
        "y": 0.5177547495967939
    },
    {
        "x": 1948.3,
        "y": 0.5137055769761629
    },
    {
        "x": 1948.4,
        "y": 0.5097233270581536
    },
    {
        "x": 1948.5,
        "y": 0.5058107857173441
    },
    {
        "x": 1948.6,
        "y": 0.5019707388386074
    },
    {
        "x": 1948.7,
        "y": 0.49820597229728436
    },
    {
        "x": 1948.8,
        "y": 0.49451927197398116
    },
    {
        "x": 1948.9,
        "y": 0.4909134237531159
    },
    {
        "x": 1949,
        "y": 0.48739121350807446
    },
    {
        "x": 1949.1,
        "y": 0.48395523202247326
    },
    {
        "x": 1949.2,
        "y": 0.4806072896482108
    },
    {
        "x": 1949.3,
        "y": 0.4773490016529564
    },
    {
        "x": 1949.4,
        "y": 0.47418198329025757
    },
    {
        "x": 1949.5,
        "y": 0.4711078498182984
    },
    {
        "x": 1949.6,
        "y": 0.468128216497876
    },
    {
        "x": 1949.7,
        "y": 0.4652446985827414
    },
    {
        "x": 1949.8,
        "y": 0.4624589113353554
    },
    {
        "x": 1949.9,
        "y": 0.459772470012944
    },
    {
        "x": 1950,
        "y": 0.45718698987358125
    },
    {
        "x": 1950.1,
        "y": 0.4547038833005412
    },
    {
        "x": 1950.2,
        "y": 0.4523237511907922
    },
    {
        "x": 1950.3,
        "y": 0.4500469915623126
    },
    {
        "x": 1950.4,
        "y": 0.4478740024374449
    },
    {
        "x": 1950.5,
        "y": 0.4458051818341733
    },
    {
        "x": 1950.6,
        "y": 0.44384092777550954
    },
    {
        "x": 1950.7,
        "y": 0.4419816382796357
    },
    {
        "x": 1950.8,
        "y": 0.4402277113698397
    },
    {
        "x": 1950.9,
        "y": 0.4385795450646347
    },
    {
        "x": 1951,
        "y": 0.4370375373842463
    },
    {
        "x": 1951.1,
        "y": 0.435601902324559
    },
    {
        "x": 1951.2,
        "y": 0.4342721177776467
    },
    {
        "x": 1951.3,
        "y": 0.4330474776078897
    },
    {
        "x": 1951.4,
        "y": 0.43192727568477407
    },
    {
        "x": 1951.5,
        "y": 0.430910805871594
    },
    {
        "x": 1951.6,
        "y": 0.42999736203475925
    },
    {
        "x": 1951.7,
        "y": 0.42918623804301154
    },
    {
        "x": 1951.8,
        "y": 0.4284767277577706
    },
    {
        "x": 1951.9,
        "y": 0.42786812504918414
    },
    {
        "x": 1952,
        "y": 0.4273597237804422
    },
    {
        "x": 1952.1,
        "y": 0.42695066827702954
    },
    {
        "x": 1952.2,
        "y": 0.42663950468201134
    },
    {
        "x": 1952.3,
        "y": 0.4264246295969983
    },
    {
        "x": 1952.4,
        "y": 0.4263044396258828
    },
    {
        "x": 1952.5,
        "y": 0.4262773313671792
    },
    {
        "x": 1952.6,
        "y": 0.4263417014235374
    },
    {
        "x": 1952.7,
        "y": 0.42649594639840027
    },
    {
        "x": 1952.8,
        "y": 0.4267384628886787
    },
    {
        "x": 1952.9,
        "y": 0.427067647503429
    },
    {
        "x": 1953,
        "y": 0.42748189683611004
    },
    {
        "x": 1953.1,
        "y": 0.4279794988016472
    },
    {
        "x": 1953.2,
        "y": 0.42855830654009364
    },
    {
        "x": 1953.3,
        "y": 0.429216064503519
    },
    {
        "x": 1953.4,
        "y": 0.42995051714060184
    },
    {
        "x": 1953.5,
        "y": 0.4307594089024855
    },
    {
        "x": 1953.6,
        "y": 0.43164048423914825
    },
    {
        "x": 1953.7,
        "y": 0.4325914876067621
    },
    {
        "x": 1953.8,
        "y": 0.4336101634464597
    },
    {
        "x": 1953.9,
        "y": 0.4346942562130741
    },
    {
        "x": 1954,
        "y": 0.43584151035964813
    },
    {
        "x": 1954.1,
        "y": 0.4370496072239866
    },
    {
        "x": 1954.2,
        "y": 0.4383159757046456
    },
    {
        "x": 1954.3,
        "y": 0.43963798159349365
    },
    {
        "x": 1954.4,
        "y": 0.4410129906805142
    },
    {
        "x": 1954.5,
        "y": 0.4424383687536075
    },
    {
        "x": 1954.6,
        "y": 0.44391148160465177
    },
    {
        "x": 1954.7,
        "y": 0.4454296950219282
    },
    {
        "x": 1954.8,
        "y": 0.44699037479767584
    },
    {
        "x": 1954.9,
        "y": 0.44859088671676217
    },
    {
        "x": 1955,
        "y": 0.45022859657528125
    },
    {
        "x": 1955.1,
        "y": 0.4519008560439679
    },
    {
        "x": 1955.2,
        "y": 0.4536049603524636
    },
    {
        "x": 1955.3,
        "y": 0.4553381906094172
    },
    {
        "x": 1955.4,
        "y": 0.45709782792453935
    },
    {
        "x": 1955.5,
        "y": 0.45888115341106744
    },
    {
        "x": 1955.6,
        "y": 0.460685448180676
    },
    {
        "x": 1955.7,
        "y": 0.4625079933426969
    },
    {
        "x": 1955.8,
        "y": 0.4643460700106027
    },
    {
        "x": 1955.9,
        "y": 0.46619695929297694
    },
    {
        "x": 1956,
        "y": 0.46805794230316433
    },
    {
        "x": 1956.1,
        "y": 0.4699263348241882
    },
    {
        "x": 1956.2,
        "y": 0.47179959131768806
    },
    {
        "x": 1956.3,
        "y": 0.47367520092589616
    },
    {
        "x": 1956.4,
        "y": 0.4755506527807932
    },
    {
        "x": 1956.5,
        "y": 0.4774234360215391
    },
    {
        "x": 1956.6,
        "y": 0.47929103978267895
    },
    {
        "x": 1956.7,
        "y": 0.4811509532021864
    },
    {
        "x": 1956.8,
        "y": 0.4830006654180604
    },
    {
        "x": 1956.9,
        "y": 0.48483766556256624
    },
    {
        "x": 1957,
        "y": 0.48665944277710343
    },
    {
        "x": 1957.1,
        "y": 0.48846356227872295
    },
    {
        "x": 1957.2,
        "y": 0.49024789361775817
    },
    {
        "x": 1957.3,
        "y": 0.492010382428099
    },
    {
        "x": 1957.4,
        "y": 0.49374897434052595
    },
    {
        "x": 1957.5,
        "y": 0.4954616149900798
    },
    {
        "x": 1957.6,
        "y": 0.4971462500084614
    },
    {
        "x": 1957.7,
        "y": 0.4988008250295583
    },
    {
        "x": 1957.8,
        "y": 0.5004232856877189
    },
    {
        "x": 1957.9,
        "y": 0.5020115776134575
    },
    {
        "x": 1958,
        "y": 0.5035636464403075
    },
    {
        "x": 1958.1,
        "y": 0.505077543283767
    },
    {
        "x": 1958.2,
        "y": 0.5065517411989668
    },
    {
        "x": 1958.3,
        "y": 0.5079848187179136
    },
    {
        "x": 1958.4,
        "y": 0.5093753543732975
    },
    {
        "x": 1958.5,
        "y": 0.5107219267084727
    },
    {
        "x": 1958.6,
        "y": 0.5120231142530474
    },
    {
        "x": 1958.7,
        "y": 0.5132774955412
    },
    {
        "x": 1958.8,
        "y": 0.5144836491121548
    },
    {
        "x": 1958.9,
        "y": 0.5156401534975672
    },
    {
        "x": 1959,
        "y": 0.516745587233928
    },
    {
        "x": 1959.1,
        "y": 0.5177986528542209
    },
    {
        "x": 1959.2,
        "y": 0.5187985488903926
    },
    {
        "x": 1959.3,
        "y": 0.5197445978703004
    },
    {
        "x": 1959.4,
        "y": 0.5206361223233847
    },
    {
        "x": 1959.5,
        "y": 0.5214724447786769
    },
    {
        "x": 1959.6,
        "y": 0.5222528877649675
    },
    {
        "x": 1959.7,
        "y": 0.5229767738123535
    },
    {
        "x": 1959.8,
        "y": 0.5236434254474217
    },
    {
        "x": 1959.9,
        "y": 0.5242521652015083
    },
    {
        "x": 1960,
        "y": 0.5248023156004463
    },
    {
        "x": 1960.1,
        "y": 0.5252933297024568
    },
    {
        "x": 1960.2,
        "y": 0.5257251826497916
    },
    {
        "x": 1960.3,
        "y": 0.526097980114115
    },
    {
        "x": 1960.4,
        "y": 0.5264118277639029
    },
    {
        "x": 1960.5,
        "y": 0.5266668312708237
    },
    {
        "x": 1960.6,
        "y": 0.526863096306284
    },
    {
        "x": 1960.7,
        "y": 0.5270007285427731
    },
    {
        "x": 1960.8,
        "y": 0.5270798336426044
    },
    {
        "x": 1960.9,
        "y": 0.5271005172845414
    },
    {
        "x": 1961,
        "y": 0.5270628851346312
    },
    {
        "x": 1961.1,
        "y": 0.5269671644503806
    },
    {
        "x": 1961.2,
        "y": 0.5268140688240469
    },
    {
        "x": 1961.3,
        "y": 0.5266044334369487
    },
    {
        "x": 1961.4,
        "y": 0.5263390934693063
    },
    {
        "x": 1961.5,
        "y": 0.5260188841035494
    },
    {
        "x": 1961.6,
        "y": 0.5256446405186013
    },
    {
        "x": 1961.7,
        "y": 0.5252171978953376
    },
    {
        "x": 1961.8,
        "y": 0.5247373914092794
    },
    {
        "x": 1961.9,
        "y": 0.5242060562464992
    },
    {
        "x": 1962,
        "y": 0.5236240275843904
    },
    {
        "x": 1962.1,
        "y": 0.5229922383961204
    },
    {
        "x": 1962.2,
        "y": 0.5223120128078516
    },
    {
        "x": 1962.3,
        "y": 0.5215847727447659
    },
    {
        "x": 1962.4,
        "y": 0.5208119401295936
    },
    {
        "x": 1962.5,
        "y": 0.5199949368776181
    },
    {
        "x": 1962.6,
        "y": 0.5191351849144369
    },
    {
        "x": 1962.7,
        "y": 0.5182341061607335
    },
    {
        "x": 1962.8,
        "y": 0.5172931225374379
    },
    {
        "x": 1962.9,
        "y": 0.5163136559659861
    },
    {
        "x": 1963,
        "y": 0.5152971283674659
    },
    {
        "x": 1963.1,
        "y": 0.5142450248168259
    },
    {
        "x": 1963.2,
        "y": 0.5131590830211934
    },
    {
        "x": 1963.3,
        "y": 0.5120411038365982
    },
    {
        "x": 1963.4,
        "y": 0.510892888122844
    },
    {
        "x": 1963.5,
        "y": 0.5097162367434251
    },
    {
        "x": 1963.6,
        "y": 0.5085129505501418
    },
    {
        "x": 1963.7,
        "y": 0.5072848304068253
    },
    {
        "x": 1963.8,
        "y": 0.506033677170527
    },
    {
        "x": 1963.9,
        "y": 0.504761291701539
    },
    {
        "x": 1964,
        "y": 0.5034694748605277
    },
    {
        "x": 1964.1,
        "y": 0.5021600534222369
    },
    {
        "x": 1964.2,
        "y": 0.5008349578492963
    },
    {
        "x": 1964.3,
        "y": 0.49949614452418095
    },
    {
        "x": 1964.4,
        "y": 0.4981455698218448
    },
    {
        "x": 1964.5,
        "y": 0.4967851901250916
    },
    {
        "x": 1964.6,
        "y": 0.49541696181521533
    },
    {
        "x": 1964.7,
        "y": 0.49404284126970965
    },
    {
        "x": 1964.8,
        "y": 0.4926647848671988
    },
    {
        "x": 1964.9,
        "y": 0.4912847489944841
    },
    {
        "x": 1965,
        "y": 0.48990469002181997
    },
    {
        "x": 1965.1,
        "y": 0.4885265540340974
    },
    {
        "x": 1965.2,
        "y": 0.48715224587972483
    },
    {
        "x": 1965.3,
        "y": 0.48578366011620566
    },
    {
        "x": 1965.4,
        "y": 0.484422691295058
    },
    {
        "x": 1965.5,
        "y": 0.4830712339694502
    },
    {
        "x": 1965.6,
        "y": 0.48173118268890774
    },
    {
        "x": 1965.7,
        "y": 0.4804044320075062
    },
    {
        "x": 1965.8,
        "y": 0.4790928764749332
    },
    {
        "x": 1965.9,
        "y": 0.47779841064678646
    },
    {
        "x": 1966,
        "y": 0.4765229290739664
    },
    {
        "x": 1966.1,
        "y": 0.47526828017929107
    },
    {
        "x": 1966.2,
        "y": 0.47403612788295596
    },
    {
        "x": 1966.3,
        "y": 0.4728280899709409
    },
    {
        "x": 1966.4,
        "y": 0.4716457842314976
    },
    {
        "x": 1966.5,
        "y": 0.4704908284530756
    },
    {
        "x": 1966.6,
        "y": 0.46936484042244864
    },
    {
        "x": 1966.7,
        "y": 0.4682694379295765
    },
    {
        "x": 1966.8,
        "y": 0.46720623876260986
    },
    {
        "x": 1966.9,
        "y": 0.46617686070880004
    },
    {
        "x": 1967,
        "y": 0.4651829215576947
    },
    {
        "x": 1967.1,
        "y": 0.46422596150127626
    },
    {
        "x": 1967.2,
        "y": 0.46330721036727973
    },
    {
        "x": 1967.3,
        "y": 0.46242782037582697
    },
    {
        "x": 1967.4,
        "y": 0.461588943757738
    },
    {
        "x": 1967.5,
        "y": 0.46079173273707136
    },
    {
        "x": 1967.6,
        "y": 0.4600373395456745
    },
    {
        "x": 1967.7,
        "y": 0.45932691641018836
    },
    {
        "x": 1967.8,
        "y": 0.45866161555235835
    },
    {
        "x": 1967.9,
        "y": 0.4580425892079887
    },
    {
        "x": 1968,
        "y": 0.45747098959949395
    },
    {
        "x": 1968.1,
        "y": 0.4569478695629784
    },
    {
        "x": 1968.2,
        "y": 0.4564738843830292
    },
    {
        "x": 1968.3,
        "y": 0.45604958995029227
    },
    {
        "x": 1968.4,
        "y": 0.4556755421562326
    },
    {
        "x": 1968.5,
        "y": 0.4553522968933465
    },
    {
        "x": 1968.6,
        "y": 0.455080410052578
    },
    {
        "x": 1968.7,
        "y": 0.4548604375229229
    },
    {
        "x": 1968.8,
        "y": 0.45469293519981774
    },
    {
        "x": 1968.9,
        "y": 0.45457845897239896
    },
    {
        "x": 1969,
        "y": 0.4545175647327806
    },
    {
        "x": 1969.1,
        "y": 0.45451069901381436
    },
    {
        "x": 1969.2,
        "y": 0.4545578709270459
    },
    {
        "x": 1969.3,
        "y": 0.4546589802245767
    },
    {
        "x": 1969.4,
        "y": 0.4548139266589502
    },
    {
        "x": 1969.5,
        "y": 0.45502260997588884
    },
    {
        "x": 1969.6,
        "y": 0.45528492993331
    },
    {
        "x": 1969.7,
        "y": 0.4556007862802986
    },
    {
        "x": 1969.8,
        "y": 0.45597007876789314
    },
    {
        "x": 1969.9,
        "y": 0.45639270714803504
    },
    {
        "x": 1970,
        "y": 0.45686857117522567
    },
    {
        "x": 1970.1,
        "y": 0.45739746493152506
    },
    {
        "x": 1970.2,
        "y": 0.4579787598360896
    },
    {
        "x": 1970.3,
        "y": 0.4586117216491058
    },
    {
        "x": 1970.4,
        "y": 0.4592956161173383
    },
    {
        "x": 1970.5,
        "y": 0.46002970899842105
    },
    {
        "x": 1970.6,
        "y": 0.46081326604298534
    },
    {
        "x": 1970.7,
        "y": 0.4616455530067706
    },
    {
        "x": 1970.8,
        "y": 0.4625258356416561
    },
    {
        "x": 1970.9,
        "y": 0.46345337970173484
    },
    {
        "x": 1971,
        "y": 0.4644274509417418
    },
    {
        "x": 1971.1,
        "y": 0.4654472258723815
    },
    {
        "x": 1971.2,
        "y": 0.4665115240212317
    },
    {
        "x": 1971.3,
        "y": 0.4676190756826199
    },
    {
        "x": 1971.4,
        "y": 0.46876861114062063
    },
    {
        "x": 1971.5,
        "y": 0.469958860691821
    },
    {
        "x": 1971.6,
        "y": 0.4711885546181158
    },
    {
        "x": 1971.7,
        "y": 0.4724564232093083
    },
    {
        "x": 1971.8,
        "y": 0.4737611967547202
    },
    {
        "x": 1971.9,
        "y": 0.47510160554617936
    },
    {
        "x": 1972,
        "y": 0.4764763798706176
    },
    {
        "x": 1972.1,
        "y": 0.4778841858074356
    },
    {
        "x": 1972.2,
        "y": 0.4793234326090368
    },
    {
        "x": 1972.3,
        "y": 0.480792465318191
    },
    {
        "x": 1972.4,
        "y": 0.4822896289748237
    },
    {
        "x": 1972.5,
        "y": 0.48381326862516955
    },
    {
        "x": 1972.6,
        "y": 0.48536172930996874
    },
    {
        "x": 1972.7,
        "y": 0.4869333560714584
    },
    {
        "x": 1972.8,
        "y": 0.48852649395536424
    },
    {
        "x": 1972.9,
        "y": 0.490139488001169
    },
    {
        "x": 1973,
        "y": 0.4917706832527365
    },
    {
        "x": 1973.1,
        "y": 0.4934183903468215
    },
    {
        "x": 1973.2,
        "y": 0.4950807823061791
    },
    {
        "x": 1973.3,
        "y": 0.4967559977385629
    },
    {
        "x": 1973.4,
        "y": 0.49844217526207857
    },
    {
        "x": 1973.5,
        "y": 0.5001374534900124
    },
    {
        "x": 1973.6,
        "y": 0.5018399710357477
    },
    {
        "x": 1973.7,
        "y": 0.5035478665150107
    },
    {
        "x": 1973.8,
        "y": 0.5052592785389303
    },
    {
        "x": 1973.9,
        "y": 0.5069723457254528
    },
    {
        "x": 1974,
        "y": 0.5086852066844001
    },
    {
        "x": 1974.1,
        "y": 0.5103959966849853
    },
    {
        "x": 1974.2,
        "y": 0.5121028375831749
    },
    {
        "x": 1974.3,
        "y": 0.5138038479057567
    },
    {
        "x": 1974.4,
        "y": 0.5154971461554015
    },
    {
        "x": 1974.5,
        "y": 0.5171808508596547
    },
    {
        "x": 1974.6,
        "y": 0.5188530805232358
    },
    {
        "x": 1974.7,
        "y": 0.5205119536696252
    },
    {
        "x": 1974.8,
        "y": 0.5221555888078934
    },
    {
        "x": 1974.9,
        "y": 0.523782104457072
    },
    {
        "x": 1975,
        "y": 0.5253896191305832
    },
    {
        "x": 1975.1,
        "y": 0.5269762761929927
    },
    {
        "x": 1975.2,
        "y": 0.5285403184096886
    },
    {
        "x": 1975.3,
        "y": 0.5300800133952701
    },
    {
        "x": 1975.4,
        "y": 0.5315936287637947
    },
    {
        "x": 1975.5,
        "y": 0.533079432125665
    },
    {
        "x": 1975.6,
        "y": 0.5345356911023502
    },
    {
        "x": 1975.7,
        "y": 0.5359606733043779
    },
    {
        "x": 1975.8,
        "y": 0.5373526463472327
    },
    {
        "x": 1975.9,
        "y": 0.5387098778442603
    },
    {
        "x": 1976,
        "y": 0.5400306354124699
    },
    {
        "x": 1976.1,
        "y": 0.5413132372224397
    },
    {
        "x": 1976.2,
        "y": 0.5425562036898294
    },
    {
        "x": 1976.3,
        "y": 0.5437581057830444
    },
    {
        "x": 1976.4,
        "y": 0.5449175144696679
    },
    {
        "x": 1976.5,
        "y": 0.546033000732356
    },
    {
        "x": 1976.6,
        "y": 0.5471031355386565
    },
    {
        "x": 1976.7,
        "y": 0.5481264898594431
    },
    {
        "x": 1976.8,
        "y": 0.5491016346654682
    },
    {
        "x": 1976.9,
        "y": 0.5500271409299916
    },
    {
        "x": 1977,
        "y": 0.5509015796255845
    },
    {
        "x": 1977.1,
        "y": 0.5517235976549901
    },
    {
        "x": 1977.2,
        "y": 0.5524921456638898
    },
    {
        "x": 1977.3,
        "y": 0.5532062502270844
    },
    {
        "x": 1977.4,
        "y": 0.5538649379203139
    },
    {
        "x": 1977.5,
        "y": 0.5544672353178202
    },
    {
        "x": 1977.6,
        "y": 0.5550121690011178
    },
    {
        "x": 1977.7,
        "y": 0.5554987655371042
    },
    {
        "x": 1977.8,
        "y": 0.5559260515171531
    },
    {
        "x": 1977.9,
        "y": 0.5562930535076531
    },
    {
        "x": 1978,
        "y": 0.55659879808175
    },
    {
        "x": 1978.1,
        "y": 0.5568424099095931
    },
    {
        "x": 1978.2,
        "y": 0.5570234060303255
    },
    {
        "x": 1978.3,
        "y": 0.5571414015678061
    },
    {
        "x": 1978.4,
        "y": 0.5571960116428316
    },
    {
        "x": 1978.5,
        "y": 0.5571868513911915
    },
    {
        "x": 1978.6,
        "y": 0.5571135359328748
    },
    {
        "x": 1978.7,
        "y": 0.5569756803942468
    },
    {
        "x": 1978.8,
        "y": 0.5567728999040354
    },
    {
        "x": 1978.9,
        "y": 0.5565048095905109
    },
    {
        "x": 1979,
        "y": 0.5561710245721915
    },
    {
        "x": 1979.1,
        "y": 0.5557712690846707
    },
    {
        "x": 1979.2,
        "y": 0.555305703763754
    },
    {
        "x": 1979.3,
        "y": 0.5547745983526459
    },
    {
        "x": 1979.4,
        "y": 0.5541782225953044
    },
    {
        "x": 1979.5,
        "y": 0.5535168462282117
    },
    {
        "x": 1979.6,
        "y": 0.5527907389935567
    },
    {
        "x": 1979.7,
        "y": 0.5520001706394079
    },
    {
        "x": 1979.8,
        "y": 0.5511454108996584
    },
    {
        "x": 1979.9,
        "y": 0.5502267295191792
    },
    {
        "x": 1980,
        "y": 0.5492443962379848
    },
    {
        "x": 1980.1,
        "y": 0.5481987868710657
    },
    {
        "x": 1980.2,
        "y": 0.5470907015061566
    },
    {
        "x": 1980.3,
        "y": 0.5459210462998944
    },
    {
        "x": 1980.4,
        "y": 0.544690727417453
    },
    {
        "x": 1980.5,
        "y": 0.5434006510139652
    },
    {
        "x": 1980.6,
        "y": 0.5420517232461644
    },
    {
        "x": 1980.7,
        "y": 0.5406448502835155
    },
    {
        "x": 1980.8,
        "y": 0.5391809382787472
    },
    {
        "x": 1980.9,
        "y": 0.5376608933907656
    },
    {
        "x": 1981,
        "y": 0.5360856217827248
    },
    {
        "x": 1981.1,
        "y": 0.5344561205812282
    },
    {
        "x": 1981.2,
        "y": 0.532773750798273
    },
    {
        "x": 1981.3,
        "y": 0.5310399644111938
    },
    {
        "x": 1981.4,
        "y": 0.5292562134079174
    },
    {
        "x": 1981.5,
        "y": 0.5274239497589862
    },
    {
        "x": 1981.6,
        "y": 0.5255446254521334
    },
    {
        "x": 1981.7,
        "y": 0.5236196924626206
    },
    {
        "x": 1981.8,
        "y": 0.5216506027736684
    },
    {
        "x": 1981.9,
        "y": 0.5196388083673719
    },
    {
        "x": 1982,
        "y": 0.5175857612191112
    },
    {
        "x": 1982.1,
        "y": 0.5154929800562068
    },
    {
        "x": 1982.2,
        "y": 0.5133622505532112
    },
    {
        "x": 1982.3,
        "y": 0.5111954251400206
    },
    {
        "x": 1982.4,
        "y": 0.5089943562355428
    },
    {
        "x": 1982.5,
        "y": 0.5067608962643694
    },
    {
        "x": 1982.6,
        "y": 0.5044968976478423
    },
    {
        "x": 1982.7,
        "y": 0.502204212810365
    },
    {
        "x": 1982.8,
        "y": 0.49988469417629205
    },
    {
        "x": 1982.9,
        "y": 0.497540194162834
    },
    {
        "x": 1983,
        "y": 0.4951725652014186
    },
    {
        "x": 1983.1,
        "y": 0.4927836959390467
    },
    {
        "x": 1983.2,
        "y": 0.49037561995568996
    },
    {
        "x": 1983.3,
        "y": 0.4879504070631715
    },
    {
        "x": 1983.4,
        "y": 0.4855101270757692
    },
    {
        "x": 1983.5,
        "y": 0.48305684979513225
    },
    {
        "x": 1983.6,
        "y": 0.4805926450361882
    },
    {
        "x": 1983.7,
        "y": 0.4781195826091249
    },
    {
        "x": 1983.8,
        "y": 0.4756397323262455
    },
    {
        "x": 1983.9,
        "y": 0.4731551639917603
    },
    {
        "x": 1984,
        "y": 0.4706679474225021
    },
    {
        "x": 1984.1,
        "y": 0.46818015369279864
    },
    {
        "x": 1984.2,
        "y": 0.4656938589404341
    },
    {
        "x": 1984.3,
        "y": 0.46321114058358487
    },
    {
        "x": 1984.4,
        "y": 0.4607340760281595
    },
    {
        "x": 1984.5,
        "y": 0.45826474268249606
    },
    {
        "x": 1984.6,
        "y": 0.4558052179557938
    },
    {
        "x": 1984.7,
        "y": 0.4533575792621434
    },
    {
        "x": 1984.8,
        "y": 0.4509239040053474
    },
    {
        "x": 1984.9,
        "y": 0.4485062696012321
    },
    {
        "x": 1985,
        "y": 0.4461067534494307
    },
    {
        "x": 1985.1,
        "y": 0.4437273975889995
    },
    {
        "x": 1985.2,
        "y": 0.44137010251960473
    },
    {
        "x": 1985.3,
        "y": 0.4390367333648633
    },
    {
        "x": 1985.4,
        "y": 0.43672915525014194
    },
    {
        "x": 1985.5,
        "y": 0.434449233293396
    },
    {
        "x": 1985.6,
        "y": 0.4321988326219802
    },
    {
        "x": 1985.7,
        "y": 0.42997981836323856
    },
    {
        "x": 1985.8,
        "y": 0.42779405563356937
    },
    {
        "x": 1985.9,
        "y": 0.4256434095612027
    },
    {
        "x": 1986,
        "y": 0.4235297452662679
    },
    {
        "x": 1986.1,
        "y": 0.421454857128495
    },
    {
        "x": 1986.2,
        "y": 0.4194202565469569
    },
    {
        "x": 1986.3,
        "y": 0.4174273841820538
    },
    {
        "x": 1986.4,
        "y": 0.4154776806810257
    },
    {
        "x": 1986.5,
        "y": 0.41357258670618463
    },
    {
        "x": 1986.6,
        "y": 0.41171354290897627
    },
    {
        "x": 1986.7,
        "y": 0.40990198994606686
    },
    {
        "x": 1986.8,
        "y": 0.4081393684713489
    },
    {
        "x": 1986.9,
        "y": 0.40642711913983626
    },
    {
        "x": 1987,
        "y": 0.4047666826089491
    },
    {
        "x": 1987.1,
        "y": 0.4031593999607967
    },
    {
        "x": 1987.2,
        "y": 0.40160621399877067
    },
    {
        "x": 1987.3,
        "y": 0.4001079679639141
    },
    {
        "x": 1987.4,
        "y": 0.39866550508422344
    },
    {
        "x": 1987.5,
        "y": 0.39727966859552905
    },
    {
        "x": 1987.6,
        "y": 0.3959513017333307
    },
    {
        "x": 1987.7,
        "y": 0.3946812477301895
    },
    {
        "x": 1987.8,
        "y": 0.393470349817189
    },
    {
        "x": 1987.9,
        "y": 0.3923194512343179
    },
    {
        "x": 1988,
        "y": 0.391229395213794
    },
    {
        "x": 1988.1,
        "y": 0.3902009106477843
    },
    {
        "x": 1988.2,
        "y": 0.3892342690949232
    },
    {
        "x": 1988.3,
        "y": 0.3883296277595301
    },
    {
        "x": 1988.4,
        "y": 0.38748714385477145
    },
    {
        "x": 1988.5,
        "y": 0.3867069745979882
    },
    {
        "x": 1988.6,
        "y": 0.38598927719429044
    },
    {
        "x": 1988.7,
        "y": 0.3853342088584728
    },
    {
        "x": 1988.8,
        "y": 0.3847419268023613
    },
    {
        "x": 1988.9,
        "y": 0.3842125882415326
    },
    {
        "x": 1989,
        "y": 0.383746350381488
    },
    {
        "x": 1989.1,
        "y": 0.38334325847422235
    },
    {
        "x": 1989.2,
        "y": 0.38300290987512425
    },
    {
        "x": 1989.3,
        "y": 0.3827247899981885
    },
    {
        "x": 1989.4,
        "y": 0.3825083842349081
    },
    {
        "x": 1989.5,
        "y": 0.3823531779821939
    },
    {
        "x": 1989.6,
        "y": 0.38225865664907116
    },
    {
        "x": 1989.7,
        "y": 0.3822243056296911
    },
    {
        "x": 1989.8,
        "y": 0.3822496103265572
    },
    {
        "x": 1989.9,
        "y": 0.38233405613387494
    },
    {
        "x": 1990,
        "y": 0.38247712845588144
    },
    {
        "x": 1990.1,
        "y": 0.38267821745846825
    },
    {
        "x": 1990.2,
        "y": 0.3829363323484023
    },
    {
        "x": 1990.3,
        "y": 0.38325038710166204
    },
    {
        "x": 1990.4,
        "y": 0.38361929570458636
    },
    {
        "x": 1990.5,
        "y": 0.38404197212255275
    },
    {
        "x": 1990.6,
        "y": 0.3845173303358559
    },
    {
        "x": 1990.7,
        "y": 0.3850442843190893
    },
    {
        "x": 1990.8,
        "y": 0.3856217480572482
    },
    {
        "x": 1990.9,
        "y": 0.3862486355181512
    },
    {
        "x": 1991,
        "y": 0.38692386068082313
    },
    {
        "x": 1991.1,
        "y": 0.3876462673019069
    },
    {
        "x": 1991.2,
        "y": 0.3884144182822418
    },
    {
        "x": 1991.3,
        "y": 0.3892268062813367
    },
    {
        "x": 1991.4,
        "y": 0.3900819239851294
    },
    {
        "x": 1991.5,
        "y": 0.39097826406641484
    },
    {
        "x": 1991.6,
        "y": 0.39191431919521025
    },
    {
        "x": 1991.7,
        "y": 0.39288858204840144
    },
    {
        "x": 1991.8,
        "y": 0.39389954530317406
    },
    {
        "x": 1991.9,
        "y": 0.39494570162449666
    },
    {
        "x": 1992,
        "y": 0.3960255436975777
    },
    {
        "x": 1992.1,
        "y": 0.397137523266838
    },
    {
        "x": 1992.2,
        "y": 0.3982799283946137
    },
    {
        "x": 1992.3,
        "y": 0.39945100621117396
    },
    {
        "x": 1992.4,
        "y": 0.4006490038588589
    },
    {
        "x": 1992.5,
        "y": 0.4018721684651182
    },
    {
        "x": 1992.6,
        "y": 0.40311874716900553
    },
    {
        "x": 1992.7,
        "y": 0.40438698710920395
    },
    {
        "x": 1992.8,
        "y": 0.40567513541171896
    },
    {
        "x": 1992.9,
        "y": 0.4069814392223109
    },
    {
        "x": 1993,
        "y": 0.4083041456689115
    },
    {
        "x": 1993.1,
        "y": 0.4096414901166246
    },
    {
        "x": 1993.2,
        "y": 0.4109916608260802
    },
    {
        "x": 1993.3,
        "y": 0.41235283428856784
    },
    {
        "x": 1993.4,
        "y": 0.4137231869936909
    },
    {
        "x": 1993.5,
        "y": 0.4151008954346231
    },
    {
        "x": 1993.6,
        "y": 0.41648413609990037
    },
    {
        "x": 1993.7,
        "y": 0.41787108548457286
    },
    {
        "x": 1993.8,
        "y": 0.4192599200649314
    },
    {
        "x": 1993.9,
        "y": 0.4206488163479609
    },
    {
        "x": 1994,
        "y": 0.42203595081339035
    },
    {
        "x": 1994.1,
        "y": 0.4234195144224549
    },
    {
        "x": 1994.2,
        "y": 0.42479775600068614
    },
    {
        "x": 1994.3,
        "y": 0.4261689388347005
    },
    {
        "x": 1994.4,
        "y": 0.4275313262211599
    },
    {
        "x": 1994.5,
        "y": 0.4288831814523742
    },
    {
        "x": 1994.6,
        "y": 0.4302227678204151
    },
    {
        "x": 1994.7,
        "y": 0.4315483486132231
    },
    {
        "x": 1994.8,
        "y": 0.4328581871275796
    },
    {
        "x": 1994.9,
        "y": 0.43415054665373315
    },
    {
        "x": 1995,
        "y": 0.43542369048189805
    },
    {
        "x": 1995.1,
        "y": 0.43667592145541845
    },
    {
        "x": 1995.2,
        "y": 0.4379057006223601
    },
    {
        "x": 1995.3,
        "y": 0.4391115285756544
    },
    {
        "x": 1995.4,
        "y": 0.440291905909275
    },
    {
        "x": 1995.5,
        "y": 0.44144533323125346
    },
    {
        "x": 1995.6,
        "y": 0.4425703111271637
    },
    {
        "x": 1995.7,
        "y": 0.4436653401967368
    },
    {
        "x": 1995.8,
        "y": 0.44472892103158534
    },
    {
        "x": 1995.9,
        "y": 0.4457595542344831
    },
    {
        "x": 1996,
        "y": 0.4467557404014572
    },
    {
        "x": 1996.1,
        "y": 0.4477160437826899
    },
    {
        "x": 1996.2,
        "y": 0.44863928328287667
    },
    {
        "x": 1996.3,
        "y": 0.4495243414520639
    },
    {
        "x": 1996.4,
        "y": 0.4503701008575356
    },
    {
        "x": 1996.5,
        "y": 0.45117544404581966
    },
    {
        "x": 1996.6,
        "y": 0.4519392535838592
    },
    {
        "x": 1996.7,
        "y": 0.45266041202162366
    },
    {
        "x": 1996.8,
        "y": 0.4533378019237383
    },
    {
        "x": 1996.9,
        "y": 0.45397030584135395
    },
    {
        "x": 1997,
        "y": 0.4545568063300496
    },
    {
        "x": 1997.1,
        "y": 0.455096269539872
    },
    {
        "x": 1997.2,
        "y": 0.45558799593163457
    },
    {
        "x": 1997.3,
        "y": 0.45603136954323564
    },
    {
        "x": 1997.4,
        "y": 0.4564257744460232
    },
    {
        "x": 1997.5,
        "y": 0.4567705946654503
    },
    {
        "x": 1997.6,
        "y": 0.4570652142609764
    },
    {
        "x": 1997.7,
        "y": 0.4573090172808194
    },
    {
        "x": 1997.8,
        "y": 0.4575013877664232
    },
    {
        "x": 1997.9,
        "y": 0.4576417097795325
    },
    {
        "x": 1998,
        "y": 0.4577293673526977
    },
    {
        "x": 1998.1,
        "y": 0.4577638380664795
    },
    {
        "x": 1998.2,
        "y": 0.45774497360115307
    },
    {
        "x": 1998.3,
        "y": 0.45767271916180885
    },
    {
        "x": 1998.4,
        "y": 0.4575470199432655
    },
    {
        "x": 1998.5,
        "y": 0.4573678211512537
    },
    {
        "x": 1998.6,
        "y": 0.4571350679953367
    },
    {
        "x": 1998.7,
        "y": 0.4568487056722317
    },
    {
        "x": 1998.8,
        "y": 0.456508679388763
    },
    {
        "x": 1998.9,
        "y": 0.45611493434315514
    },
    {
        "x": 1999,
        "y": 0.4556674157429659
    },
    {
        "x": 1999.1,
        "y": 0.4551661597330838
    },
    {
        "x": 1999.2,
        "y": 0.4546115662560592
    },
    {
        "x": 1999.3,
        "y": 0.45400412617795183
    },
    {
        "x": 1999.4,
        "y": 0.45334433038578914
    },
    {
        "x": 1999.5,
        "y": 0.452632669750756
    },
    {
        "x": 1999.6,
        "y": 0.4518696351599125
    },
    {
        "x": 1999.7,
        "y": 0.45105571748216006
    },
    {
        "x": 1999.8,
        "y": 0.45019140760566906
    },
    {
        "x": 1999.9,
        "y": 0.4492771963991529
    },
    {
        "x": 2000,
        "y": 0.44831357474687483
    },
    {
        "x": 2000.1,
        "y": 0.44730111081874485
    },
    {
        "x": 2000.2,
        "y": 0.4462406819441827
    },
    {
        "x": 2000.3,
        "y": 0.4451332427334271
    },
    {
        "x": 2000.4,
        "y": 0.4439797478123312
    },
    {
        "x": 2000.5,
        "y": 0.4427811518005207
    },
    {
        "x": 2000.6,
        "y": 0.44153840932296534
    },
    {
        "x": 2000.7,
        "y": 0.4402524749800799
    },
    {
        "x": 2000.8,
        "y": 0.43892430341211724
    },
    {
        "x": 2000.9,
        "y": 0.437554849226609
    },
    {
        "x": 2001,
        "y": 0.4361450670465544
    },
    {
        "x": 2001.1,
        "y": 0.4346959673537311
    },
    {
        "x": 2001.2,
        "y": 0.43320878411876673
    },
    {
        "x": 2001.3,
        "y": 0.4316848071688366
    },
    {
        "x": 2001.4,
        "y": 0.4301253263327756
    },
    {
        "x": 2001.5,
        "y": 0.42853163144174555
    },
    {
        "x": 2001.6,
        "y": 0.4269050123221734
    },
    {
        "x": 2001.7,
        "y": 0.4252467588098252
    },
    {
        "x": 2001.8,
        "y": 0.423558160731582
    },
    {
        "x": 2001.9,
        "y": 0.4218405079200212
    },
    {
        "x": 2002,
        "y": 0.42009509020433156
    },
    {
        "x": 2002.1,
        "y": 0.41832322673513156
    },
    {
        "x": 2002.2,
        "y": 0.4165263539463178
    },
    {
        "x": 2002.3,
        "y": 0.41470593760944996
    },
    {
        "x": 2002.4,
        "y": 0.41286344347281656
    },
    {
        "x": 2002.5,
        "y": 0.41100033730259755
    },
    {
        "x": 2002.6,
        "y": 0.4091180848563618
    },
    {
        "x": 2002.7,
        "y": 0.4072181518893017
    },
    {
        "x": 2002.8,
        "y": 0.40530200416798107
    },
    {
        "x": 2002.9,
        "y": 0.40337110744834453
    },
    {
        "x": 2003,
        "y": 0.40142692749234177
    },
    {
        "x": 2003.1,
        "y": 0.39947093062759614
    },
    {
        "x": 2003.2,
        "y": 0.3975045854792587
    },
    {
        "x": 2003.3,
        "y": 0.3955293612296663
    },
    {
        "x": 2003.4,
        "y": 0.39354672706805477
    },
    {
        "x": 2003.5,
        "y": 0.391558152200688
    },
    {
        "x": 2003.6,
        "y": 0.3895651057972091
    },
    {
        "x": 2003.7,
        "y": 0.38756905706799083
    },
    {
        "x": 2003.8,
        "y": 0.38557147518189716
    },
    {
        "x": 2003.9,
        "y": 0.3835738293410084
    },
    {
        "x": 2004,
        "y": 0.3815775887360008
    },
    {
        "x": 2004.1,
        "y": 0.37958419562408974
    },
    {
        "x": 2004.2,
        "y": 0.37759498455971285
    },
    {
        "x": 2004.3,
        "y": 0.37561126314682813
    },
    {
        "x": 2004.4,
        "y": 0.373634338991681
    },
    {
        "x": 2004.5,
        "y": 0.37166551972202116
    },
    {
        "x": 2004.6,
        "y": 0.36970611295116035
    },
    {
        "x": 2004.7,
        "y": 0.36775742628904273
    },
    {
        "x": 2004.8,
        "y": 0.3658207673545666
    },
    {
        "x": 2004.9,
        "y": 0.36389744376161204
    },
    {
        "x": 2005,
        "y": 0.3619887631132946
    },
    {
        "x": 2005.1,
        "y": 0.36009598470398496
    },
    {
        "x": 2005.2,
        "y": 0.3582201744540669
    },
    {
        "x": 2005.3,
        "y": 0.35636234997785593
    },
    {
        "x": 2005.4,
        "y": 0.35452352886789706
    },
    {
        "x": 2005.5,
        "y": 0.3527047287217504
    },
    {
        "x": 2005.6,
        "y": 0.35090696714190045
    },
    {
        "x": 2005.7,
        "y": 0.3491312617430296
    },
    {
        "x": 2005.8,
        "y": 0.34737863009969683
    },
    {
        "x": 2005.9,
        "y": 0.3456500898250141
    },
    {
        "x": 2006,
        "y": 0.3439466585155197
    },
    {
        "x": 2006.1,
        "y": 0.3422692943844004
    },
    {
        "x": 2006.2,
        "y": 0.3406187180223174
    },
    {
        "x": 2006.3,
        "y": 0.3389955906400558
    },
    {
        "x": 2006.4,
        "y": 0.33740057345085067
    },
    {
        "x": 2006.5,
        "y": 0.3358343276530283
    },
    {
        "x": 2006.6,
        "y": 0.33429751446375544
    },
    {
        "x": 2006.7,
        "y": 0.3327907950800575
    },
    {
        "x": 2006.8,
        "y": 0.3313148307145353
    },
    {
        "x": 2006.9,
        "y": 0.3298702825730878
    },
    {
        "x": 2007,
        "y": 0.3284578118647747
    },
    {
        "x": 2007.1,
        "y": 0.32707802177439554
    },
    {
        "x": 2007.2,
        "y": 0.32573128341354224
    },
    {
        "x": 2007.3,
        "y": 0.3244179098760107
    },
    {
        "x": 2007.4,
        "y": 0.3231382142613624
    },
    {
        "x": 2007.5,
        "y": 0.3218925096544171
    },
    {
        "x": 2007.6,
        "y": 0.32068110915142234
    },
    {
        "x": 2007.7,
        "y": 0.3195043258436921
    },
    {
        "x": 2007.8,
        "y": 0.3183624728291299
    },
    {
        "x": 2007.9,
        "y": 0.3172558631989878
    },
    {
        "x": 2008,
        "y": 0.3161848100451621
    },
    {
        "x": 2008.1,
        "y": 0.3151495809090868
    },
    {
        "x": 2008.2,
        "y": 0.3141502611463145
    },
    {
        "x": 2008.3,
        "y": 0.3131868905470281
    },
    {
        "x": 2008.4,
        "y": 0.3122595089122059
    },
    {
        "x": 2008.5,
        "y": 0.3113681560459725
    },
    {
        "x": 2008.6,
        "y": 0.3105128717436135
    },
    {
        "x": 2008.7,
        "y": 0.3096936958003339
    },
    {
        "x": 2008.8,
        "y": 0.30891066801819783
    },
    {
        "x": 2008.9,
        "y": 0.30816382818930305
    },
    {
        "x": 2009,
        "y": 0.30745321612292587
    },
    {
        "x": 2009.1,
        "y": 0.30677884559325713
    },
    {
        "x": 2009.2,
        "y": 0.30614062629199407
    },
    {
        "x": 2009.3,
        "y": 0.30553844190551477
    },
    {
        "x": 2009.4,
        "y": 0.3049721761138659
    },
    {
        "x": 2009.5,
        "y": 0.3044417125828249
    },
    {
        "x": 2009.6,
        "y": 0.30394693499798914
    },
    {
        "x": 2009.7,
        "y": 0.3034877270411197
    },
    {
        "x": 2009.8,
        "y": 0.30306397238759536
    },
    {
        "x": 2009.9,
        "y": 0.30267555471339963
    },
    {
        "x": 2010,
        "y": 0.3023223576976684
    },
    {
        "x": 2010.1,
        "y": 0.302004261309001
    },
    {
        "x": 2010.2,
        "y": 0.3017211306645276
    },
    {
        "x": 2010.3,
        "y": 0.30147282716830764
    },
    {
        "x": 2010.4,
        "y": 0.3012592122449288
    },
    {
        "x": 2010.5,
        "y": 0.3010801472802844
    },
    {
        "x": 2010.6,
        "y": 0.3009354937042597
    },
    {
        "x": 2010.7,
        "y": 0.3008251129063357
    },
    {
        "x": 2010.8,
        "y": 0.3007488663089361
    },
    {
        "x": 2010.9,
        "y": 0.30070661531709003
    },
    {
        "x": 2011,
        "y": 0.30069822133535606
    },
    {
        "x": 2011.1,
        "y": 0.3007235617286919
    },
    {
        "x": 2011.2,
        "y": 0.3007825776900938
    },
    {
        "x": 2011.3,
        "y": 0.3008752263574515
    },
    {
        "x": 2011.4,
        "y": 0.3010014648878709
    },
    {
        "x": 2011.5,
        "y": 0.30116125041647385
    },
    {
        "x": 2011.6,
        "y": 0.30135454009937673
    },
    {
        "x": 2011.7,
        "y": 0.3015812910755339
    },
    {
        "x": 2011.8,
        "y": 0.3018414604896424
    },
    {
        "x": 2011.9,
        "y": 0.3021350054901052
    },
    {
        "x": 2012,
        "y": 0.3024618832195751
    },
    {
        "x": 2012.1,
        "y": 0.3028220799396427
    },
    {
        "x": 2012.2,
        "y": 0.3032156983809463
    },
    {
        "x": 2012.3,
        "y": 0.30364287037332344
    },
    {
        "x": 2012.4,
        "y": 0.30410372776224953
    },
    {
        "x": 2012.5,
        "y": 0.30459840237884445
    },
    {
        "x": 2012.6,
        "y": 0.3051270260645174
    },
    {
        "x": 2012.7,
        "y": 0.3056897306606766
    },
    {
        "x": 2012.8,
        "y": 0.3062866480046916
    },
    {
        "x": 2012.9,
        "y": 0.30691790993876694
    },
    {
        "x": 2013,
        "y": 0.30758364829394946
    },
    {
        "x": 2013.1,
        "y": 0.308284029277638
    },
    {
        "x": 2013.2,
        "y": 0.3090193565801
    },
    {
        "x": 2013.3,
        "y": 0.30978996824749194
    },
    {
        "x": 2013.4,
        "y": 0.3105962023269093
    },
    {
        "x": 2013.5,
        "y": 0.3114383968621247
    },
    {
        "x": 2013.6,
        "y": 0.31231688991443135
    },
    {
        "x": 2013.7,
        "y": 0.31323201953055957
    },
    {
        "x": 2013.8,
        "y": 0.31418412375814625
    },
    {
        "x": 2013.9,
        "y": 0.3151735406416399
    },
    {
        "x": 2014,
        "y": 0.3162006082397402
    },
    {
        "x": 2014.1,
        "y": 0.31726569605731325
    },
    {
        "x": 2014.2,
        "y": 0.318369299437723
    },
    {
        "x": 2014.3,
        "y": 0.3195119451939953
    },
    {
        "x": 2014.4,
        "y": 0.3206941601320187
    },
    {
        "x": 2014.5,
        "y": 0.3219164710501361
    },
    {
        "x": 2014.6,
        "y": 0.3231794047641724
    },
    {
        "x": 2014.7,
        "y": 0.32448348807235083
    },
    {
        "x": 2014.8,
        "y": 0.3258292477842969
    },
    {
        "x": 2014.9,
        "y": 0.32721721071459037
    },
    {
        "x": 2015,
        "y": 0.3286479036534645
    },
    {
        "x": 2015.1,
        "y": 0.33012187594580555
    },
    {
        "x": 2015.2,
        "y": 0.3316397670516642
    },
    {
        "x": 2015.3,
        "y": 0.3332022389517846
    },
    {
        "x": 2015.4,
        "y": 0.33480995364576327
    },
    {
        "x": 2015.5,
        "y": 0.3364635731025533
    },
    {
        "x": 2015.6,
        "y": 0.33816375932470266
    },
    {
        "x": 2015.7,
        "y": 0.3399111742977793
    },
    {
        "x": 2015.8,
        "y": 0.3417064800042786
    },
    {
        "x": 2015.9,
        "y": 0.343550338433262
    },
    {
        "x": 2016,
        "y": 0.3454434115717426
    },
    {
        "x": 2016.1,
        "y": 0.3473863736423347
    },
    {
        "x": 2016.2,
        "y": 0.34937994780877596
    },
    {
        "x": 2016.3,
        "y": 0.35142486946060425
    },
    {
        "x": 2016.4,
        "y": 0.35352187398642954
    },
    {
        "x": 2016.5,
        "y": 0.3556716967781685
    },
    {
        "x": 2016.6,
        "y": 0.35787507323506534
    },
    {
        "x": 2016.7,
        "y": 0.3601327387414357
    },
    {
        "x": 2016.8,
        "y": 0.3624454286995918
    },
    {
        "x": 2016.9,
        "y": 0.36481387848529945
    },
    {
        "x": 2017,
        "y": 0.36723882351463255
    },
    {
        "x": 2017.1,
        "y": 0.3697210034897706
    },
    {
        "x": 2017.2,
        "y": 0.37226117542162174
    },
    {
        "x": 2017.3,
        "y": 0.37486010067720926
    },
    {
        "x": 2017.4,
        "y": 0.3775185405789327
    },
    {
        "x": 2017.5,
        "y": 0.38023725647662054
    },
    {
        "x": 2017.6,
        "y": 0.38301700971162467
    },
    {
        "x": 2017.7,
        "y": 0.38585856163450855
    },
    {
        "x": 2017.8,
        "y": 0.38876267357370703
    },
    {
        "x": 2017.9,
        "y": 0.3917301068827573
    },
    {
        "x": 2018,
        "y": 0.39476162290119693
    },
    {
        "x": 2018.1,
        "y": 0.39785798357128593
    },
    {
        "x": 2018.2,
        "y": 0.4010199531732044
    },
    {
        "x": 2018.3,
        "y": 0.40424829659606537
    },
    {
        "x": 2018.4,
        "y": 0.40754377872002756
    },
    {
        "x": 2018.5,
        "y": 0.4109071644349597
    },
    {
        "x": 2018.6,
        "y": 0.41433921861536577
    },
    {
        "x": 2018.7,
        "y": 0.4178407061505173
    },
    {
        "x": 2018.8,
        "y": 0.4214123919232766
    },
    {
        "x": 2018.9,
        "y": 0.42505504081266465
    },
    {
        "x": 2019,
        "y": 0.42876941770886623
    },
    {
        "x": 2019.1,
        "y": 0.4325562874876201
    },
    {
        "x": 2019.2,
        "y": 0.4364164150475869
    },
    {
        "x": 2019.3,
        "y": 0.44035056524898636
    },
    {
        "x": 2019.4,
        "y": 0.44435950298971966
    },
    {
        "x": 2019.5,
        "y": 0.44844399314961
    },
    {
        "x": 2019.6,
        "y": 0.4526048006184318
    },
    {
        "x": 2019.7,
        "y": 0.456842690266054
    },
    {
        "x": 2019.8,
        "y": 0.46115842698300313
    },
    {
        "x": 2019.9,
        "y": 0.46555277565889214
    }
];

    // Plotly.js format
    var splineWidths = [];
    var splineYears = [];
    for (let pair of faux_spline_points) {
      splineYears.push(String(pair.x));
      splineWidths.push(String(pair.y));
    }

    var splineSet = new Object();
    splineSet[y_name] = splineWidths;
    splineSet[x_name] = splineYears;
    splineSet.name = "20y Spline";
    var color = (color_loc == "line") ? ({color: '#ff0000', width: 4}) : ('#ff0000');
    if (color_loc == "line") {
      splineSet.mode = 'lines';
      splineSet.type = 'scattergl';
    };
    splineSet[color_loc] = color;

    return splineSet;

  }

  PopoutPlots.prototype.prepData_forPlotting = function (allData) {
    if (Lt.preferences.forwardDirection) { // if measuring forward in time...
      var pts = Lt.data.points;
    } else {
      var pts = Lt.helper.reverseData();
    };

    if (Lt.preferences.subAnnual) { // remove earlywood points if sub annually measured
      var pts = pts.filter(e => e && !e.earlywood);
    };

    if (!allData) {
      allData = [];
    }

    var coreData = this.parseJSONPts(pts, Lt.meta.assetName);
    allData.unshift(coreData); // add data to front of array so it's color is consistent as other datasets are added

    var n = this.win.document.getElementById('auto-spaghetti-number').value;
    if (allData.length < n) { // limit of cores before it turns into spagetti plot
      var shapes = [
        'circle',
        'triangle-up',
        'triangle-down',
        'square',
        'diamond',
        'circle-open',
        'triangle-up-open',
        'triangle-down-open',
        'square-open',
        'diamond-open',
      ]

      var colors = [
      '#1f77b4',  // muted blue
      '#ff7f0e',  // safety orange
      '#2ca02c',  // cooked asparagus green
      '#d62728',  // brick red
      '#9467bd',  // muted purple
      '#8c564b',  // chestnut brown
      '#e377c2',  // raspberry yogurt pink
      '#7f7f7f',  // middle gray
      '#bcbd22',  // curry yellow-green
      '#17becf'   // blue-teal
    ];
  } else { // spaghetti plot & finding median line
    var shapes = [];
    var colors = [ '#1f78b4' ]; // blue
    var median = this.median(allData, "years", "widths", "color");
    allData.push(median);
  }

    var data = [];
    var j = 0; // shape index
    var k = 0; // color index
    for (set of allData) {
      let dataObj = new Object();
      dataObj.y = set.widths;
      dataObj.x = set.years;
      dataObj.type = 'scattergl';
      if (shapes.length == 0) { // shapes array has length 0 when creating a spaghetti plot
        dataObj.mode = 'lines';
        dataObj.opacity = 0.5
      } else {
        dataObj.mode = 'lines+markers';
      }
      dataObj.name = set.name;

      if (!set.color) { // regular plot colors
        if (k >= colors.length) { // loop k over default colors (variable length)
          k = 0;
        }
        dataObj.line = { color: colors[k] };
        k++;

        if (j >= shapes.length) { // loop j over default shapes
          j = 0;
        }
        dataObj.marker = { symbol: shapes[j], size: 10 };
        j++;

      } else { // for spaghetti plots
        dataObj.line = {
          color: set.color,
          width: 4
        };
        dataObj.opacity = 1;
      }

      data.push(dataObj);
    };

    this.addPlot_andOptions_toWindow(data);
  }

  PopoutPlots.prototype.addPlot_andOptions_toWindow = function (data) {
    var layout = {
     title: Lt.meta.assetName + ' Time Series',
     autosize: true,
     xaxis: {
       title: 'Year',
     },
     yaxis: {
       title: 'Width (mm)',
     },
     showlegend: false,
   }

   this.config = {
     responsive: true,
     scrollZoom: true,
     displayModeBar: true,
     modeBarButtonsToRemove: ['lasso2d', 'zoomIn2d', 'zoomOut2d'],
     editable: true,
   }

   this.shownData = JSON.parse(JSON.stringify(data));
   this.win.createPlot(data, layout, this.config);
   this.createDataOptions(data);
   this.createListeners(layout);

  }

  PopoutPlots.prototype.createDataOptions = function (data) {
    // create color inputs to change line colors & other options
    var doc = this.win.document;

    var optionsDiv = doc.getElementById('options');

    var i = 0;
    while (optionsDiv.childNodes.length > 1) { // keep description
      let child = optionsDiv.childNodes[i];
      if (child.tagName != 'P') {
        optionsDiv.removeChild(child);
      } else {
        i++;
      }
    }

    var inputTable = doc.createElement('table');
    data.forEach((set, i) => {
      let inputRow = inputTable.insertRow(-1);

      let span = doc.createElement('span');
      span.className = 'data-name-span';
      span.innerHTML = set.name;

      let colorInput = doc.createElement('input');
      colorInput.className = 'colorInputs';
      colorInput.type = 'color';
      colorInput.value = set.line.color;

      let highlightInput = doc.createElement('input');
      highlightInput.className = 'highlightCheckboxes';
      highlightInput.id = String(i); // i = row index
      highlightInput.type = 'checkbox';

      function addCell (row, htmlNode) {
        var cell = row.insertCell(-1);
        cell.appendChild(htmlNode);
      }

      addCell(inputRow, span);
      addCell(inputRow, colorInput);
      addCell(inputRow, highlightInput);

      let deleteBtn = doc.createElement('i');
      deleteBtn.id = String(i); // i = row index
      deleteBtn.className = 'fa fa-times delete-buttons';
      deleteBtn.setAttribute('aria-hidden', 'true');

      var deleteCell = inputRow.insertCell(-1);
      deleteCell.appendChild(deleteBtn);
    })

    optionsDiv.appendChild(inputTable);
  }

  PopoutPlots.prototype.updatePlot = function (new_data) {
    var div = Lt.popoutPlots.win.document.getElementById('plot');

    var w = div.clientWidth;
    var h = div.clientHeight;

    // need layout w/ specified width & height or visual flash occurs
    var update_layout = {
     title: Lt.meta.assetName + ' Time Series',
     autosize: false,
     width: w,
     height: h,
     xaxis: {
       title: 'Year',
     },
     yaxis: {
       title: 'Width (mm)',
     },
     showlegend: false,
   }

    Plotly.react(div, new_data, update_layout, this.config);
    this.win.dispatchEvent(new Event('resize')); // plot will reformat when window resize event called
    this.plot_layout_static = true;
    this.shownData = new_data;

    // recolor color inputs to match data update
    var colorInputs = this.win.document.getElementsByClassName('colorInputs');
    var spans_with_data_names = this.win.document.getElementsByClassName('data-name-span');
    for (let i = 0; i < spans_with_data_names.length; i++) {
      let span_name = spans_with_data_names[i].innerHTML;
      for (set of new_data) {
        if (span_name == set.name) {
          colorInputs[i].value = set.line.color;
        }
      }
    }
  }

  PopoutPlots.prototype.createListeners = function (layout) {
    this.data_pre_highlight_hover = [];
    this.data_pre_highlight_checkbox = [];
    this.plot_layout_static = false;

    function updateData (elem, new_data, option, change) {
      this.shownData = new_data;
      let span = $(elem).closest('tr').find('span.data-name-span')[0];
      for (set of new_data) {
        if (set.name == span.innerHTML) {
          set[option] = change;
          return
        }
      }
    }

    var doc = this.win.document;

    // 1) plot & options resizing
    var plotDiv = doc.getElementById('plot');
    var optionsDiv = doc.getElementById('options')
    $(optionsDiv).resizable({
      handles: 'e'
    });

    var resizeDiv = optionsDiv.getElementsByTagName('div')[0];
    resizeDiv.style.width = '20px'; // increase draggable div size

    var plotDiv = doc.getElementById('plot');
    var wrapperDiv = doc.getElementById('wrapper');
    $(optionsDiv).resize(() => {
      var wrapperWidth = $(wrapperDiv).width();
      $(plotDiv).width( wrapperWidth - $(optionsDiv).width() - (5 * wrapperWidth / 100) );

      if (Lt.popoutPlots.plot_layout_static) {
        Plotly.relayout(plotDiv, layout); // reset layout if set static by updatePlot()
        Lt.popoutPlots.plot_layout_static = false;
      }
      Lt.popoutPlots.win.dispatchEvent(new Event('resize')); // plot will reformat when window resize event called

    });

    // 2) hovering to highlight individual lines
    var spans_with_file_names = doc.getElementsByClassName('data-name-span');
    for (let i = 0; i < spans_with_file_names.length; i++) {
      let span = spans_with_file_names[i];
      span.addEventListener('mouseover', () => {
        this.data_pre_highlight_hover = JSON.parse(JSON.stringify(this.shownData));

        // get all highlighted (checked) datasets to re-activate after mousing out
        var highlightInputs = doc.getElementsByClassName('highlightCheckboxes');
        this.id_of_lines_to_highlight = [];
        for (input of highlightInputs) {
          if (input.checked) {
            // input id = row index
            this.id_of_lines_to_highlight.push(input.id)
          }
        }

        // action when hovered over
        var highlightedSet;
        for (let y = 0; y < this.shownData.length; y++) {
          if (span.innerHTML == this.shownData[y].name) { // median will always be red if highlighted
            if (span.innerHTML == 'Median') {
              this.shownData[y].line = { color: '#ff0000', width: 4 }; // red
            } else {
              this.shownData[y].line = { color: '#00d907', width: 4 }; // green
            }
            this.shownData[y].opacity = 1;
            highlightedSet = this.shownData[y];
          } else {
            this.shownData[y].line = { color: '#797979' };
          }
        }

        // move set to last index of dataset so it renders on top of other lines
        this.shownData.push(highlightedSet);
        // remove original dataset
        let index = this.shownData.indexOf(highlightedSet);
        this.shownData.splice(index, 1); // remove set from data b/c it will be added later

        this.updatePlot(this.shownData);
      });

      // action when mouse stops hovering
      span.addEventListener('mouseout', () => {
        this.updatePlot(this.data_pre_highlight_hover);
        this.shownData = JSON.parse(JSON.stringify(this.data_pre_highlight_hover));

        // check previously checked lines
        if (this.id_of_lines_to_highlight.length > 0) {
          for (id of this.id_of_lines_to_highlight) {
            var rows = doc.getElementsByTagName('tr');
            var row = rows[parseInt(id)];
            var checkbox = row.childNodes[2].childNodes[0]; // checkbox always 2cd child
            checkbox.checked = false;
            checkbox.click();
          }
        }
      })
    }

    // 3) changing line color
    var colorInputs = doc.getElementsByClassName('colorInputs');
    for (let j = 0; j < colorInputs.length; j++) {
      let colorInput = colorInputs[j];
      colorInput.addEventListener('change', () => {
        updateData(colorInput, this.shownData, 'line', { color: colorInput.value } );
        this.updatePlot(this.shownData);
      });
    }

    // 4) using checkbox to highlight multiple cores
    var checkboxes_for_highlighting  = doc.getElementsByClassName('highlightCheckboxes');
    for (let t = 0; t < checkboxes_for_highlighting.length; t++) {
      let highlightInput = checkboxes_for_highlighting[t];

      highlightInput.addEventListener('change', () => {
        let highlightCount = 0;
        for (box of checkboxes_for_highlighting) {
          if (box.checked) {
            highlightCount++
          }
        }

        // check if plot is highlighted from being hovered over
        // do not want to update data_pre_highlight_checkbox if so
        let hightlighted_previously = false;
        for (set of this.shownData) {
          if (set.line.color == '#797979' || set.line.color == '#00d907') {
            hightlighted_previously = true;
            break
          }
        }

        if (hightlighted_previously == false) {
          this.data_pre_highlight_checkbox = JSON.parse(JSON.stringify(this.shownData));
        }

        if (highlightInput.checked) {
          if (highlightCount > 1) {
            updateData(highlightInput, this.shownData, 'line', { color: '#00d907', width: 4 } );
          } else {
            for (input of checkboxes_for_highlighting) {
              updateData(input, this.shownData, 'line', { color: '#797979' } );
            }
            updateData(highlightInput, this.shownData, 'line', { color: '#00d907', width: 4 } );
          }
          updateData(highlightInput, this.shownData, 'opacity', 1 );

          // move set to end so it appears on top of all other lines
          let span = $(highlightInput).closest('tr').find('span.data-name-span')[0];
          for (let h = 0; h < this.shownData.length; h++) {
            let set = this.shownData[h];
            if (set.name == span.innerHTML) {
              this.shownData.push(set);
              this.shownData.splice(h, 1);
            }
          }

        } else {
          if (highlightCount > 0) {
            updateData(highlightInput, this.shownData, 'line', { color: '#797979' } );
          } else {
            this.shownData = JSON.parse(JSON.stringify(this.data_pre_highlight_checkbox)); // plot goes back to original if no inputs checked
          }
        }

        this.updatePlot(this.shownData);

      });
    }

    // 5) delete buttons
    var delete_buttons = doc.getElementsByClassName('delete-buttons');
    var table = doc.getElementsByTagName('table')[0];
    for (let k = 0; k < delete_buttons.length; k++) {
      let deleteBtn = delete_buttons[k];

      deleteBtn.addEventListener('click', () => {
        let span = $(deleteBtn).closest('tr').find('span.data-name-span')[0];
        let row_index = $(deleteBtn).closest('tr').index();
        for (let m = 0; m < this.shownData.length; m++) {
          let set = this.shownData[m];
          if (span.innerHTML == set.name) {
            this.shownData.splice(m, 1);
            table.deleteRow(row_index);
          }
        }

        function remove_from_data (data_array) {
          for (let i = 0; i < data_array.length; i++) {
            let set = data_array[i];
            if (span.innerHTML == set.name) {
              data_array.splice(i, 1);
            }
          }
        }

        remove_from_data(this.data_pre_highlight_hover);
        remove_from_data(this.data_pre_highlight_checkbox);

        let highlight_checkboxes = doc.getElementsByClassName('highlightCheckboxes');
        let checked_question = false;
        for (checkbox of highlight_checkboxes) { // re-activate checkbox to color plot correctly
          if (checkbox.checked) {
            checked_question = true;
            checkbox.checked = false;
            checkbox.click();
            break
          }
        }

        if (checked_question == false) { // reset data color if non checked
          this.shownData = JSON.parse(JSON.stringify(this.data_pre_highlight_checkbox));
        }

        this.updatePlot(this.shownData);

      });
    }

    // 6) spline button
    var splineBtn = doc.getElementById("spline-button");
    splineBtn.addEventListener('click', () => {
      // find median
      for (set of this.shownData) {
        if (set.name == "Median") {
          var median = set;
          break;
        }
      }
      if (!median) { // if no median generated, create one
        var median = Lt.popoutPlots.median(this.shownData, "x", "y", "line");
      }
      // create spline
      var spline = Lt.popoutPlots.spline(median, "x", "y", "line");
      this.shownData.push(spline);

      this.updatePlot(this.shownData);

    });

  }

  PopoutPlots.prototype.updatePlot_afterChangingPoints = function () {
    if (Lt.preferences.forwardDirection) { // if measuring forward in time...
      var pts = Lt.data.points;
    } else {
      var pts = Lt.helper.reverseData();
    };

    if (Lt.preferences.subAnnual) { // remove earlywood points if sub annually measured
      var pts = pts.filter(e => e && !e.earlywood);
    };

    var coreData = this.parseJSONPts(pts, Lt.meta.assetName);

    // find core index in data array & edit its data
    function update_data_points (data_array) {
      for (var i = 0; i < data_array.length; i++) {
        let set = data_array[i];
        if (set.name == Lt.meta.assetName) {
          data_array[i].y = coreData.widths;
          data_array[i].x = coreData.years;
          return
        }
      }
    }

    update_data_points(this.data_pre_highlight_hover);
    update_data_points(this.data_pre_highlight_checkbox);
    update_data_points(this.shownData);
    this.updatePlot(this.shownData);

  }

};

/**
 * Undo actions
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Undo(Lt) {
  this.stack = new Array();
  this.btn = new Button('undo', 'Undo', () => {
    this.pop();
    Lt.metaDataText.updateText();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  });
  this.btn.disable();

  /**
   * Push the current state into stack to retrieve in the case of an undo event
   * @function push
   */
  Undo.prototype.push = function() {
    this.btn.enable();
    Lt.redo.btn.disable();
    Lt.redo.stack.length = 0;
    var restore_points = JSON.parse(JSON.stringify(Lt.data.points));
    this.stack.push({'year': Lt.data.year, 'earlywood': Lt.data.earlywood,
      'index': Lt.data.index, 'points': restore_points });
  };

  /**
   * Pop the last state from the stack, update the data, and push to the redo stack
   * @function pop
   */
  Undo.prototype.pop = function() {
    if (this.stack.length > 0) {
      if (Lt.data.points[Lt.data.index - 1].start) {
        Lt.createPoint.disable();
      } else {
        Lt.mouseLine.from(Lt.data.points[Lt.data.index - 2].latLng);
      }

      Lt.redo.btn.enable();
      var restore_points = JSON.parse(JSON.stringify(Lt.data.points));
      Lt.redo.stack.push({'year': Lt.data.year, 'earlywood': Lt.data.earlywood,
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
    }
  };
}

/**
 * Redo actions
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Redo(Lt) {
  this.stack = new Array();
  this.btn = new Button('redo', 'Redo', () => {
    this.pop();
    Lt.metaDataText.updateText();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  });
  this.btn.disable();

  /**
   * Pop the last state in the stack and update data
   * @function pop
   */
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
 * Calibrate the ppm using a known measurement
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Calibration(Lt) {
  this.active = false;
  this.popup = L.popup({closeButton: false}).setContent(
              '<input type="number" style="border:none; width:50px;"' +
              'value="10" id="length"></input> mm')
  this.btn = new Button(
    'space_bar',
    'Calibrate pixels per millimeter by measuring a known distance\n(This will override image resolution metadata from Elevator!)',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  Calibration.prototype.calculatePPM = function(p1, p2, length) {
    var startPoint = Lt.viewer.project(p1, Lt.getMaxNativeZoom());
    var endPoint = Lt.viewer.project(p2, Lt.getMaxNativeZoom());
    var pixel_length = Math.sqrt(Math.pow(Math.abs(startPoint.x - endPoint.x), 2) +
        Math.pow(Math.abs(endPoint.y - startPoint.y), 2));
    var pixelsPerMillimeter = pixel_length / length;
    var retinaFactor = 1;
    // if (L.Browser.retina) {
    //   retinaFactor = 2; // this is potentially incorrect for 3x+ devices
    // }
    Lt.meta.ppm = pixelsPerMillimeter / retinaFactor;
    Lt.meta.ppmCalibration = true;
    console.log(Lt.meta.ppm);
  }

  Calibration.prototype.enable = function() {
    this.btn.state('active');
    Lt.mouseLine.enable();


    Lt.viewer.getContainer().style.cursor = 'pointer';

    $(document).keyup(e => {
      var key = e.which || e.keyCode;
      if (key === 27) {
        this.disable();
      }
    });

    var latLng_1 = null;
    var latLng_2 = null;
    $(Lt.viewer.getContainer()).click(e => {
      Lt.viewer.getContainer().style.cursor = 'pointer';


      if (latLng_1 === null) {
        latLng_1 = Lt.viewer.mouseEventToLatLng(e);
        Lt.mouseLine.from(latLng_1);
      } else if (latLng_2 === null) {
        latLng_2 = Lt.viewer.mouseEventToLatLng(e);

        this.popup.setLatLng(latLng_2).openOn(Lt.viewer);
        Lt.mouseLine.disable();

        document.getElementById('length').select();

        $(document).keypress(e => {
          var key = e.which || e.keyCode;
          if (key === 13) {
            var length = parseFloat(document.getElementById('length').value);
            this.calculatePPM(latLng_1, latLng_2, length);
            this.disable();
          }
        });
      } else {
        var length = parseFloat(document.getElementById('length').value);
        this.calculatePPM(latLng_1, latLng_2, length);
        this.disable();
      }
    });
  };

  Calibration.prototype.disable = function() {
    $(document).off('keyup');
    // turn off the mouse clicks from previous function
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.mouseLine.disable();
    Lt.viewer.getContainer().style.cursor = 'default';
    this.popup.remove(Lt.viewer);
  };
}

/**
 * Set date of chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Dating(Lt) {
  this.active = false;
  this.btn = new Button(
    'access_time',
    'Set the year of any point and adjust all other points',
    () => { Lt.disableTools(); Lt.collapseTools(); this.enable() },
    () => { this.disable() }
  );

  /**
   * Open a text container for user to input date
   * @function action
   */
  Dating.prototype.action = function(i) {
    if (Lt.data.points[i].year != undefined) {
      var popup = L.popup({closeButton: false})
          .setContent(
          '<input type="number" style="border:none;width:50px;" value="' +
          Lt.data.points[i].year + '" id="year_input"></input>')
          .setLatLng(Lt.data.points[i].latLng)
          .openOn(Lt.viewer);

      document.getElementById('year_input').select();

      $(Lt.viewer.getContainer()).click(e => {
        popup.remove(Lt.viewer);
        this.disable();
      });

      $(document).keypress(e => {
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

            Object.values(Lt.data.points).map((e, i) => {
              if (Lt.data.points[i] && Lt.data.points[i].year != undefined) {
                Lt.data.points[i].year += shift;
              }
            });
            Lt.data.year += shift;
            Lt.visualAsset.reload();
          }
          this.disable();
        }
      });
    }
  };

  /**
   * Enable dating
   * @function enable
   */
  Dating.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
  };

  /**
   * Disable dating
   * @function disable
   */
  Dating.prototype.disable = function() {
    Lt.metaDataText.updateText(); // updates once user hits enter
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }

    this.btn.state('inactive');
    $(Lt.viewer.getContainer()).off('click');
    $(document).off('keypress');
    this.active = false;
  };
}

/**
 * \eate measurement points
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function CreatePoint(Lt) {
  this.active = false;
  this.startPoint = true;
  this.btn = new Button(
    'linear_scale',
    'Create measurement points (Ctrl-m)',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  // create measurement w. ctrl-m
  L.DomEvent.on(window, 'keydown', (e) => {
     if (e.keyCode == 77 && e.getModifierState("Control")) {
       e.preventDefault();
       e.stopPropagation();
       Lt.disableTools();
       this.enable();
     }
  }, this);

  // resume measurement w. ctrl-k
  L.DomEvent.on(window, 'keydown', (e) => {
     if (e.keyCode == 75 && e.getModifierState("Control")) {
       e.preventDefault();
       e.stopPropagation();
       Lt.disableTools();
       this.startPoint = false;
       this.active = true;
       this.enable();
       Lt.mouseLine.from(Lt.data.points[Lt.data.index - 1].latLng);
     }
  }, this);

  /**
   * Enable creating new points on click events
   * @function enable
   */
  CreatePoint.prototype.enable = function() {
    this.btn.state('active');

    if (Lt.data.points.length == 0 && Lt.measurementOptions.userSelectedPref == false) {
      this.disable();
      Lt.measurementOptions.enable();
      return;
    };

    Lt.mouseLine.enable();

    Lt.viewer.getContainer().style.cursor = 'pointer';

    $(document).keyup(e => {
      var key = e.which || e.keyCode;
      if (key === 27) {
        this.disable();
      }
    });

    $(Lt.viewer.getContainer()).click(e => {
      Lt.viewer.getContainer().style.cursor = 'pointer';

      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.undo.push();

      if (this.startPoint) {
        if (Lt.data.points.length <= 1) { // only pop up for first start point
          var popup = L.popup({closeButton: false}).setContent(
              '<input type="number" style="border:none; width:50px;" \
              value="0" id="year_input"></input>')
              .setLatLng(latLng)
              .openOn(Lt.viewer);

              document.getElementById('year_input').select();

              $(document).keypress(e => {
                var key = e.which || e.keyCode;
                if (key === 13) {
                  if (Lt.measurementOptions.forwardDirection == false && Lt.measurementOptions.subAnnual == false) {
                    // must subtract one so newest measurment is consistent with measuring forward value
                    // issue only applies to meauring backwwards annually
                    Lt.data.year = parseInt(document.getElementById('year_input').value) - 1;
                  } else  {
                    Lt.data.year = parseInt(document.getElementById('year_input').value);
                  }
                  popup.remove(Lt.viewer);
                }
              });
        }

        Lt.data.newPoint(this.startPoint, latLng);
        this.startPoint = false;
      } else {
        Lt.data.newPoint(this.startPoint, latLng);
      }

      //call newLatLng with current index and new latlng
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index-1, latLng);

      //create the next mouseline from the new latlng
      Lt.mouseLine.from(latLng);

      this.active = true;   //activate dataPoint after one point is made
    });
  };

  /**
   * Disable creating new points
   * @function disable
   */
  CreatePoint.prototype.disable = function() {
    $(document).off('keyup');
    // turn off the mouse clicks from previous function
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.mouseLine.disable();
    Lt.viewer.getContainer().style.cursor = 'default';
    this.startPoint = true;
  };
}

/**
 * Add a zero growth measurement
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function CreateZeroGrowth(Lt) {
  this.btn = new Button('exposure_zero', 'Add a year with 0 mm width while measuring\n(Locally absent and missing rings count too!)', () => {
    this.add()
  });

  /**
   * Use previous point to add point in the same location to mimic zero growth
   * @function add
   */
  CreateZeroGrowth.prototype.add = function() {
    if (Lt.data.index) {
      var latLng = Lt.data.points[Lt.data.index - 1].latLng;

      Lt.undo.push();

      var yearsIncrease = Lt.measurementOptions.forwardDirection == true;
      var yearsDecrease = Lt.measurementOptions.forwardDirection == false;
      var previousPointEW = Lt.data.points[Lt.data.index - 1].earlywood == true;
      var previousPointLW = Lt.data.points[Lt.data.index - 1].earlywood == false;
      var subAnnualIncrement = Lt.measurementOptions.subAnnual == true;
      var annualIncrement = Lt.measurementOptions.subAnnual == false;

      // ensure point only inserted at end of year
      if (annualIncrement || (yearsIncrease && previousPointLW)) {
        var firstEWCheck = true;
        var secondEWCheck = false;
        var yearAdjustment = Lt.data.year;
      } else if (yearsDecrease && previousPointEW) {
        var firstEWCheck = false;
        var secondEWCheck = true;
        var yearAdjustment = Lt.data.year - 1;
      } else {
        alert('Must be inserted at end of year.');
        return;
      };

      Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': false,
        'year': Lt.data.year, 'earlywood': firstEWCheck, 'latLng': latLng};
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
      Lt.data.index++;
      if (subAnnualIncrement) {
        Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': false,
          'year': yearAdjustment, 'earlywood': secondEWCheck, 'latLng': latLng};
        Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
        Lt.data.index++;
      };

      if (yearsIncrease) {
        Lt.data.year++;
      } else if (yearsDecrease){
        Lt.data.year--;
      };

      Lt.metaDataText.updateText(); // updates after point is inserted
      Lt.annotationAsset.reloadAssociatedYears();
      if (Lt.popoutPlots.win) {
        Lt.popoutPlots.updatePlot_afterChangingPoints();
      }

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
  this.btn = new Button(
    'broken_image',
    'Create a within-year break in measurement path\n(Avoid measuring physical specimen gaps & cracks!)',
    () => {
      Lt.disableTools();
      this.enable();
      Lt.mouseLine.from(Lt.data.points[Lt.data.index - 1].latLng);
    },
    () => { this.disable }
  );

  /**
   * Enable adding a break point from the last point
   * @function enable
   */
  CreateBreak.prototype.enable = function() {
    this.btn.state('active');

    Lt.mouseLine.enable();

    Lt.viewer.getContainer().style.cursor = 'pointer';

    $(Lt.viewer.getContainer()).click(e => {
      Lt.viewer.getContainer().style.cursor = 'pointer';

      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.mouseLine.from(latLng);

      Lt.undo.push();

      Lt.viewer.dragging.disable();
      Lt.data.points[Lt.data.index] = {'start': false, 'skip': false, 'break': true,
        'latLng': latLng};
      Lt.visualAsset.newLatLng(Lt.data.points, Lt.data.index, latLng);
      Lt.data.index++;
      this.disable();

      Lt.createPoint.enable();
    });
  };

  /**
   * Disable adding breaks
   * @function disable
   */
  CreateBreak.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
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
  this.active = false;
  this.btn = new Button(
    'delete',
    'Delete a measurement point',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  /**
   * Delete a point
   * @function action
   * @param i int - delete the point at index i
   */
  DeletePoint.prototype.action = function(i) {
    Lt.undo.push();

    Lt.data.deletePoint(i);

    Lt.visualAsset.reload();
  };

  /**
   * Enable deleting points on click
   * @function enable
   */
  DeletePoint.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    Lt.viewer.getContainer().style.cursor = 'pointer';
  };

  /**
   * Disable deleting points on click
   * @function disable
   */
  DeletePoint.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
  };
}

/**
 * Delete several points on either end of a chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function Cut(Lt) {
  this.active = false;
  this.point = -1;
  this.btn = new Button(
    'content_cut',
    'Delete all points between two selected points',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  /**
   * Defined the point to cut from
   * @function fromPoint
   * @param i int - index of the point to cut from
   */
  Cut.prototype.fromPoint = function(i) {
    this.point = i;
  };

  /**
   * Remove all points from the side of point i
   * @funciton action
   * @param i int - index of a point that will decide which side to cut
   */
  Cut.prototype.action = function(i) {
    Lt.undo.push();

    Lt.data.cut(this.point, i);

    Lt.visualAsset.reload();
    this.disable();
  };

  /**
   * Enable cutting
   * @function enable
   */
  Cut.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    Lt.viewer.getContainer().style.cursor = 'pointer';
    this.point = -1;
  };

  /**
   * Disable cutting
   * @function disable
   */
  Cut.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
    this.point = -1;
  };

}

/**
 * Insert a new measurement point in the middle of chronology
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function InsertPoint(Lt) {
  this.active = false;
  this.btn = new Button(
    'add_circle_outline',
    'Insert a point between two other points (Ctrl-i)',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  // enable w. ctrl-i
  L.DomEvent.on(window, 'keydown', (e) => {
     if (e.keyCode == 73 && !(e.getModifierState("Shift")) && e.getModifierState("Control") && window.name.includes('popout')) { // 73 refers to 'i'
       e.preventDefault();
       e.stopPropagation();
       Lt.disableTools();
       this.enable();
     }
  }, this);

  /**
   * Insert a point on click event
   * @function action
   */
  InsertPoint.prototype.action = function() {
    Lt.viewer.getContainer().style.cursor = 'pointer';

    $(Lt.viewer.getContainer()).click(e => {
      var latLng = Lt.viewer.mouseEventToLatLng(e);

      Lt.undo.push();

      var k = Lt.data.insertPoint(latLng);
      if (k != null) {
        Lt.visualAsset.newLatLng(Lt.data.points, k, latLng);
        Lt.visualAsset.reload();
      }

      //Uncommenting line below will disable tool after one use
      //Currently it will stay enabled until user manually disables tool
      //this.disable();
    });
  };

  /**
   * Enable inserting points
   * @function enable
   */
  InsertPoint.prototype.enable = function() {
    this.btn.state('active');
    this.action();
    this.active = true;
  };

  /**
   * Disable inserting points
   * @function disable
   */
  InsertPoint.prototype.disable = function() {
    $(document).keyup(e => {
          var key = e.which || e.keyCode;
          if (key === 27) { // 27 = esc
            this.disable();
          }
        });

    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
  };
};

/**
 * Insert a new start point where a measurement point exists
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function ConvertToStartPoint(Lt) {
  this.active = false;
  this.btn = new Button(
    'change_circle',
    'Change a measurement point to a start point',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  ConvertToStartPoint.prototype.action = function (i) {
    var points = Lt.data.points;
    var previousYear = points[i].year || 0;

    // convert to start point by changing properties
    points[i].start = true;
    delete points[i].year;
    delete points[i].earlywood;

    if (i - 1 == 0) { // if previous point is first start point
      Lt.deletePoint.action(i - 1);
    };

    // re-assign years to following points
    var previousPoints = points.slice(0, i);
    var followingPoints = points.slice(i);

    if (Lt.measurementOptions.forwardDirection) { // if measuring forward in time
      var yearChange = 1;
    } else { // if measuring backward in time
      var yearChange = -1;
    };

    followingPoints.map((c) => { // c = current point, i = index, a = array
      if (c && !c.start && !c.break) {
        if (Lt.measurementOptions.subAnnual) { // flip earlywood & latewood
          if (c.earlywood) {
            c.earlywood = false;
          } else {
            c.earlywood = true;
          };
        };

        c.year = previousYear;
        if (!(Lt.measurementOptions.subAnnual && c.earlywood)) { // only change year value if latewood or annual measurements
          previousYear += yearChange;
        };
      };
    });
    Lt.data.year = Lt.measurementOptions.forwardDirection? points[points.length-1].year+1: points[points.length-1].year-1;
    Lt.visualAsset.reload();
    Lt.metaDataText.updateText();
    Lt.annotationAsset.reloadAssociatedYears();
    if (Lt.popoutPlots.win) {
      Lt.popoutPlots.updatePlot_afterChangingPoints();
    }
  };

  ConvertToStartPoint.prototype.enable = function () {
    Lt.viewer.getContainer().style.cursor = 'pointer';
    this.btn.state('active');
    this.active = true;
  };

  ConvertToStartPoint.prototype.disable = function () {
    $(document).keyup(e => {
          var key = e.which || e.keyCode;
          if (key === 27) { // 27 = esc
            this.disable();
          }
        });

    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
  };
};

/**
 * Insert a zero growth measurement in the middle of a chronology
 * @constructor
 * @param {Ltrering} Lt - Leaflet treering object
 */
function InsertZeroGrowth(Lt) {
  this.active = false;
  this.btn = new Button(
    'exposure_zero',
    'Insert a year with 0 mm width between two other points ',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  /**
   * Insert a zero growth year after point i
   * @function action
   * @param i int - index of a point to add a zero growth year after
   */
  InsertZeroGrowth.prototype.action = function(i) {
    var latLng = Lt.data.points[i].latLng;

    Lt.undo.push();

    var k = Lt.data.insertZeroGrowth(i, latLng);
    if (k !== null) {
      if (Lt.measurementOptions.subAnnual) Lt.visualAsset.newLatLng(Lt.data.points, k-1, latLng);
      Lt.visualAsset.newLatLng(Lt.data.points, k, latLng);
      Lt.visualAsset.reload();
    }

    this.disable();
  };

  /**
   * Enable adding a zero growth year
   * @function enable
   */
  InsertZeroGrowth.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    Lt.viewer.getContainer().style.cursor = 'pointer';
  };

  /**
   * Disable adding a zero growth year
   * @function disable
   */
  InsertZeroGrowth.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    Lt.viewer.getContainer().style.cursor = 'default';
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
  this.active = false;
  this.btn = new Button(
    'broken_image',
    'Add a break in the series',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  /**
   * Insert a break after point i
   * @function action
   * @param i int - add the break point after index i
   */
  InsertBreak.prototype.action = function(i) {
    var new_points = Lt.data.points;
    var second_points = Object.values(Lt.data.points).splice(i + 1, Lt.data.index - 1);
    var first_point = true;
    var second_point = false;
    var k = i + 1;

    Lt.mouseLine.enable();
    Lt.mouseLine.from(Lt.data.points[i].latLng);

    $(Lt.viewer.getContainer()).click(e => {
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
        this.disable();
        second_point = false;
        this.active = false;
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

        $(document).keypress(e => {
          var key = e.which || e.keyCode;
          if (key === 13) {
            var new_year = parseInt(document.getElementById('year_input').value);
            popup.remove(Lt.viewer);

            var shift = new_year - second_points[0].year;

            second_points.map(e => {
              e.year += shift;
              new_points[k] = e;
              k++;
            });
            Lt.data.year += shift;

            $(Lt.viewer.getContainer()).off('click');

            Lt.undo.push();

            Lt.data.points = new_points;
            Lt.data.index = k;

            Lt.visualAsset.reload();
            this.disable();
          }
        });
      } else {
        this.disable();
        Lt.visualAsset.reload();
      }
    });
  };

  /**
   * Enable inserting a break point
   * @function enable
   */
  InsertBreak.prototype.enable = function() {
    this.btn.state('active');
    this.active = true;
    Lt.viewer.getContainer().style.cursor = 'pointer';
  };

  /**
   * Disable inserting a break point
   * @function disable
   */
  InsertBreak.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    this.active = false;
    Lt.viewer.getContainer().style.cursor = 'default';
    Lt.viewer.dragging.enable();
    Lt.mouseLine.disable();
  };
}

/**
 * View data and download data
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function ViewData(Lt) {
  this.btn = new Button(
    'view_list',
    'View & download measurement data',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  this.dialog = L.control.dialog({'size': [200, 235], 'anchor': [50, 0], 'initOpen': false})
    .setContent('<h5>No Measurement Data</h5>')

    .addTo(Lt.viewer);

  /**
   * Format and download data in Dan's archaic format
   * @function download
   */
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

    if (Lt.measurementOptions.forwardDirection) { // years ascend in value
      var pts = Lt.data.points;
    } else { // otherwise years descend in value
      var pts = Lt.helper.reverseData();
    }

    if (Lt.data.points != undefined && Lt.data.points[1] != undefined) {

      var sum_points;
      var sum_string = '';
      var last_latLng;
      var break_length;
      var length_string;

      if (Lt.measurementOptions.subAnnual) {

        var sum_string = '';
        var ew_string = '';
        var lw_string = '';

        y = pts[1].year;
        var sum_points = pts.filter(e => {
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
        sum_points.map((e, i, a) => {
          if (e.start) {
            last_latLng = e.latLng;
          } else if (e.break) {
            break_length =
              Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
              break_point = true;
          } else {
            if (e.year % 10 == 0) {
              if(sum_string.length > 0) {
                sum_string = sum_string.concat('\n');
              }
              sum_string = sum_string.concat(
                  toEightCharString(Lt.meta.assetName) +
                  toFourCharString(e.year));
            }
            while (e.year > y) {
              sum_string = sum_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                sum_string = sum_string.concat('\n' +
                    toFourCharString(e.year));
              }
            }

            if (!last_latLng) {
              last_latLng = e.latLng;
            };

            var length = Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
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

        // if we ended at the end of a decade, we need to add a new line
        if (y % 10 == 0) {
          sum_string = sum_string.concat('\n' +
          toEightCharString(Lt.meta.assetName) +
          toFourCharString(y));
        }
        sum_string = sum_string.concat(' -9999');

        y = pts[1].year;

        if (pts[1].year % 10 > 0) {
          ew_string = ew_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(pts[1].year));
          lw_string = lw_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(pts[1].year));
        }

        break_point = false;
        pts.map((e, i, a) => {
          if (e.start) {
            last_latLng = e.latLng;
          } else if (e.break) {
            break_length =
              Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
            break_point = true;
          } else {
            if (e.year % 10 == 0) {
              if (e.earlywood) {
                if (ew_string.length >0) {
                  ew_string = ew_string.concat('\n');
                }
                ew_string = ew_string.concat(
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              } else {
                if (lw_string.length >0) {
                  lw_string = lw_string.concat('\n');
                }
                lw_string = lw_string.concat(
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              }
            }
            while (e.year > y) {
              ew_string = ew_string.concat('    -1');
              lw_string = lw_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                ew_string = ew_string.concat('\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
                lw_string = lw_string.concat('\n' +
                    toEightCharString(Lt.meta.assetName) +
                    toFourCharString(e.year));
              }
            }

            length = Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
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

        if (y % 10 == 0) {
          ew_string = ew_string.concat('\n' +
            toEightCharString(Lt.meta.assetName) +
            toFourCharString(y));
          lw_string = lw_string.concat('\n' +
            toEightCharString(Lt.meta.assetName) +
            toFourCharString(y));
        }
        ew_string = ew_string.concat(' -9999');
        lw_string = lw_string.concat(' -9999');

        console.log(sum_string);
        console.log(ew_string);
        console.log(lw_string);

        var zip = new JSZip();
        zip.file((Lt.meta.assetName + '_TW_rwl.txt'), sum_string);
        zip.file((Lt.meta.assetName + '_LW_rwl.txt'), lw_string);
        zip.file((Lt.meta.assetName + '_EW_rwl.txt'), ew_string);

      } else {

        var y = pts[1].year;
        sum_points = pts;

        if (sum_points[1].year % 10 > 0) {
          sum_string = sum_string.concat(
              toEightCharString(Lt.meta.assetName) +
              toFourCharString(sum_points[1].year));
        }
        sum_points.map((e, i, a) => {
          if(e.start) {
              last_latLng = e.latLng;
            }
            else if (e.break) {
              break_length =
                Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
              break_point = true;
            } else {
            if (e.year % 10 == 0) {
              if(sum_string.length > 0) {
                sum_string = sum_string.concat('\n');
              }
              sum_string = sum_string.concat(
                  toEightCharString(Lt.meta.assetName) +
                  toFourCharString(e.year));
            }
            while (e.year > y) {
              sum_string = sum_string.concat('    -1');
              y++;
              if (y % 10 == 0) {
                sum_string = sum_string.concat('\n' +
                    toFourCharString(e.year));
              }
            }

            length = Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000);
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

        if (y % 10 == 0) {
          sum_string = sum_string.concat('\n' +
            toEightCharString(Lt.meta.assetName) +
            toFourCharString(y));
        }
        sum_string = sum_string.concat(' -9999');

        var zip = new JSZip();
        zip.file((Lt.meta.assetName + '_TW_rwl.txt'), sum_string);
      }

      zip.generateAsync({type: 'blob'})
          .then((blob) => {
            saveAs(blob, (Lt.meta.assetName + '_rwl.zip'));
          });
    } else {
      alert('There is no data to download');
    }
  };

  /**
   * Open the data viewer box
   * @function enable
   */
  ViewData.prototype.enable = function() {
    this.btn.state('active');

    var stringSetup; // buttons & table headers
    var stringContent = ''; // years and lengths

    //closes data view if mouse clicks anywhere outside the data viewer box
    $(Lt.viewer.getContainer()).click(e => {
      this.disable();
    });

    if (Lt.measurementOptions.forwardDirection) { // years ascend in value
      var pts = Lt.data.points;
    } else { // otherwise years descend in value
      var pts = Lt.helper.reverseData();
    };

    if (pts[0] != undefined) {
      var y = pts[1].year;

      stringSetup = '<div class ="dataWindow"><div class="button-set">' +
      '<button id="copy-data-button"' +
      'class="icon-button" title="Copy Data to Clipboard, Tab Delimited Column Format"'+
      '><i class="material-icons md-18-data-view">content_copy</i></button><br>  ' +
      '<button id="download-tab-button"' +
      'class ="text-button" title="Download Measurements, Tab Delimited Format"' +
      '>TAB</button><br>  '+
      '<button id="download-csv-button"' +
      'class="text-button" title="Download Measurements, Common Separated Column Format"' +
      '>CSV</button><br>  '+
      '<button id="download-ltrr-button"' +
      'class ="text-button" title="Download Measurements, LTRR Ring Width Format"' +
      '>RWL</button><br>  '+
      '<button id="delete-button"' +
      'class="icon-button delete" title="Delete All Measurement Point Data"' +
      '><i class="material-icons md-18-data-view">delete</i></button></div><table><tr>' +
      '<th style="width: 45%;">Year<br><br></th>' +
      '<th style="width: 70%;">Width (mm)</th></tr>';

      var break_point = false;
      var last_latLng;
      var break_length;
      var break_point;
      var length;
      var copyDataString = Lt.measurementOptions.subAnnual? "Year\t   "+Lt.meta.assetName+"_ew\t"+Lt.meta.assetName+"_lw\t"+Lt.meta.assetName+"_tw\n": "Year\t"+Lt.meta.assetName+"_tw\n";
      var EWTabDataString = "Year\t" + Lt.meta.assetName + "_EW\n";
      var LWTabDataString ="Year\t" + Lt.meta.assetName + "_LW\n";
      var TWTabDataString = "Year\t" + Lt.meta.assetName + "_TW\n";
      var EWoodcsvDataString = "Year," + Lt.meta.assetName + "_EW\n";
      var LWoodcsvDataString ="Year," + Lt.meta.assetName + "_LW\n";
      var TWoodcsvDataString = 'Year,' + Lt.meta.assetName + "_TW\n";
      var lengthAsAString;
      var  totalWidthString = String(totalWidth);
      var totalWidth = 0;
      var wood;

      Lt.data.clean();
      pts.map((e, i, a) => {
        wood = Lt.measurementOptions.subAnnual? (e.earlywood? "E": "L") : ""
        if (e.start) {
          last_latLng = e.latLng;
        } else if (e.break) {
          break_length =
            Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000) / 1000;
          break_point = true;
        } else {
          while (e.year > y) {
            stringContent = stringContent.concat('<tr><td>' + y +
                '-</td><td>N/A</td></tr>');
            y++;
          }
          length = Math.round(Lt.helper.trueDistance(last_latLng, e.latLng) * 1000) / 1000;
          if (break_point) {
            length += break_length;
            length = Math.round(length * 1000) / 1000;
            break_point = false;
          }
          if (length == 9.999) {
            length = 9.998;
          }

          //Format length number into a string with trailing zeros
          lengthAsAString = String(length);
          lengthAsAString = lengthAsAString.padEnd(5,'0');

          if(lengthAsAString.includes('.999'))
          {
              lengthAsAString = lengthAsAString.substring(0,lengthAsAString.length-1);
              lengthAsAString+='8';

          }
          //assign color to data row
          var row_color_html = Lt.helper.assignRowColor(e,y,Lt,lengthAsAString)
          stringContent = stringContent.concat(row_color_html);
          y++;

          last_latLng = e.latLng;

          //Set up CSV files to download later
          //For subannual measurements
          if(Lt.measurementOptions.subAnnual)
          {
          if(wood=='E')
          {
            EWTabDataString += e.year + "\t" + lengthAsAString+ "\n";
            copyDataString += e.year + "\t   "+ lengthAsAString +"   \t";
            EWoodcsvDataString += e.year+","+lengthAsAString+"\n";
            totalWidth+=length;
          }
          else
          {
            LWoodcsvDataString += e.year+","+lengthAsAString+"\n";
            //adding two parts of the year together
            totalWidth+=length;
            totalWidth=Math.round(totalWidth * 1000) / 1000;
            totalWidthString = String(totalWidth);
            totalWidthString = totalWidthString.padEnd(5,'0');
            if(totalWidthString.includes('.999'))
          {
              totalWidthString = totalWidthString.substring(0,totalWidthString.length-1);
              totalWidthString+='8';
          }
            TWoodcsvDataString += e.year+","+totalWidthString+"\n";
            LWTabDataString += e.year + "\t" + lengthAsAString+ "\n";
            TWTabDataString += e.year + "\t" + totalWidthString+ "\n";
            copyDataString += lengthAsAString +"   \t"+totalWidthString +"\n";
            //set to zero only after latewood has been added and totalWidth is in csv
            totalWidth = 0;
          }
        }
        //For annual measurements
        else{
          TWoodcsvDataString+= e.year+","+lengthAsAString+"\n";
           //Copies data to a string that can be copied to the clipboard
           TWTabDataString += e.year + "\t" + lengthAsAString+ "\n";
          copyDataString += e.year + "\t"+ lengthAsAString +"\n";
        }
        }
      });
      this.dialog.setContent(stringSetup + stringContent + '</table><div>');
    } else {
      stringSetup = '<div class ="button-set"><button id="copy-data-button" class="icon-button disabled"  title="Copy Data to Clipboard, Tab Delimited Column Format"'+
      'disabled><i class="material-icons md-18-data-view">content_copy</i></button><br>'+
      '<button id="download-ltrr-button"' +
      'class ="text-button disabled" title="Download Measurements, LTRR Ring Width Format"' +
      'disabled>RWL</button><br>'+
      '<button id="download-csv-button" class="text-button disabled" title="Download Measurements, Common Separated Column Format"' +
      'disabled>CSV</button><br>'+
      '<button id="download-tab-button"' +
      'class ="text-button disabled" title="Download Measurements, Tab Delimited Format"' +
      'disabled>TAB</button><br>'+
      '<button id="delete-button"' +
      'class="icon-button delete" title="Delete All Measurement Point Data"' +
      '><i class="material-icons md-18-data-view">delete</i></button></div>' +
          '<h5>No Measurement Data</h5>';
      this.dialog.setContent(stringSetup);
    }
    this.dialog.lock();
    this.dialog.open();

    $('#download-ltrr-button').click(() => this.download());
    $('#copy-data-button').click(()=> copyToClipboard(copyDataString));
    $('#download-csv-button').click(() => {
     if(Lt.measurementOptions.subAnnual)
     {
       downloadCSVFiles(Lt, TWoodcsvDataString,EWoodcsvDataString, LWoodcsvDataString);
     }
     else{
      downloadCSVFiles(Lt, TWoodcsvDataString);
     }
    }
    );
    $('#download-tab-button').click(() => {
          if(Lt.measurementOptions.subAnnual)
          {
            downloadTabFiles(Lt, TWTabDataString,EWTabDataString, LWTabDataString);
          }
          else{
           downloadTabFiles(Lt, TWTabDataString);
          }
         }
       );
    $('#delete-button').click(() => {
      this.dialog.setContent(
          '<p>This action will delete all data points.' +
          'Annotations will not be effected.' +
          'Are you sure you want to continue?</p>' +
          '<p><button id="confirm-delete"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>confirm</button><button id="cancel-delete"' +
          'class="mdc-button mdc-button--unelevated mdc-button-compact"' +
          '>cancel</button></p>');

      $('#confirm-delete').click(() => {
        Lt.undo.push();

        Lt.data.points = [];
        Lt.data.year = 0;
        if (Lt.measurementOptions.forwardDirection || Lt.measurementOptions.subAnnual == false) { // if years counting up or annual increments, need ew first
          Lt.data.earlywood = true;
        } else if (Lt.measurementOptions.forwardDirection == false){ // if year counting down, need lw first
          Lt.data.earlywood = false;
        };
        Lt.data.index = 0;

        Lt.visualAsset.reload();
        Lt.metaDataText.updateText();

        this.disable();
      });
      $('#cancel-delete').click(() => {
        this.disable();
        this.enable();
      });
    });
  },
  /**
   * copy text to clipboard
   * @function enable
   */
  copyToClipboard = function(allData){
    const el = document.createElement('textarea');
    el.value = allData;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  /**
   * close the data viewer box
   * @function disable
   */
  ViewData.prototype.disable = function() {
    $(Lt.viewer.getContainer()).off('click');
    this.btn.state('inactive');
    $('#confirm-delete').off('click');
    $('#cancel-delete').off('click');
    $('#download-ltrr-button').off('click');
    $('#download-csv-button').off('click');
    $('#download-tab-button').off('click');
    $('#copy-data-button').off('click');
    $('#delete-button').off('click');
    $('#copy-data-button').off('click');
    this.dialog.close();
  };
};

/**
 * Change color properties of image
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function ImageAdjustment(Lt) {
  this.btn = new Button(
    'brightness_6',
    'Adjust image appearance settings',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  this.dialog = L.control.dialog({
    'size': [340, 280],
    'anchor': [50, 5],
    'initOpen': false
  }).setContent(
    '<div><label style="text-align:center;display:block;">Brightness</label> \
    <input class="imageSlider" id="brightness-slider" value=100 min=0 max=300 type=range> \
    <label style="text-align:center;display:block;">Contrast</label> \
    <input class="imageSlider" id="contrast-slider" type=range min=50 max=350 value=100></div> \
    <label style="text-align:center;display:block;">Saturation</label> \
    <input class="imageSlider" id="saturation-slider" type=range min=0 max=350 value=100></div> \
    <label style="text-align:center;display:block;">Hue Rotation</label> \
    <input class="imageSlider" id="hue-slider" type=range min=0 max=360 value=0> \
     <label style="text-align:center;display:block;">Sharpness</label> \
    <input class="imageSlider" id="sharpness-slider" value=0 min=0 max=1 step=0.05 type=range> \
    <label style="text-align:center;display:block;">Emboss</label> \
    <input class="imageSlider" id="emboss-slider" value=0 min=0 max=1 step=0.05 type=range> \
    <label style="text-align:center;display:block;">edgeDetect</label> \
    <input class="imageSlider" id="edgeDetect-slider" value=0 min=0 max=1 step=0.05 type=range> \
    <label style="text-align:center;display:block;">unsharpen</label> \
    <input class="imageSlider" id="unsharpness-slider" value=0 min=0 max=1 step=0.05 type=range> \
    <div class = "checkbox" style = "text-align:center; margin-left:auto; margin-right:auto; margin-top: 5px;display:block;"> <label> <input type = "checkbox" id = "invert-checkbox" > Invert </label></div> \
    <button id="reset-button" style="margin-left:auto; margin-right:auto; margin-top: 5px;display:block;" class="mdc-button mdc-button--unelevated mdc-button-compact">reset</button></div>').addTo(Lt.viewer);

  /**
   * Update the image filter to reflect slider values
   * @function updateFilters
   */
  ImageAdjustment.prototype.updateFilters = function() {
    var brightnessSlider = document.getElementById("brightness-slider");
    var contrastSlider = document.getElementById("contrast-slider");
    var saturationSlider = document.getElementById("saturation-slider");
    var hueSlider = document.getElementById("hue-slider");
    var invert = $("#invert-checkbox").prop('checked')?1:0;
    var sharpnessSlider = document.getElementById("sharpness-slider").value;
    var embossSlider = document.getElementById("emboss-slider").value;
    var edgeDetect = document.getElementById("edgeDetect-slider").value;
    var unsharpnessSlider = document.getElementById("unsharpness-slider").value;
    document.getElementsByClassName("leaflet-pane")[0].style.filter =
      "contrast(" + contrastSlider.value + "%) " +
      "brightness(" + brightnessSlider.value + "%) " +
      "saturate(" + saturationSlider.value + "%) " +
      "invert(" + invert + ")" +
      "hue-rotate(" + hueSlider.value + "deg)";
    Lt.baseLayer['GL Layer'].setKernelsAndStrength([
      {
			"name":"emboss",
			"strength": embossSlider
      },
      {
        "name":"edgeDetect3",
        "strength": edgeDetect
      },
      {
        "name":"sharpness",
        "strength": sharpnessSlider
      },
      {
        "name":"unsharpen",
        "strength": unsharpnessSlider
      }
    ]);
  };

  /**
   * Open the filter sliders dialog
   * @function enable
   */
  ImageAdjustment.prototype.enable = function() {
    this.dialog.lock();
    this.dialog.open();
    var brightnessSlider = document.getElementById("brightness-slider");
    var contrastSlider = document.getElementById("contrast-slider");
    var saturationSlider = document.getElementById("saturation-slider");
    var hueSlider = document.getElementById("hue-slider");
    var sharpnessSlider = document.getElementById("sharpness-slider");
    var embossSlider = document.getElementById("emboss-slider");
    var edgeDetect = document.getElementById("edgeDetect-slider");
    var unsharpnessSlider = document.getElementById("unsharpness-slider");
    //Close view if user clicks anywhere outside of slider window
    $(Lt.viewer.getContainer()).click(e => {
      this.disable();
    });

    this.btn.state('active');
    $(".imageSlider").change(() => {
      this.updateFilters();
    });
    $("#invert-checkbox").change(() => {
      this.updateFilters();
    });
    $("#reset-button").click(() => {
      $(brightnessSlider).val(100);
      $(contrastSlider).val(100);
      $(saturationSlider).val(100);
      $(hueSlider).val(0);
      $(sharpnessSlider).val(0);
      $(embossSlider).val(0);
      $(edgeDetect).val(0);
      $(unsharpnessSlider).val(0);
      this.updateFilters();
    });
    $("#invert-button").click(() => {
      $(brightnessSlider).val(100);
      $(contrastSlider).val(100);
      $(saturationSlider).val(100);
      $(hueSlider).val(0);
      this.updateFilters();
    });
  };

  /**
   * Close the filter sliders dialog
   * @function disable
   */
  ImageAdjustment.prototype.disable = function() {
    this.dialog.unlock();
    this.dialog.close();
    this.btn.state('inactive');
  };

}

/**
* Change measurement options (set subAnnual, previously hasLatewood, and direction)
* @constructor
* @param {Ltreeing} Lt - Leaflet treering object
*/
function MeasurementOptions(Lt) {
  this.userSelectedPref = false;
  this.btn = new Button(
    'settings',
    'Measurement preferences',
    () => { Lt.disableTools(); this.enable() },
    () => { this.disable() }
  );

  /**
  * Data from Lt.preferences
  * @function preferencesInfo
  */
  MeasurementOptions.prototype.preferencesInfo = function () {
    if (Lt.preferences.forwardDirection == false) { // direction object
      this.forwardDirection = false;
    } else {
      this.forwardDirection = true;
    }

    var pts = Lt.data.points;
    let ewFalse = pts.filter(pt => pt && pt.earlywood == false);
    if (ewFalse.length > 0) {
      this.hasLatewood = true;
    } else {
      this.hasLatewood = false;
    };

    if (Lt.preferences.subAnnual == undefined) {
      this.subAnnual = this.hasLatewood;
    } else {
      this.subAnnual = Lt.preferences.subAnnual;
    };
  };

  /**
  * Creates dialog box with preferences
  * @function displayDialog
  */
MeasurementOptions.prototype.displayDialog = function () {
  return L.control.dialog({
     'size': [510, 420],
     'anchor': [50, 5],
     'initOpen': false
   }).setContent(
     '<div><h4 style="text-align:left">Select Preferences for Time-Series Measurement:</h4></div> \
     <hr style="height:2px;border-width:0;color:gray;background-color:gray"> \
      <div><h4>Measurement Direction:</h4></div> \
      <div><input type="radio" name="direction" id="forward_radio"> Measure forward in time (e.g., 1257 &rArr; 1258 &rArr; 1259 ... 2020)</input> \
       <br><input type="radio" name="direction" id="backward_radio"> Measure backward in time (e.g., 2020 &rArr; 2019 &rArr; 2018 ... 1257)</input></div> \
     <br> \
      <div><h4>Measurement Interval:</h4></div> \
      <div><input type="radio" name="increment" id="annual_radio"> One increment per year (e.g., total-ring width)</input> \
       <br><input type="radio" name="increment" id="subannual_radio"> Two increments per year (e.g., earlywood- & latewood-ring width)</input></div> \
     <hr style="height:2px;border-width:0;color:gray;background-color:gray"> \
      <div><p style="text-align:right;font-size:20px">&#9831; &#9831; &#9831;  &#9831; &#9831; &#9831; &#9831; &#9831; &#9831; &#9831;<button type="button" id="confirm-button" class="preferences-button"> Save & close </button></p></div> \
      <div><p style="text-align:left;font-size:12px">Please note: Once measurements are initiated, these preferences are set. To modify, delete all existing points for this asset and initiate a new set of measurements.</p></div>').addTo(Lt.viewer);
  };

  /**
  * Based on initial data, selects buttons/dialog text
  * @function selectedBtns
  */
  MeasurementOptions.prototype.selectedBtns = function () {
    if (this.forwardDirection == true) {
      document.getElementById("forward_radio").checked = true;
    } else {
      document.getElementById("backward_radio").checked = true;
    };

    if (this.subAnnual == true) {
      document.getElementById("subannual_radio").checked = true;
    } else {
      document.getElementById("annual_radio").checked = true;
    };

  };

  /**
  * Changes direction & increment object to be saved
  * @function prefBtnListener
  */
  MeasurementOptions.prototype.prefBtnListener = function () {
    document.getElementById("forward_radio").addEventListener('change', (event) => {
      if (event.target.checked == true) {
        this.forwardDirection = true;
        Lt.data.earlywood = true; // swap which type of point is plotted first
        Lt.metaDataText.updateText(); // update text once selected
      };
    });

    document.getElementById("backward_radio").addEventListener('change', (event) => {
      if (event.target.checked == true) {
        this.forwardDirection = false;
        Lt.data.earlywood = false;
        Lt.metaDataText.updateText();
      };
    });

    document.getElementById("annual_radio").addEventListener('change', (event) => {
      if (event.target.checked == true) {
        this.subAnnual = false;
        Lt.metaDataText.updateText();
      };
    });

    document.getElementById("subannual_radio").addEventListener('change', (event) => {
      if (event.target.checked == true) {
        this.subAnnual = true;
        Lt.metaDataText.updateText();
      };
    });

  };

  /**
  * Open measurement options dialog
  * @function enable
  */
  MeasurementOptions.prototype.enable = function() {
    if (!this.dialog) {
      this.dialog = this.displayDialog();
    };

    this.selectedBtns();

    var forwardRadio = document.getElementById("forward_radio");
    var backwardRadio = document.getElementById("backward_radio");
    var annualRadio = document.getElementById("annual_radio");
    var subAnnualRadio = document.getElementById("subannual_radio");
    if ((Lt.data.points.length === 0 || !Lt.data.points[0]) && window.name.includes('popout')) {
      forwardRadio.disabled = false;
      backwardRadio.disabled = false;
      annualRadio.disabled = false;
      subAnnualRadio.disabled = false;
      this.prefBtnListener();
    } else { // lets users see preferences without being able to change them mid-measurement
      forwardRadio.disabled = true;
      backwardRadio.disabled = true;
      annualRadio.disabled = true;
      subAnnualRadio.disabled = true;
    };

    this.dialog.lock();
    this.dialog.open();
    this.btn.state('active');

    $("#confirm-button").click(() => {
      if (this.userSelectedPref == false) {
        this.userSelectedPref = true;
        Lt.createPoint.enable();
      };
      this.disable();
    });
  };

  /**
  * Close measurement options dialog
  * @function disable
  */
  MeasurementOptions.prototype.disable = function() {
    if (this.dialog) {
      this.dialog.unlock();
      this.dialog.close();
    };

    this.btn.state('inactive');
  };

}

/**
 * Save a local copy of the measurement data
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function SaveLocal(Lt) {
  this.btn = new Button(
    'save',
    'Download .json file of current measurements, annotations, etc.',
    () => { this.action() }
  );

  /**
   * Save a local copy of the measurement data
   * @function action
   */
  SaveLocal.prototype.action = function() {
    Lt.data.clean();
    var dataJSON = {
      'SaveDate': Lt.data.saveDate,
      'year': Lt.data.year,
      'forwardDirection': Lt.measurementOptions.forwardDirection,
      'subAnnual': Lt.measurementOptions.subAnnual,
      'earlywood': Lt.data.earlywood,
      'index': Lt.data.index,
      'points': Lt.data.points,
      'attributesObjectArray': Lt.annotationAsset.attributesObjectArray,
      'annotations': Lt.aData.annotations,
    };

    // don't serialize our default value
    if(Lt.meta.ppm != 468 || Lt.meta.ppmCalibration) {
      dataJSON.ppm = Lt.meta.ppm;
    }

    var file = new File([JSON.stringify(dataJSON)],
        (Lt.meta.assetName + '.json'), {type: 'text/plain;charset=utf-8'});
    saveAs(file);
  };
}

/**
 * Save a copy of the measurement data to the cloud
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function SaveCloud(Lt) {
  this.btn = new Button(
    'cloud_upload',
    'Save the current measurements, annotations, etc.\nto the cloud-hosted .json file (Ctrl-s)',
    () => { this.action() }
  );

  // save w. ctrl-s
  L.DomEvent.on(window, 'keydown', (e) => {
     if (e.keyCode == 83 && e.getModifierState("Control") && window.name.includes('popout')) { // 83 refers to 's'
       e.preventDefault();
       e.stopPropagation();
       this.action();
     };
  });

  this.date = new Date(),

  /**
   * Update the save date & meta data
   * @function updateDate
   */
  SaveCloud.prototype.updateDate = function() {
    this.date = new Date();
    var day = this.date.getDate();
    var month = this.date.getMonth() + 1;
    var year = this.date.getFullYear();
    var minute = this.date.getMinutes();
    var hour = this.date.getHours();
    Lt.data.saveDate = {'day': day, 'month': month, 'year': year, 'hour': hour,
      'minute': minute};
  };

  /**
   * Display the save date in the bottom left corner
   * @function displayDate
   */
  SaveCloud.prototype.displayDate = function() {
    var date = Lt.data.saveDate;
    console.log(date);
    if (date.day != undefined && date.hour != undefined) {
      var am_pm = 'am';
      if (date.hour >= 12) {
        date.hour -= 12;
        am_pm = 'pm';
      }
      if (date.hour == 0) {
        date.hour += 12;
      }
      var minute_string = date.minute;
      if (date.minute < 10) {
        minute_string = '0' + date.minute;
      }

      this.saveText =
          ' &nbsp;|&nbsp; Saved to cloud ' + date.year + '/' + date.month + '/' + date.day + ' ' + date.hour + ':' + minute_string + am_pm;
    } else if (date.day != undefined) {
      this.saveText =
          ' &nbsp;|&nbsp; Saved to cloud ' + date.year + '/' + date.month + '/' + date.day;
    } else {
      this.saveText =
          ' &nbsp;|&nbsp; No data saved to cloud';
    };

    Lt.data.saveDate;
  };

  /**
   * Save the measurement data to the cloud
   * @function action
   */
  SaveCloud.prototype.action = function() {
    if (Lt.meta.savePermission && Lt.meta.saveURL != "") {
      Lt.data.clean();
      this.updateDate();
      var dataJSON = {
        'SaveDate': Lt.data.saveDate,
        'year': Lt.data.year,
        'forwardDirection': Lt.measurementOptions.forwardDirection,
        'subAnnual': Lt.measurementOptions.subAnnual,
        'earlywood': Lt.data.earlywood,
        'index': Lt.data.index,
        'points': Lt.data.points,
        'attributesObjectArray': Lt.annotationAsset.attributesObjectArray,
        'annotations': Lt.aData.annotations,
      };

      // don't serialize our default value
      if (Lt.meta.ppm != 468 || Lt.meta.ppmCalibration) {
        dataJSON.ppm = Lt.meta.ppm;
      }
      $.post(Lt.meta.saveURL, {sidecarContent: JSON.stringify(dataJSON)})
          .done((msg) => {
            this.displayDate();
            Lt.metaDataText.updateText();
          })
          .fail((xhr, status, error) => {
            alert('Error: failed to save changes');
          });
    } else {
      alert('Authentication Error: save to cloud permission not granted');
    };
  };
};

/**
 * Display assets meta data as text
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function MetaDataText (Lt) {
  this.speciesID = Lt.meta.assetName; // empty string defaults to N/A

  MetaDataText.prototype.initialize = function () {
    if (window.name.includes('popout')) {
      var metaDataTopDiv = document.createElement('div');
      metaDataTopDiv.innerHTML =
                '<div><p id="meta-data-top-text" class="meta-data-text-box"></p></div>'
      document.getElementsByClassName('leaflet-bottom leaflet-left')[0].appendChild(metaDataTopDiv);
    };

    var metaDataBottomDiv = document.createElement('div');
    metaDataBottomDiv.innerHTML =
              '<div><p id="meta-data-bottom-text" class="meta-data-text-box"></p></div>'
    document.getElementsByClassName('leaflet-bottom leaflet-left')[0].appendChild(metaDataBottomDiv);
  };

  MetaDataText.prototype.updateText = function () {
      var points = Lt.data.points;

      var i;
      for (i = 0; i < points.length; i++) { // find 1st point w/ year value
        if (points[i] && (points[i].year || points[i].year == 0)) {
          var firstYear = points[i].year;
          break;
        };
      };

      for (i = points.length - 1; i >= 0; i--) { //  find last point w/ year value
        if (points[i] && (points[i].year || points[i].year == 0)) {
          var lastYear = points[i].year;
          break;
        };
      };

      var startYear;
      var endYear;
      if (firstYear <= lastYear) { // for measuring forward in time, smallest year value first in points array
        startYear = firstYear;
        endYear = lastYear;
      } else if (firstYear > lastYear) { // for measuring backward in time, largest year value first in points array
        startYear = lastYear + 1; // last point considered a start point when measuring backwards
        if (Lt.measurementOptions.subAnnual == false) {
          // add 1 to keep points consistent with measuring forwards
          // only applies to measuring bakcwards annually
          endYear = firstYear + 1;
        } else {
          endYear = firstYear;
        }
      };

      this.years = '';
      if ((startYear || startYear == 0) && (endYear || endYear == 0)) {
        this.years = ' &nbsp;|&nbsp; ' + String(startYear) + ' — ' + String(endYear);
      };

      var branding = ' &nbsp;|&nbsp; DendroElevator developed at the <a href="http://z.umn.edu/treerings" target="_blank"> University of Minnesota </a>';

      this.saveText = '';
      if (Lt.meta.savePermission) {
        this.saveText = Lt.saveCloud.saveText;
      };

      if (window.name.includes('popout')) {
        if (Lt.measurementOptions.subAnnual) { // if 2 increments per year
          this.increment = 'sub-annual increments';
        } else { // otherwise 1 increment per year
          this.increment  = 'annual increments';
        };

        if (Lt.measurementOptions.forwardDirection) { // if years counting up
          this.direction = 'Measuring forward, ';
        } else { // otherwise years counting down
          this.direction = 'Measuring backward, '
        };

        document.getElementById("meta-data-top-text").innerHTML = this.direction + this.increment + this.saveText;
      };

      document.getElementById("meta-data-bottom-text").innerHTML = this.speciesID + this.years + branding;
  };
};

/**
 * Load a local copy of the measurement data
 * @constructor
 * @param {Ltreering} Lt - Leaflet treering object
 */
function LoadLocal(Lt) {
  this.btn = new Button(
    'file_upload',
    'Upload .json file with measurements, annotations, etc.',
    () => { this.input() }
  );

  /**
   * Create an input div on the ui and click it
   * @function input
   */
  LoadLocal.prototype.input = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.id = 'file';
    input.style = 'display: none';
    input.addEventListener('change', () => {this.action(input)});
    input.click();
  };

  /**
   * Load the file selected in the input
   * @function action
   */
  LoadLocal.prototype.action = function(inputElement) {
    var files = inputElement.files;
    console.log(files);
    if (files.length <= 0) {
      return false;
    }

    var fr = new FileReader();

    fr.onload = function(e) {
      let newDataJSON = JSON.parse(e.target.result);

      Lt.preferences = {
        'forwardDirection': newDataJSON.forwardDirection,
        'subAnnual': newDataJSON.subAnnual,
      };

      Lt.data = new MeasurementData(newDataJSON, Lt);
      Lt.aData = new AnnotationData(newDataJSON.annotations);

      // if the JSON has PPM data, use that instead of loaded data.
      if(newDataJSON.ppm) {
        Lt.meta.ppm = newDataJSON.ppm;
      }

      Lt.loadData();
    };

    fr.readAsText(files.item(0));
  };

}

function Panhandler(La) {
  var map = La.viewer;
  this.panHandler = L.Handler.extend({
    panAmount: 120,
    panDirection: 0,
    isPanning: false,
    slowMotion: false,

    addHooks: function () {
      L.DomEvent.on(window, 'keydown', this._startPanning, this);
      L.DomEvent.on(window, 'keyup', this._stopPanning, this);
    },

    removeHooks: function () {
      L.DomEvent.off(window, 'keydown', this._startPanning, this);
      L.DomEvent.off(window, 'keyup', this._stopPanning, this);
    },

    _startPanning: function (e) {
      if (e.keyCode == '38') {
        this.panDirection = 'up';
      } else if (e.keyCode == '40') {
        this.panDirection = 'down';
      } else if (e.keyCode == '37') {
        this.panDirection = 'left';
      } else if (e.keyCode == '39') {
        this.panDirection = 'right';
      } else {
        this.panDirection = null;
      }

      if (e.getModifierState("Shift")) {
        this.slowMotion = true;
      }
      else {
        this.slowMotion = false;
      }

      if (this.panDirection) {
        e.preventDefault();
      }

      if (this.panDirection && !this.isPanning) {
        this.isPanning = true;
        requestAnimationFrame(this._doPan.bind(this));
      }
      return false;
    },

    _stopPanning: function (ev) {
      // Treat Gamma angle as horizontal pan (1 degree = 1 pixel) and Beta angle as vertical pan
      this.isPanning = false;

    },

    _doPan: function () {

      var panArray = [];

      var adjustedPanAmount = this.panAmount;
      if(this.slowMotion) {
        adjustedPanAmount = 30;
      }

      switch (this.panDirection) {
        case "up":
          panArray = [0, -1 * adjustedPanAmount];
          break;
        case "down":
          panArray = [0, adjustedPanAmount];
          break;
        case "left":
          panArray = [-1 * adjustedPanAmount, 0];
          break;
        case "right":
          panArray = [adjustedPanAmount, 0];
          break;
      }


      map.panBy(panArray, {
        animate: true,
        delay: 0
      });
      if (this.isPanning) {
        requestAnimationFrame(this._doPan.bind(this));
      }

    }
  });

  La.viewer.addHandler('pan', this.panHandler);
  La.viewer.pan.enable();
}
/**
   * copy text to clipboard
   * @function enable
   */
  function copyToClipboard(allData){
    console.log('copying...', allData);
    const el = document.createElement('textarea');
    el.value = allData;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  /**
   * Download CSV ZIP file
   * @function
   */
  function downloadCSVFiles(Lt,TWoodcsvDataString,EWoodcsvDataString,LWoodcsvDataString)
  {
    var zip = new JSZip();
    if(Lt.measurementOptions.subAnnual)
    {
    zip.file((Lt.meta.assetName + '_LW_csv.csv'), LWoodcsvDataString);
    zip.file((Lt.meta.assetName + '_EW_csv.csv'), EWoodcsvDataString);
    }
    zip.file((Lt.meta.assetName + '_TW_csv.csv'), TWoodcsvDataString)
    zip.generateAsync({type: 'blob'})
          .then((blob) => {
            saveAs(blob, (Lt.meta.assetName + '_csv.zip'));
          });
    }
    function downloadTabFiles(Lt,TWTabDataString,EWTabDataString,LWTabDataString)
  {
    var zip = new JSZip();
    if(Lt.measurementOptions.subAnnual)
    {
    zip.file((Lt.meta.assetName + '_LW_tab.txt'), LWTabDataString);
    zip.file((Lt.meta.assetName + '_EW_tab.txt'), EWTabDataString);
    }
    zip.file((Lt.meta.assetName + '_TW_tab.txt'), TWTabDataString)
    zip.generateAsync({type: 'blob'})
          .then((blob) => {
            saveAs(blob, (Lt.meta.assetName + '_tab.zip'));
          });
        }

/**
 * Opens dialog box with all keyboard shortcuts
 * @function
 */
function KeyboardShortCutDialog (Lt) {
  this.btn = new Button (
    'keyboard',
    'Display keyboard shortcuts',
    () => { this.action() },
  );

  KeyboardShortCutDialog.prototype.action = function () {
    if (this.dialog) {
      this.dialog.close();
    };

    let anchor = this.anchor || [1, 400];

    this.dialog = L.control.dialog ({
      'size': [310, 300],
      'anchor': anchor,
      'initOpen': true
    }).addTo(Lt.viewer);

    // remember annotation location each times its moved
    $(this.dialog._map).on('dialog:moveend', () => { this.anchor = this.dialog.options.anchor } );

    const shortcutGuide = [
      {
       'key': 'Ctrl-l',
       'use': 'Toggle magnification loupe on/off',
      },
      {
       'key': 'Ctrl-m',
       'use': 'Create new measurement path',
      },
      {
       'key': 'Ctrl-k',
       'use': 'Resume last measurement path',
      },
      {
       'key': 'Ctrl-i',
       'use': 'Insert measurement point',
      },
      {
       'key': 'Ctrl-a',
       'use': 'Create new annotation',
      },
      {
       'key': 'Ctrl-s',
       'use': 'Save changes to cloud (if permitted)',
      },
      {
       'key': 'Shift',
       'use': 'Disable cursor panning near edge',
      },
      {
       'key': 'Arrows',
       'use': 'Pan up/down/left/right',
      },
      {
       'key': 'Shift-arrows',
       'use': 'Pan slowly up/down/left/right',
      },
      {
       'key': 'Right click or esc',
       'use': 'Disable current tool',
      },
    ];

    // reset dialog box
    if (document.getElementById('keyboardShortcutDiv') != null) {
      document.getElementById('keyboardShortcutDiv').remove();
      this.dialog.setContent('');
    };

    this.dialog.setContent('<div id="keyboardShortcutDiv"></div>');

    let mainDiv = document.getElementById('keyboardShortcutDiv');

    var title = document.createElement('h4');
    title.innerHTML = 'Keyboard Shortcuts';
    mainDiv.appendChild(title);

    for (shortcut of shortcutGuide) {
      let subDiv = document.createElement('div');

      let key = document.createElement('p');
      key.innerHTML = shortcut.key;
      subDiv.appendChild(key);

      let description = document.createElement('span');
      description.innerHTML = shortcut.use;
      subDiv.appendChild(description);

      mainDiv.appendChild(subDiv);
    };

    this.dialog.hideResize();
    this.dialog.open();

  };
};


/**
 * Hosts all global helper functions
 * @function
 */
function Helper(Lt) {

  /**
   * Reverses points data structure so points ascend in time.
   * @function trueDistance
   * @param {first point.latLng} p1
   * @param {second point.latLng} p2
   */
  Helper.prototype.trueDistance = function(p1, p2) {
    var lastPoint = Lt.viewer.project(p1, Lt.getMaxNativeZoom());
    var newPoint = Lt.viewer.project(p2, Lt.getMaxNativeZoom());
    var length = Math.sqrt(Math.pow(Math.abs(lastPoint.x - newPoint.x), 2) +
        Math.pow(Math.abs(newPoint.y - lastPoint.y), 2));
    var pixelsPerMillimeter = 1;
    Lt.viewer.eachLayer((layer) => {
      if (layer.options.pixelsPerMillimeter > 0 || Lt.meta.ppm > 0) {
        pixelsPerMillimeter = Lt.meta.ppm;
      }
    });
    length = length / pixelsPerMillimeter;
    var retinaFactor = 1;
    return length * retinaFactor;
  };

  /**
   * Reverses points data structure so points ascend in time.
   * @function
   */
 Helper.prototype.reverseData = function(inputPts) {
   var pref = Lt.measurementOptions; // preferences
   if (inputPts) {
     var pts = inputPts;
   } else {
     var pts = JSON.parse(JSON.stringify(Lt.data.points)); // deep copy of points
   };

   var i; // index
   var lastIndex = pts.length - 1;
   var before_lastIndex = pts.length - 2;

   // reformatting done in seperate for-statements for code clarity/simplicity

   for (i = 0; i < pts.length; i++) { // subtract 1 from points cycle
     if (!pref.subAnnual && pts[i] && pts[i].year) { // only need to subtract if annual
       pts[i].year--;
     };
   };

   if (pref.subAnnual) { // subannual earlywood and latewood values swap cycle
     for (i = 0; i < pts.length; i++) {
       if (pts[i]) {
         if (pts[i].earlywood) {
           pts[i].earlywood = false;
         } else {
           pts[i].earlywood = true;
         };
       };
     };
   };

   for (i = 0; i < pts.length; i++) { // swap start & break point cycle
     if (pts[i + 1] && pts[i]) {
       if (pts[i].break && pts[i + 1].start) {
         pts[i].start = true;
         pts[i].break = false;
         pts[i + 1].start = false;
         pts[i + 1].break = true;
       };
     };
   };

   for (i = 0; i < pts.length; i++) { // swap start & end point cycle
     if (pts[i + 2] && pts[i + 1] && pts[i]) {
       if (pts[i].year && pts[i + 1].start && !pts[i + 2].break) { // many conditions so prior cycle is not undone
         pts[i + 1].start = false;
         pts[i + 1].year = pts[i].year;
         pts[i + 1].earlywood = pts[i].earlywood;
         pts[i].start = true;
         delete pts[i].year;
         delete pts[i].earlywood;
       };
     };
   };

   // reverse array order so years ascending
   pts.reverse();

   // change last point from start to end point
   if (pts[lastIndex] && pts[before_lastIndex]) {
     pts[lastIndex].start = false;

     if (pts[before_lastIndex].earlywood) {
       pts[lastIndex].year = pts[before_lastIndex].year;
       pts[lastIndex].earlywood = false;
     } else { // otherwise latewood or annual increment
       pts[lastIndex].year = pts[before_lastIndex].year + 1;
       pts[lastIndex].earlywood = true;
     };
   };

   for (i = lastIndex; i >= 0; i--) { // remove any null points
     if (pts[i] == null) {
       pts.splice(i, 1);
     };
   };

   // change first point to start point
   if (pts.length > 0) {
     pts[0].start = true;
     delete pts[0].year;
     delete pts[0].earlywood;
   };

   return pts;
  };

  /**
   * Finds closest points for connection
   * @function
   * @param {leaflet object} - Lt
   */
  Helper.prototype.closestPointIndex = function (latLng) {
    var ptsData = Lt.data
    var disList = [];

    /**
    * calculate the distance between 2 points
    * @function distanceCalc
    * @param {first point.latLng} pointA
    * @param {second point.latLng} pointB
    */
    function distanceCalc (pointA, pointB) {
      return Math.sqrt(Math.pow((pointB.lng - pointA.lng), 2) +
                       Math.pow((pointB.lat - pointA.lat), 2));
    };

    // finds point with smallest abs. distance
    for (i = 0; i <= ptsData.points.length; i++) {
      var distance = Number.MAX_SAFE_INTEGER;
      if (ptsData.points[i] && ptsData.points[i].latLng) {
         var currentPoint = ptsData.points[i].latLng;
         distance = distanceCalc(currentPoint, latLng);
      disList.push(distance);
      }
    };

    var minDistance = Math.min(...disList);
    i = disList.indexOf(minDistance)

    if (ptsData.points[i] == null) {
      return;
    };

    // catch if points are stacked on top of each other
    var stackedPointsCount = -1; // while loop will always repeat once
    while (!dis_i_to_plus || dis_i_to_plus == 0) {
      // define 4 points: points[i], points[i - 1], points[i + 1], & inserted point
      var pt_i = ptsData.points[i].latLng;

      if (ptsData.points[i - 1]) {
        var pt_i_minus = ptsData.points[i - 1].latLng;
      } else {
        var pt_i_minus = L.latLng(-2 * (pt_i.lat), -2 * (pt_i.lng));
      };

      if (ptsData.points[i + 1]) {
        var pt_i_plus = ptsData.points[i + 1].latLng;
      } else {
        var pt_i_plus = L.latLng(2 * (pt_i.lat), 2 * (pt_i.lng));
      };

      var pt_insert = latLng;

      // distance: point[i] to point[i + 1]
      var dis_i_to_plus = distanceCalc(pt_i, pt_i_plus);
      // distance: point[i} to point[i - 1]
      var dis_i_to_minus = distanceCalc(pt_i, pt_i_minus);
      // distance: point[i] to inserted point
      var dis_i_to_insert= distanceCalc(pt_i, pt_insert);
      // distance: point[i + 1] to inserted point
      var dis_plus_to_insert = distanceCalc(pt_i_plus, pt_insert);
      // distance: point[i - 1] to inserted point
      var dis_minus_to_insert = distanceCalc(pt_i_minus, pt_insert);

      stackedPointsCount++;
      i++;
    };

    i--; // need to subtract due to while loop

    // if denominator = 0, set denominator = ~0
    if (dis_i_to_minus == 0) {
      dis_i_to_minus = Number.MIN_VALUE;
    };
    if (dis_i_to_plus == 0) {
      dis_i_to_plus = Number.MIN_VALUE;
    };
    if (dis_i_to_insert == 0) {
      dis_i_to_insert = Number.MIN_VALUE;
    };

    /* Law of cosines:
       * c = distance between inserted point and points[i + 1] or points[i - 1]
       * b = distance between points[i] and points[i + 1] or points[i - 1]
       * a = distance between inserted points and points[i]
       Purpose is to find angle C for triangles formed:
       * Triangle [i + 1] = points[i], points[i + 1], inserted point
       * Triangle [i - 1] = points[i], points[i - 1], inserted point
       Based off diagram from: https://www2.clarku.edu/faculty/djoyce/trig/formulas.html#:~:text=The%20law%20of%20cosines%20generalizes,cosine%20of%20the%20opposite%20angle.
    */
    // numerator and denominator for calculating angle C using Law of cosines (rearranged original equation)
    var numeratorPlus = (dis_plus_to_insert ** 2) - ((dis_i_to_insert ** 2) + (dis_i_to_plus ** 2));
    var denominatorPlus = -2 * dis_i_to_insert * dis_i_to_plus;
    var numeratorMinus = (dis_minus_to_insert ** 2) - ((dis_i_to_insert ** 2) + (dis_i_to_minus ** 2));
    var denominatorMinus = -2 * dis_i_to_insert * dis_i_to_minus;
    var anglePlus = Math.acos(numeratorPlus/denominatorPlus);
    var angleMinus = Math.acos(numeratorMinus/denominatorMinus);

    // smaller angle determines connecting lines
    if (stackedPointsCount > 0) { // special case for stacked points
      if (anglePlus > angleMinus) {
        i -= stackedPointsCount + 1; // go to first stacked point
      };
    } else if (anglePlus < angleMinus) {
      i++;
    };

    return i;
  }
  /**
   * returns the correct colors for points in a measurement path
   * @function
   * @param {leaflet object} - Lt
   */
   Helper.prototype.assignRowColor = function (e,y,Lt, lengthAsAString)
   {
     var stringContent;
     if (Lt.measurementOptions.subAnnual) {
       var wood;
       var row_color;
       if (e.earlywood) {
         wood = 'E';
         row_color = '#02bfd1';
       } else {
         wood = 'L';
         row_color = '#00838f';
         y++;
       };
       if(e.year%10===0)
       {
         if(wood === 'E')
         {
           row_color='#d17154';
         }
         else{
           row_color= '#db2314';
         }
       }

       stringContent = '<tr style="color:' + row_color + ';">';
       stringContent = stringContent.concat('<td>' + e.year + wood + '</td><td>'+ lengthAsAString + '</td></tr>');
     } else {
       y++;
       row_color = e.year%10===0? 'red':'#00d2e6';
       stringContent = ('<tr style="color:' + row_color +';">' + '<td>' + e.year + '</td><td>'+ lengthAsAString + '</td></tr>');
     }
     return stringContent;
   }
};
