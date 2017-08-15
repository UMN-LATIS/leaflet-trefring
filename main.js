
    var map;
    var src;

    map = L.map('map', {
        fullscreenControl: true,
        zoomSnap: 0,
        crs: L.CRS.Simple,
        drawControl: true,
        layers: [],
        doubleClickZoom: false,
        zoomControl: false
    }).setView([0, 0], 0);

    var image = L.tileLayer.elevator(function(coords, tile, done) {
        var error;
        var params = {Bucket: 'elevator-assets', Key: "testasset5/tiledBase_files/" + coords.z + "/" + coords.x + "_" + coords.y + ".jpeg"};
        tile.onload = (function(done, error, tile) {
            return function() {
                done(error, tile);
            }
        })(done, error, tile);
        //tile.src = "https://s3.amazonaws.com/" + params.Bucket + "/" + params.Key;
        tile.src = params.Key;
        src = tile.src;
        return tile.src;
    },
    {
        width: 231782,
        height: 4042,
        tileSize :254,
        maxZoom: 19 - 1,
        overlap: 1,
        pixelsPerMillimeter: 468, //(NEW)
        lineColor: 'blue'
    });

    image.addTo(map);




    //map scrolling

    var mapSize = map.getSize();    //size of the map used for map scrolling
    var mousePos = 0;               //an initial mouse position

    map.on('mousemove', function(e){
        var oldMousePos = mousePos;      //save the old mouse position
        mousePos = e.containerPoint;    //container point of the mouse
        var mouseLatLng = e.latlng;         //latLng of the mouse
        var mapCenter = map.getCenter();    //center of the map   

        //left bound of the map
        if(mousePos.x <= 40 && mousePos.y > 450 && oldMousePos.x > mousePos.x){
            //map.panTo([mapCenter.lat, (mapCenter.lng - .015)]);     //defines where the map view should move to
            map.panBy([-150, 0]);
        }
        //right bound of the map
        if(mousePos.x + 40 > mapSize.x && mousePos.y > 100 && oldMousePos.x < mousePos.x){
            //map.panTo([mapCenter.lat, (mapCenter.lng + .015)]);
            map.panBy([150, 0]);
        }
        //upper bound of the map
        if(mousePos.x + 40 < mapSize.x && mousePos.y < 40 && oldMousePos.y > mousePos.y){
            //map.panTo([mapCenter.lat, (mapCenter.lng + .015)]);
            map.panBy([0, -40]);
        }
        //lower bound of the map
        if(mousePos.x >= 40 && mousePos.y > mapSize.y - 40 && oldMousePos.y < mousePos.y){
            //map.panTo([mapCenter.lat, (mapCenter.lng - .015)]);     //defines where the map view should move to
            map.panBy([0, 40]);
        }
    })

    //document.getElementById('map').style.cursor = 'default';




    //minimap

    var miniLayer = new L.tileLayer.elevator(function(coords, tile, done) {
        var error;
        var params = {Bucket: 'elevator-assets', Key: "testasset5/tiledBase_files/" + coords.z + "/" + coords.x + "_" + coords.y + ".jpeg"};
        tile.onload = (function(done, error, tile) {
            return function() {
                done(error, tile)
            }
        })(done, error, tile);
        //tile.src = "https://s3.amazonaws.com/" + params.Bucket + "/" + params.Key;
        tile.src = params.Key;
        src = tile.src;
        return tile.src;
    },
    {
        width: 231782,
        height: 4042,
        tileSize: 254,
        maxZoom: 13,
        overlap: 1,
    });

    var miniMap = new L.Control.MiniMap(miniLayer, {
        width: 950,
        height: 50,
        //position: "topright", //in case you would like to change position of the minimap
        toggleDisplay: true,
        zoomAnimation: false,
        zoomLevelOffset: -3,
        zoomLevelFixed: -3
    });

    miniMap.addTo(map);


    //coordinate information in bottom left hand side of map
    var coordinatesDiv = document.createElement("div");
    coordinatesDiv.innerHTML = "<div class='leaflet-control-attribution leaflet-control'><p id='leaflet-coordinates-tag'></p></div>";
    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].appendChild(coordinatesDiv);

    $(map._container).mousemove(function showCoordsAndZoom(e) {
        var coords = map.mouseEventToContainerPoint(e);
        var x = Math.floor(coords.x); //not really x and y coordinates, they're arbitrary and based on rounding the latitude and longitude (because this is mapping software)
        var y = Math.floor(coords.y);
        document.getElementById("leaflet-coordinates-tag").innerHTML = "X: " + x + "   Y: " + y;
    });


    //creating colored icons for points
    dark_green_icon = L.icon({
        iconUrl: 'images/dark_green_icon.png',
        iconSize:     [30, 30] // size of the icon
    });
    dark_red_icon = L.icon({
        iconUrl: 'images/dark_red_icon.png',
        iconSize:     [30, 30] // size of the icon
    });
    black_icon = L.icon({
        iconUrl: 'images/black_icon.png',
        iconSize:     [30, 30] // size of the icon
    });
    blue_grey_light_icon = L.icon({
        iconUrl: 'images/blue_grey_light_icon.png',
        iconSize:     [30, 30] // size of the icon
    });
    blue_grey_dark_icon = L.icon({
        iconUrl: 'images/blue_grey_dark_icon.png',
        iconSize:     [30, 30] // size of the icon
    });
    dark_navy_icon = L.icon({
        iconUrl: 'images/dark_navy_icon.png',
        iconSize:     [30, 30] // size of the icon
    });


    var points = {};    //JSON with all the point data

    var start_point = true;      //whether it's the start point or not
    var year = 0;           //year
    var earlywood = true;   //earlywood or latewood
    var index = 0;      //points index

    var a = 0;          //annotation index
    var cut_point = -1;

    var last_marker_latLng = undefined;

    var marker_list = new Array();  //list of all markers, marker list maps to points JSON (same index)
    var lines = new Array();        //list of all the lines, lines maps to points JSON      
    var annotations = new Array();
    var undoStack = new Array();
    var redoStack = new Array();

    var annotationLayer = L.layerGroup().addTo(map);
    var markerLayer = L.layerGroup().addTo(map);    //map layer for markers
    var mouseLine = L.layerGroup().addTo(map);      //map layer for the mouse H-bar lines
    var lineLayer = L.layerGroup().addTo(map);      //map layer for the lines

    var data_collect = false;   //if data collect button is clicked
    var delete_active = false;  //if delete button is clicked
    var cut_active = false;
    var data_open = false;
    var annotation_delete_active = false;
    var add_data_active = false;
    var add_break_active = false;
    var set_start_year_active = false;
    var set_end_year_active = false;





    function reloadLayers(){
        //erase the markers
        markerLayer.clearLayers();
         //erase the lines
        lineLayer.clearLayers();

        //plot the data back onto the map
        Object.values(points).map(function(e, i){
            if(e.latLng != undefined){
                newLatLng(points, i, e.latLng);
            }
        });
    }

    function undo(){
        if(undoStack.length > 0){
            redoBtn.enable();
            var restore_points = Object.values(points).map(e => e);
            redoStack.push({'year': year, 'earlywood': earlywood, 'index': index, 'points': restore_points});
            dataJSON = undoStack.pop();

            points = {};
            dataJSON.points.map((e, i) => points[i] = e);

            index = dataJSON.index;
            year = dataJSON.year;
            earlywood = dataJSON.earlywood;

            reloadLayers();

            if(undoStack.length == 0){
                undoBtn.disable();
            }
        }
    }

    function createUndoPoint(){
        undoBtn.enable();
        var restore_points = Object.values(points).map(e => e);
        undoStack.push({'year': year, 'earlywood': earlywood, 'index': index, 'points': restore_points });
    }

    function redo(){
        undoBtn.enable();
        restore_points = Object.values(points).map(e => e);
        undoStack.push({'year': year, 'earlywood': earlywood, 'index': index, 'points': restore_points});
        dataJSON = redoStack.pop();

        points = {};
        dataJSON.points.map((e, i) => points[i] = e);

        index = dataJSON.index;
        year = dataJSON.year;
        earlywood = dataJSON.earlywood;

        reloadLayers();

        if(redoStack.length == 0){
            redoBtn.disable();
        }
    }

    //createMouseLineFrom(latLng) will create h-bars from the given latlng to the mouse pointer

    function createMouseLineFrom(latLng){
        $(map._container).mousemove(function lineToMouse(e){
            //only create lines when collecting data
            if(data_collect){
                mouseLine.clearLayers();//continously delete previous lines
                var mousePoint = map.mouseEventToLayerPoint(e);  //get the mouse pointers layer point
                var mouseLatLng = map.mouseEventToLatLng(e);     //get the mouse pointers latlng
                var point = map.latLngToLayerPoint(latLng);      //get the layer point of the given latlng

                //getting the four points for the h bars, this is doing 90 degree rotations on mouse point
                var newX = mousePoint.x + (point.x - mousePoint.x)*Math.cos(Math.PI/2) - (point.y - mousePoint.y)*Math.sin(Math.PI/2);
                var newY = mousePoint.y + (point.x - mousePoint.x)*Math.sin(Math.PI/2) + (point.y - mousePoint.y)*Math.cos(Math.PI/2);
                var topRightPoint = map.layerPointToLatLng([newX, newY]);

                var newX = mousePoint.x + (point.x - mousePoint.x)*Math.cos(Math.PI/2*3) - (point.y - mousePoint.y)*Math.sin(Math.PI/2*3);
                var newY = mousePoint.y + (point.x - mousePoint.x)*Math.sin(Math.PI/2*3) + (point.y - mousePoint.y)*Math.cos(Math.PI/2*3);
                var bottomRightPoint = map.layerPointToLatLng([newX, newY]);

                //doing rotations 90 degree rotations on latlng
                var newX = point.x + (mousePoint.x - point.x)*Math.cos(Math.PI/2) - (mousePoint.y - point.y)*Math.sin(Math.PI/2);
                var newY = point.y + (mousePoint.x - point.x)*Math.sin(Math.PI/2) + (mousePoint.y - point.y)*Math.cos(Math.PI/2);
                var topLeftPoint = map.layerPointToLatLng([newX, newY]);

                var newX = point.x + (mousePoint.x - point.x)*Math.cos(Math.PI/2*3) - (mousePoint.y - point.y)*Math.sin(Math.PI/2*3);
                var newY = point.y + (mousePoint.x - point.x)*Math.sin(Math.PI/2*3) + (mousePoint.y - point.y)*Math.cos(Math.PI/2*3);
                var bottomLeftPoint = map.layerPointToLatLng([newX, newY]);

                //create lines and add them to mouseLine layer
                mouseLine.addLayer(L.polyline([latLng, mouseLatLng], {color: '#37474F'}));
                mouseLine.addLayer(L.polyline([topLeftPoint, bottomLeftPoint], {color: '#37474F'}));
                mouseLine.addLayer(L.polyline([topRightPoint, bottomRightPoint], {color: '#37474F'}));
            }
        });
    }

    //deleting a data point from the json
    function deleteDataPoint(i){
        createUndoPoint();

        if(points[i].start || points[i].break){
            second_points = Object.values(points).splice(i+1, index-1);
            second_points.map(function(e){
                points[i] = e;
                i++;
            });
            index = index - 1;
            delete points[index];
        }
        else if(points[i].skip){
            second_points = Object.values(points).splice(i+1, index-1);
            second_points.map(function(e){
                e.year--;
                points[i] = e;
                i++
            });
            index = index - 1;
            delete points[index];
        }
        else{
            if(points[i].earlywood && points[i+1].earlywood != undefined){
                j = i+1;
            }
            else if(points[i-1].earlywood != undefined){
                j = i;
                i--;
            }
            //get the second half of the data
            second_points = Object.values(points).splice(j+1, index-1);
            second_points.map(function(e){
                e.year--;
                points[i] = e;
                i++;
            })
            index = i-1;
            delete points[i];
            delete points[i+1];
        }

        console.log(points);

        console.log(markerLayer);
        reloadLayers();
        

        deleteDisable();
    }

    function cutDataPoints(i, j){
        createUndoPoint();

        if(i > j){
            trimmed_points = Object.values(points).splice(i, index-1);
            var k = 0;
            points = {};
            trimmed_points.map(function(e){
                if(!k){
                    points[k] = {"start": true,"latLng": e.latLng, "measurable": false};
                }   
                else{    
                    points[k] = e;
                }
                k++;
            })
            index = k;
        }
        else if(i < j){
            points = Object.values(points).splice(0, i);
            index = i;
        }
        else{
            alert("cannot select dame point");
        }

        console.log(points);

        reloadLayers();

        cutDisable();
    }

    function addDataPoint(i){
        var new_points = points
        var second_points = Object.values(points).splice(i+1, index-1);
        var first_point = true;
        var k = i+1;
        var year_adjusted = points[i+1].year

        $(map._container).click(function(e){
            var latLng = map.mouseEventToLatLng(e);
            map.dragging.disable();

            data_collect = true;
            createMouseLineFrom(latLng);

            if(first_point){
                new_points[k] = {'start': false, 'skip': false, 'break': false, 'year': year_adjusted, 'earlywood': true, 'latLng':latLng};
                newLatLng(new_points, k, latLng);
                k++;
                first_point = false;
            }
            else{
                new_points[k] = {'start': false, 'skip': false, 'break': false, 'year': year_adjusted, 'earlywood': false, 'latLng':latLng};
                year_adjusted++;
                newLatLng(new_points, k, latLng);
                k++;
                second_points.map(function(e){
                    e.year++;
                    new_points[k] = e;
                    k++;
                })
                $(map._container).off('click');

                createUndoPoint();

                points = new_points;
                index = k;
                year++;

                reloadLayers();
                addDataDisable();
            }
        });
    }

    function addSkipPoint(i){
        createUndoPoint();

        var second_points = Object.values(points).splice(i+1, index-1);
        points[i+1] = {'start': false, 'skip': true, 'break': false, 'year': points[i].year+1};
        k=i+2;
        second_points.map(function(e){
            e.year++
            points[k] = e;
            k++;
        })
        $(map._container).off('click');
        index = k;
        year++;

        reloadLayers();
        addSkipDisable();
    }

    function addBreakPoint(i){
        var new_points = points
        var second_points = Object.values(points).splice(i+1, index-1);
        var first_point = true;
        var k = i+1;

        $(map._container).click(function(e){
            var latLng = map.mouseEventToLatLng(e);
            map.dragging.disable();

            data_collect = true;
            createMouseLineFrom(latLng);

            if(first_point){
                new_points[k] = {'start': false, 'skip': false, 'break': true, 'latLng':latLng};
                newLatLng(new_points, k, latLng);
                k++;
                first_point = false;
            }
            else{
                new_points[k] = {'start': true, 'skip': false, 'break': false, 'latLng':latLng};
                newLatLng(new_points, k, latLng);
                k++;
                second_points.map(function(e){
                    new_points[k] = e;
                    k++;
                })
                $(map._container).off('click');

                createUndoPoint();

                points = new_points;
                index = k;

                reloadLayers();
                addBreakDisable();
            }
        });
    }

    var setStartYearDialog = L.control.dialog({'size': [270, 65], 'anchor': [80, 50], 'initOpen': false})
        .setContent('Year: <input type="number" size="4" maxlength="4" id="year_input"/>' +
                    '<button id="year_submit">enter</button>')
        .addTo(map);

    setStartYearDialog.lock();

    function setYear(i){    
        if(points[i].start){
            setStartYearDialog.open();           

            document.getElementById('year_submit').addEventListener('click', function(){
                new_year = document.getElementById('year_input').value;
                setStartYearDialog.close();

                createUndoPoint();

                i++
                
                while(points[i] != undefined){
                    if(points[i].start || points[i].break){
                    }
                    else if(points[i].earlywood){
                        points[i].year = new_year;
                    }
                    else{
                        points[i].year = new_year++;
                    }
                    i++;
                }
                reloadLayers();
                setStartYearDisable();
            }, false);
        }   
    }


    var setEndYearDialog = L.control.dialog({'size': [270, 65], 'anchor': [80, 50], 'initOpen': false})
        .setContent('Year: <input type="number" size="4" maxlength="4" id="end_year_input"/>' +
                    '<button id="end_year_submit">enter</button>')
        .addTo(map);

    setEndYearDialog.lock();

    function setEndYear(i){    
        if(!(points[i+1] != undefined) || points[i+1].break || points[i+1].start){
            setEndYearDialog.open();           

            document.getElementById('end_year_submit').addEventListener('click', function(){
                new_year = document.getElementById('end_year_input').value;
                setEndYearDialog.close();

                createUndoPoint();
                
                if(i == index){
                    year = new_year;
                }

                while(points[i] != undefined){
                    if(points[i].start || points[i].break){
                    }
                    else if(points[i].earlywood){
                        points[i].year = new_year--;
                    }
                    else{
                        points[i].year = new_year;
                    }
                    i--;
                }
                reloadLayers();
                setStartYearDisable();
            }, false);
        }   
    }

    //newLatLng(i, latlng) takes the index for the points object and a latlng that should be added to the map with a marker
    //this function is also used when a json file is loaded by the user

    function newLatLng(p, i, latLng){
        leafLatLng = L.latLng(latLng);   //leaflet is stupid and only uses latlngs that are created through L.latlng

        //check if index is the start point
        if(p[i].start){
            var marker = L.marker(leafLatLng, {icon: dark_navy_icon, draggable: true, title: "Start Point"});
        }
        //check if point is earlywood
        else if(p[i].break){
            var marker = L.marker(leafLatLng, {icon: dark_navy_icon, draggable: true, title: "Break Point"})
        }
        else if(p[i].earlywood){
            var marker = L.marker(leafLatLng, {icon: dark_green_icon, draggable: true, title: "Year " + p[i].year + ", earlywood"});         
        }
        //otherwise it's latewood
        else{
            var marker = L.marker(leafLatLng, {icon: dark_red_icon, draggable: true, title: "Year " + p[i].year + ", latewood"});
        }

        if(p[i-1] != undefined && p[i-1].skip){
            if(i-1){
                average = L.latLng([(leafLatLng.lat + last_marker_latLng.lat)/2, (leafLatLng.lng + last_marker_latLng.lng)/2]);
            }
            else{
                average = L.latLng([leafLatLng.lat, (leafLatLng.lng - .001)]);
            }
            skip_marker = L.marker(average, {icon: blue_grey_light_icon, draggable: true, title: "Year " + p[i-1].year + ", None"});
            skip_marker.on('click', function(e){
                if(delete_active){
                    deleteDataPoint(i-1);
                }
            });
            
            marker_list[i-1] = skip_marker;
            markerLayer.addLayer(marker_list[i-1]);    
        }

        marker_list[i] = marker;     //add created marker to marker_list

        //tell marker what to do when being draged
        marker_list[i].on('dragend', function(e){
            p[i].latLng = e.target._latlng;     //get the new latlng of the mouse pointer
            console.log(p);

            //adjusting the line from the previous and preceeding point if they exist
            if(p[i-1] != undefined && p[i-1].latLng != undefined && !p[i].start){
                lineLayer.removeLayer(lines[i]);
                lines[i] = L.polyline([p[i-1].latLng, e.target._latlng], {color: '#37474F'});
                lineLayer.addLayer(lines[i]);
            }
            if(p[i+1] != undefined && p[i+1].latLng != undefined && lines[i+1] != undefined){
                lineLayer.removeLayer(lines[i+1]);
                lines[i+1] = L.polyline([e.target._latlng, p[i+1].latLng], {color: '#37474F'});
                lineLayer.addLayer(lines[i+1]);
            }
        });

        marker_list[i].on('click', function(e){
            if(delete_active){
                deleteDataPoint(i);
            }
            if(cut_active){
                if(cut_point != -1){
                    cutDataPoints(cut_point, i);
                }
                else{
                    cut_point = i;
                }
            }
            if(add_data_active){
                if(p[i].earlywood){
                    alert("must select latewood or start point")
                }
                else{
                    addDataPoint(i);
                }
            }
            if(add_skip_active){
                addSkipPoint(i);
            }
            if(add_break_active){
                addBreakPoint(i);
            }
            if(set_start_year_active){
                setYear(i);
            }
            if(set_end_year_active){
                setEndYear(i);
            }
        })

        //drawing the line if the previous point exists
        if(p[i-1] != undefined && !p[i-1].skip && !p[i].start){
            lines[i] = L.polyline([p[i-1].latLng, leafLatLng], {color: '#37474F'});
            lineLayer.addLayer(lines[i]);
        }

        last_marker_latLng = leafLatLng;
        markerLayer.addLayer(marker_list[i]);    //add the marker to the marker layer
    }

    //easybutton function to add gap years in the data
    function skipYear(){
        createUndoPoint();

        points[index] = {'start': false, 'skip': true, 'break': false, 'year':year}; //no point or latlng
        year++;
        index++;
    }

    //easybutton function for undoing the last created marker
    function deleteLast(){
        //check if anything exists
        if(index){
            //check index-1 because current index is still empty
            //if point exists we need to remove the point and marker
            if(points[index-1].latLng != undefined){
                markerLayer.removeLayer(marker_list[index-1]); //remove marker
                //figure out if the year is early or late and adjust accordingly
                if(!points[index-1].start){
                    if(!points[index-1].earlywood){
                        year--;
                    }
                    earlywood = !earlywood;
                    lineLayer.removeLayer(lines[index-1]);
                }
            }
            //if there's no point we just decrement the year
            else{
                year--;
            }
            //if the undo is fired while data is collected the mouse line needs to be adjusted
            if(data_collect){
                createMouseLineFrom(points[index-2].latLng);
            }
            delete points[index-1];    //erase data in points
            index--;
            console.log(points);
        }
    }

    function breakEnable(){
        breakBtn.state('active');

        data_collect = true;
            
        $(map._container).click(function(e){
            var latLng = map.mouseEventToLatLng(e);

            createMouseLineFrom(latLng)

            createUndoPoint();

            map.dragging.disable();
            points[index] = {'start': false, 'skip': false, 'break': true, 'latLng':latLng};
            newLatLng(points, index, latLng);
            first_point = false;
            index++;
            breakDisable();
            collectEnable();
        });
    }

    function breakDisable(){
        $(map._container).off('click');
        breakBtn.state('inactive');
        map.dragging.enable();
    }

    //easybutton function to being data collection, btn a multi-state button object
    function collectEnable(){
        collectBtn.state('active');    //change the state of the 

        //map.dragging.disable();  //leaflet doesn't differentiate between a click and a drag

        document.getElementById('map').style.cursor = "pointer";

        $(map._container).click(function startLine(e){
            var latLng = map.mouseEventToLatLng(e);

            createUndoPoint();

            if(start_point){
                points[index] = {'start': true, 'skip': false, 'break': false, 'latLng':latLng};
                start_point = false;
            }
            else{
                points[index] = {'start': false, 'skip': false, 'break': false, 'year':year, 'earlywood': earlywood, 'latLng':latLng};
            }

            newLatLng(points, index, latLng); //call newLatLng with current index and new latlng 

            createMouseLineFrom(latLng); //create the next mouseline from the new latlng

            //avoid incrementing earlywood for start point
            if(!points[index].start){
                if(earlywood){
                    earlywood = false;
                }
                else{
                    earlywood = true;
                    year++;
                }
            }

            index++;
            data_collect = true;     //don't remember why but we need to activate data_collect after one point is made
        });
    }

    //easybutton that ends data collection
    function collectDisable(){
        $(map._container).off('click');  //turn off the mouse clicks from previous function
        collectBtn.state('inactive');  //switch the button state back to off
        data_collect = false;   //turn data_collect off
        map.dragging.enable();  //turn map dragging back on
        mouseLine.clearLayers(); //clear the mouseline
        //document.getElementById('map').style.cursor = 'default';

        start_point = true;
    }


    function shiftYear(x){
        createUndoPoint();
        for(i = 0; i < index; i++){
            if(!points[i].start){
                points[i].year += x;
            }
        }
        reloadLayers();
    }

    function deleteAnnotation(i){
        if(annotation_delete_active){
            console.log(i);
            annotationLayer.removeLayer(annotations[i]);
            annotations[i] = undefined;
            deleteAnnotationBtn.state('inactive');
            $(map._container).off('click');
            annotation_delete_active = false;
        }
    }

    function newDateMarker(i){
        annotations.push(L.circle(latLng, {radius: .0002, color: "#00BCD4"}));
        annotations[i].on('click', function(e){
            deleteAnnotation(i);
        })
        annotationLayer.addLayer(annotations[i]);
        dateMarkerDisable();
    }

    function dateMarkerEnable(){
        dateMarkerBtn.state('active');
        $(map._container).click(function(e){
            latLng = map.mouseEventToLatLng(e);

            newDateMarker(a);
            a++;
        });
    }

    function dateMarkerDisable(){
        dateMarkerBtn.state('inactive');
        $(map._container).off('click');
    }

    var dataDialog = L.control.dialog({'size': [240, 350], 'anchor': [5, 50], 'initOpen': false})
            .setContent('<h3>There are no data points to measure</h3>')
            .addTo(map);

    function loadData(){
        if(points[0] != undefined){
            var y = points[1].year;
            string = "<table><tr><th style='width: 40%;'>Year</th><th style='width: 70%;'>Length</th></tr>";
            Object.values(points).map(function(e, i, a){
                if(e.start){
                    last_point = e;
                }
                else if(e.break){
                    break_length = Math.round(map.distance(last_point.latLng, e.latLng)*1000000)/1000;
                    last_point = e;
                }
                else{
                    while(e.year > y){
                        string = string.concat("<tr><td>" + y + "-</td><td>N/A</td></tr>");
                        y++;
                    }
                    if(e.skip){
                        string = string.concat("<tr><td>"+ e.year + "-</td><td>0 mm</td></tr>");
                    }
                    else{
                        length = Math.round(map.distance(last_point.latLng, e.latLng)*1000000)/1000;
                        if(last_point.break){
                            length += break_length;
                        }
                        if(length == 9.999){
                            length = 9.998;
                        }
                        if(e.earlywood){
                            wood = "e";
                            row_color = "green";
                        }
                        else{
                            wood = "l";
                            row_color = "red";
                            y++;
                        }
                        last_point = e;
                        string = string.concat("<tr style='color:" + row_color + ";'>");
                        string = string.concat("<td>"+ e.year + wood + "</td><td>" + length + " mm</td></tr>");
                    }
                }
            });
            dataDialog.setContent(string + "</table>");
        }
        dataDialog.open();
    }


    function setStartYearEnable(){
        setStartYearBtn.state('active');
        set_start_year_active = true;
    }

    function setStartYearDisable(){
        setStartYearBtn.state('inactive');
        set_start_year_active = false;
        setStartYearDialog.close();
    }

    function setEndYearEnable(){
        setEndYearBtn.state('active');
        set_end_year_active = true;
    }

    function setEndYearDisable(){
        setEndYearBtn.state('inactive');
        set_end_year_active = false;
        setEndYearDialog.close();
    }

    function addDataEnable(){
        addDataBtn.state('active');
        add_data_active = true;
    }

    function addDataDisable(){
        $(map._container).off('click');
        addDataBtn.state('inactive');
        add_data_active = false;
        map.dragging.enable();
        mouseLine.clearLayers();
        data_collect = false;
    }

    function addSkipEnable(){
        addSkipBtn.state('active');
        add_skip_active = true;
    }

    function addSkipDisable(){
        $(map._container).off('click');
        addSkipBtn.state('inactive');
        add_skip_active = false;
        map.dragging.enable();
        mouseLine.clearLayers();
        data_collect = false;
    }

    function addBreakEnable(){
        addBreakBtn.state('active');
        add_break_active = true;
    }

    function addBreakDisable(){
        $(map._container).off('click');
        addBreakBtn.state('inactive');
        add_breal_active = false;
        map.dragging.enable();
        mouseLine.clearLayers();
        data_collect = false;
    }

    //easybutton function to delete any point in the data
    function deleteEnable(){
        deleteBtn.state('active');
        delete_active = true;
    }

    function deleteDisable(){
        $(map._container).off('click');
        deleteBtn.state('inactive');
        delete_active = false;
    }

    function cutEnable(){
        cutBtn.state('active');
        cut_active = true;
        cut_point = -1;
    }

    function cutDisable(){
        $(map._container).off('click');
        cutBtn.state('inactive');
        cut_active = false;
        cut_point = -1;
    }

    function deleteAnnotationEnable(){
        dateMarkerBtn.state('inactive');
        $(map._container).off('click');
        deleteAnnotationBtn.state('active');
        annotation_delete_active = true;
    }

    function deleteAnnotationDisable(){
        $(map._container).off('click');
        deleteAnnotationBtn.state('inactive');
        annotation_delete_active = false;
    }



    //easyButton collapse toolbar functions

    function collapseTimescaleBar(){
        timescaleBtn.state('collapse');
        setStartYearBtn.disable();
        setEndYearBtn.disable();
        shiftForwardBtn.disable();
        shiftBackwardBtn.disable();

        setStartYearDisable();
        setEndYearDisable();
    }

    function collapseMeasureBar(){
        measureBtn.state('collapse');
        collectBtn.disable();
        skipBtn.disable();
        deleteLastBtn.disable();
        breakBtn.disable();

        collectDisable();
    }

    function collapseEditBar(){
        editBtn.state('collapse');
        deleteBtn.disable();
        cutBtn.disable();
        addDataBtn.disable();
        addSkipBtn.disable();
        addBreakBtn.disable();

        deleteDisable();
        cutDisable();
        addDataDisable();
        addSkipDisable();
        addBreakDisable();
    }

    function collapseAnnotationBar(){
        annotationBtn.state('collapse');
        dateMarkerBtn.disable();
        deleteAnnotationBtn.disable();

        dateMarkerDisable();
        deleteAnnotationDisable();
    }



    //easybuttons

    var timescaleBtn= L.easyButton ({
        states: [
        {
            stateName:  'collapse',
            icon:       '<i class="material-icons md-18">access_time</i>',
            title:      'Set and adjust timeline',
            onClick:    function(btn, map){
                collapseAnnotationBar();
                collapseEditBar();
                collapseMeasureBar();

                btn.state('expand');
                setStartYearBtn.enable();
                setEndYearBtn.enable();
                shiftForwardBtn.enable();
                shiftBackwardBtn.enable();
            }
        },
        {
            stateName:  'expand',
            icon:       '<i class="material-icons md-18">expand_less</i>',
            title:      'Collapse',
            onClick:    function(btn, map){
                collapseTimescaleBar();
            }
        }]
    });

    var setStartYearBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">arrow_forward</i>',
            title:      'Set the start year at any start point',
            onClick:    function(btn, map){
                setEndYearDisable();
                setStartYearEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                setStartYearDisable();
            }
        }]
    })

    var setEndYearBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">arrow_back</i>',
            title:      'Set the end year at any start point',
            onClick:    function(btn, map){
                setStartYearDisable();
                setEndYearEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                setEndYearDisable();
            }
        }]
    })

    var shiftForwardBtn = L.easyButton ({
        states: [
        {
            stateName:  'year-forward',
            icon:       '<i class="material-icons md-18">exposure_plus_1</i>',
            title:      'Shift series forward',
            onClick:    function(btn, map){
                setStartYearDisable();
                shiftYear(1);
            }
        }]
    });

    var shiftBackwardBtn = L.easyButton ({
        states: [
        {
            stateName:  'year-backward',
            icon:       '<i class="material-icons md-18">exposure_neg_1</i>',
            title:      'Shift series backward',
            onClick:    function(btn, map){
                setStartYearDisable();
                shiftYear(-1);
            }
        }]
    });

    var measureBtn = L.easyButton ({
        states: [
        {
            stateName:  'collapse',
            icon:       '<i class="material-icons md-18">timeline</i>',
            title:      'Create new data points',
            onClick:    function(btn, map){
                collapseEditBar();
                collapseAnnotationBar();
                collapseTimescaleBar();

                btn.state('expand');
                collectBtn.enable();
                skipBtn.enable();
                deleteLastBtn.enable();
                breakBtn.enable();
            }
        },
        {
            stateName:  'expand',
            icon:       '<i class="material-icons md-18">expand_less</i>',
            title:      'Collapse',
            onClick:    function(btn, map){
                collapseMeasureBar();
            }
        }]
    });

    var collectBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">add_circle_outline</i>',
            title:      'Begin data collection (Alt+C)',
            onClick:    function(btn, map){
                collectEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">add_circle</i>',
            title:      'End data collection (Alt+C)',
            onClick:    function(btn, map){
                collectDisable();
            }
        }]
    });

    var skipBtn = L.easyButton ({
        states: [
        {
            stateName:  'skip-year',
            icon:       '<i class="material-icons md-18">update</i>',
            title:      'Add a zero growth year (Alt+S)',
            onClick:    function(btn, map){
                skipYear();
            }
        }]
    });

    var breakBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">broken_image</i>',
            title:      'Create a break',
            onClick:    function(btn, map){
                collectDisable();
                breakEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                breakDisable();
            }
        }]
    })

    var deleteLastBtn = L.easyButton ({
        states: [
        {
            stateName:  'delete-last',
            icon:       '<i class="material-icons md-18">replay</i>',
            title:      'Delete Last Marker (Alt+Z)',
            onClick:    function(btn, map){
                deleteLast();
            }
        }]
    });

    var editBtn = L.easyButton ({
        states: [
        {
            stateName:  'collapse',
            icon:       '<i class="material-icons md-18">edit</i>',
            title:      'Edit and delete data points from the series',
            onClick:    function(btn, map){
                collapseAnnotationBar();
                collapseMeasureBar();
                collapseTimescaleBar();

                btn.state('expand');
                deleteBtn.enable();
                cutBtn.enable();
                addDataBtn.enable();
                addSkipBtn.enable();
                addBreakBtn.enable();
            }
        },
        {
            stateName:  'expand',
            icon:       '<i class="material-icons md-18">expand_less</i>',
            title:      'Collapse',
            onClick:    function(btn, map){
                collapseEditBar();
            }
        }]
    });

    var deleteBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">delete</i>',
            title:      'Enable Delete (Alt+D)',
            onClick: function(btn, map){
                cutDisable();
                addDataDisable();
                addSkipDisable();
                addBreakDisable();
                deleteEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Disable Delete (Alt+D)',
            onClick:    function(btn, map){
                deleteDisable()
            }
        }]
    });

    var cutBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">content_cut</i>',
            title:      'Cut a portion of the series',
            onClick:    function(btn, map){
                deleteDisable();
                addDataDisable();
                addSkipDisable();
                addBreakDisable();
                cutEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel cutting',
            onClick:    function(btn, map){
                cutDisable()
            }
        }]
    });

    var addDataBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">add_circle_outline</i>',
            title:      'Add a point in the middle of the series',
            onClick:    function(btn, map){
                deleteDisable();
                cutDisable();
                addSkipDisable();
                addBreakDisable();
                addDataEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                addDataDisable();
            }
        }]
    })

    var addSkipBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">update</i>',
            title:      'Add a zero growth year in the middle of the series',
            onClick:    function(btn, map){
                deleteDisable();
                cutDisable();
                addDataDisable();
                addBreakDisable();
                addSkipEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                addSkipDisable();
            }
        }]
    })

    var addBreakBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">broken_image</i>',
            title:      'Add a break in the series',
            onClick:    function(btn, map){
                deleteDisable();
                cutDisable();
                addDataDisable();
                addSkipDisable();
                addBreakEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            onClick:    function(btn, map){
                addBreakDisable();
            }
        }]
    })

    var annotationBtn = L.easyButton ({
        states: [
        {
            stateName:  'collapse',
            icon:       '<i class="material-icons md-18">message</i>',
            title:      'Create annotations',
            onClick:    function(btn, map){
                btn.state('expand');
                dateMarkerBtn.enable();
                deleteAnnotationBtn.enable();

                collapseEditBar();
                collapseMeasureBar();
                collapseTimescaleBar();
            }
        },
        {
            stateName:  'expand',
            icon:       '<i class="material-icons md-18">expand_less</i>',
            title:      'Collapse',
            onClick:    function(btn, map){
                collapseAnnotationBar();
            }
        }]
    });

    var dateMarkerBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">fiber_manual_record</i>',
            title:      'Create a circle marker',
            onClick:    function(btn, map){
                deleteAnnotationDisable();
                dateMarkerEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                dateMarkerDisable();
            }
        }]
    });
    
    var deleteAnnotationBtn = L.easyButton ({
        states: [
        {
            stateName:  'inactive',
            icon:       '<i class="material-icons md-18">delete</i>',
            title:      'Delete an annotation',
            onClick:    function(btn, map){
                dateMarkerDisable();
                deleteAnnotationEnable();
            }
        },
        {
            stateName:  'active',
            icon:       '<i class="material-icons md-18">clear</i>',
            title:      'Cancel',
            onClick:    function(btn, map){
                deleteAnnotationDisable();
            }
        }]
    });

    var dataBtn = L.easyButton ({
        states: [
        {
            stateName:  'closed',
            icon:       '<i class="material-icons md-18">straighten</i>',
            title:      'Open Data',
            onClick:    function(btn, map){
                loadData();
            }  
        }]
    });

    var undoBtn = L.easyButton ({
        states: [
        {
            stateName:  'undo',
            icon:       '<i class="material-icons md-18">undo</i>',
            title:      'Undo',
            onClick:    function(btn, map){
                undo();
            }
        }]
    });

    var redoBtn = L.easyButton ({
        states: [
        {
            stateName:  'redo',
            icon:       '<i class="material-icons md-18">redo</i>',
            title:      'Redo',
            onClick:    function(btn, map){
                redo();
            }
        }]
    });




    //group the buttons into a toolbar
    var undoRedoBar = L.easyBar([undoBtn, redoBtn]);
    undoRedoBar.addTo(map);
    undoBtn.disable();
    redoBtn.disable();

    var timeBar = L.easyBar([timescaleBtn, setStartYearBtn, setEndYearBtn, shiftForwardBtn, shiftBackwardBtn]);
    timeBar.addTo(map);
    setStartYearBtn.disable();
    setEndYearBtn.disable();
    shiftForwardBtn.disable();
    shiftBackwardBtn.disable();

    var measurementBar = L.easyBar([measureBtn, collectBtn, skipBtn, breakBtn, deleteLastBtn]);
    measurementBar.addTo(map);
    collectBtn.disable();
    skipBtn.disable();
    deleteLastBtn.disable();
    breakBtn.disable();

    var editBar = L.easyBar([editBtn, deleteBtn, cutBtn, addDataBtn, addSkipBtn, addBreakBtn]);
    editBar.addTo(map);
    deleteBtn.disable();
    cutBtn.disable();
    addDataBtn.disable();
    addSkipBtn.disable();
    addBreakBtn.disable();

    var annotationBar = L.easyBar([annotationBtn, dateMarkerBtn, deleteAnnotationBtn]);
    annotationBar.addTo(map);
    dateMarkerBtn.disable();
    deleteAnnotationBtn.disable();

    dataBtn.addTo(map);


    //creating the layer controls
    var baseLayer = {
        "Tree Ring": image
    };

    var overlay = {
        "Points": markerLayer,
        "H-bar": mouseLine,
        "Lines": lineLayer
    };

    L.control.layers(baseLayer, overlay).addTo(map);    //adding layer controls to the map




    //doc_keyUp(e) takes a keyboard event, for keyboard shortcuts
    function doc_keyUp(e) {
        //ALT + S
        if(e.altKey && (e.keyCode == 83 || e.keycode == 115)){
            skipYear();
        }
        //ALT + Z
        if(e.altKey && (e.keyCode == 90 || e.keycode == 122)){
            deleteLast();
        }
        //ALT + C
        if(e.altKey && (e.keyCode == 67 || e.keycode == 99)){
            if(collectBtn._currentState.stateName == 'inactive'){
                collectEnable();
            }
            else{
                collectDisable();
            }
        }
    }
    //add event listner for keyboard
    document.addEventListener('keyup', doc_keyUp, false);




    function toSixCharString(n){
        var string = n.toString();

        if(string.length == 1){
            string = "     " + string;
        }
        else if(string.length == 2){
            string = "    " + string;
        }
        else if(string.length == 3){
            string = "   " + string;
        }
        else if(string.length == 4){
            string = "  " + string;
        }
        else if(string.length == 5){
            string = " " + string;
        }
        else if(string.length >= 6){
            alert("Value exceeds 5 characters");
            throw "Error 10";
        }
        else{
            alert("toSixCharString(n) unknown error");
            throw "error";
        }
        return string;
    }


    $("#download").click(function(event){
        sum_string = "";
        ew_string = "";
        lw_string = "";
        if(points != undefined){
            y = points[1].year;
            sum_points = Object.values(points).filter(function(e){
                if(e.earlywood != undefined){
                    return !(e.earlywood);
                }
                else{
                    return true;
                }
            });

            if(sum_points[1].year%10 > 0){
                sum_string = sum_string.concat(toSixCharString(sum_points[1].year));
            }
            sum_points.map(function(e, i, a){
                if(!e.start){
                    if(e.year%10 == 0){
                        sum_string = sum_string.concat("\r\n" + toSixCharString(e.year));
                    }
                    while(e.year > y){
                        sum_string = sum_string.concat("    -1");
                        y++;
                        if(y%10 == 0){
                            sum_string = sum_string.concat("\r\n" + toSixCharString(e.year));
                        }
                    }
                    if(e.skip){
                        sum_string = sum_string.concat("     0");
                        y++;
                    }
                    else{
                        length = Math.round(map.distance(last_latLng, e.latLng)*1000000)
                        if(length == 9999){
                            length = 9998;
                        }
                        if(length == 999){
                            length = 998;
                        }

                        length_string = toSixCharString(length); 

                        sum_string = sum_string.concat(length_string);
                        last_latLng = e.latLng;
                        y++;
                    }
                }
                else{
                    last_latLng = e.latLng;
                }
            });
            sum_string = sum_string.concat(" -9999");

            y = points[1].year;

            if(points[1].year%10 > 0){
                ew_string = ew_string.concat(toSixCharString(points[1].year));
                lw_string = lw_string.concat(toSixCharString(points[1].year));
            }

            Object.values(points).map(function(e, i, a){
                if(!e.start){
                    if(e.year%10 == 0){
                        if(e.skip){
                            ew_string = ew_string.concat("\r\n" + toSixCharString(e.year));
                            lw_string = lw_string.concat("\r\n" + toSixCharString(e.year));
                        }
                        else if(e.earlywood){
                            ew_string = ew_string.concat("\r\n" + toSixCharString(e.year));
                        }
                        else{
                            lw_string = lw_string.concat("\r\n" + toSixCharString(e.year));
                        }
                    }
                    while(e.year > y){
                        console.log(e.year);
                        console.log(y);
                        ew_string = ew_string.concat("    -1");
                        lw_string = lw_string.concat("    -1");
                        y++;
                        if(y%10 == 0){
                            ew_string = ew_string.concat("\r\n" + toSixCharString(e.year));
                            lw_string = lw_string.concat("\r\n" + toSixCharString(e.year));
                        }
                    }
                    if(e.skip){
                        if(e.earlywood){
                            ew_string = ew_string.concat("     0");
                        }
                        else{
                            lw_string = lw_string.concat("     0");
                            y++;
                        }
                    }
                    else{
                        length = Math.round(map.distance(last_latLng, e.latLng)*1000000)
                        if(length == 9999){
                            length = 9998;
                        }
                        if(length == 999){
                            length = 998;
                        }

                        length_string = toSixCharString(length); 

                        if(e.earlywood){
                            ew_string = ew_string.concat(length_string);
                            last_latLng = e.latLng;
                        }
                        else{
                            lw_string = lw_string.concat(length_string);
                            last_latLng = e.latLng;
                            y++;
                        }
                    }
                }
                else{
                    last_latLng = e.latLng;
                }
            });
            ew_string = ew_string.concat(" -9999");
            lw_string = lw_string.concat(" -9999");
        }
        console.log(sum_string);
        console.log(ew_string);
        console.log(lw_string);

        var zip = new JSZip();
        zip.file('sample.raw', sum_string);
        zip.file('sample.lwr', lw_string);
        zip.file('sample.ewr', ew_string);

        zip.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, "sample.zip");
        });

        
        //this.href = 'data:plain/text,' + sum_string;
    });


    //saving the data as a JSON
    $( "#save" ).click(function( event ) {
        //create anoter JSON and store the current counters for year, earlywood, and index, along with points data
        dataJSON = {'year': year, 'earlywood': earlywood, 'index': index, 'points': points };
        this.href = 'data:plain/text,' + JSON.stringify(dataJSON);
    });

    //importing data fromt he user
    function loadFile(){
        var files = document.getElementById('file').files;
        console.log(files);
        if (files.length <= 0) {
            return false;
        }
      
        var fr = new FileReader();
      
        fr.onload = function(e) { 
            console.log(e);
            newDataJSON = JSON.parse(e.target.result);

            //assign the data to our current session
            points = newDataJSON.points;
            index = newDataJSON.index;
            year = newDataJSON.year;
            earlywood = newDataJSON.earlywood;

            console.log(points);

            reloadLayers();
        }

        fr.readAsText(files.item(0));
    }