
    var map;
    var src;

    map = L.map('map', {
        fullscreenControl: true,
        zoomSnap: 0,
        crs: L.CRS.Simple,
        drawControl: true,
        layers: []
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
            map.panTo([mapCenter.lat, (mapCenter.lng - .015)]);     //defines where the map view should move to
        }
        //right bound of the map
        if(mousePos.x + 40 > mapSize.x && mousePos.y > 100 && oldMousePos.x < mousePos.x){
            map.panTo([mapCenter.lat, (mapCenter.lng + .015)]);
        }
    })




    //minimap

    var miniLayer = new L.tileLayer.elevator(function(coords, tile, done) {
        var error;
        var params = {Bucket: 'elevator-assets', Key: "testasset5/tiledBase_files/" + coords.z + "/" + coords.x + "_" + coords.y + ".jpeg"};
        tile.onload = (function(done, error, tile) {
            return function() {
                done(error, tile)
            }
        })(done, error, tile);
        tile.src = "https://s3.amazonaws.com/" + params.Bucket + "/" + params.Key;
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

    var point_num = 0;      //point #
    var year = 0;           //year
    var half_year = 0;      //half year
    var earlywood = true;   //earlywood or latewood
    var index = 0;      //points index
    var a = 0;          //annotation index
    var cut_point = -1;

    var marker_list = new Array();  //list of all markers, marker list maps to points JSON (same index)
    var lines = new Array();        //list of all the lines, lines maps to points JSON      
    var annotations = new Array();

    var annotationLayer = L.layerGroup().addTo(map);
    var markerLayer = L.layerGroup().addTo(map);    //map layer for markers
    var mouseLine = L.layerGroup().addTo(map);      //map layer for the mouse H-bar lines
    var lineLayer = L.layerGroup().addTo(map);      //map layer for the lines

    var data_collect = false;   //if data collect button is clicked
    var delete_active = false;  //if delete button is clicked
    var cut_active = false;
    var data_open = false;
    var annotation_delete_active = false;





    function reloadLayers(){
        //erase the markers
        markerLayer.clearLayers();
         //erase the lines
        lineLayer.clearLayers();

        //plot the data back onto the map
        Object.values(points).map(function(e, i){
            if(e.latLng != undefined){
                newLatLng(i, e.latLng);
            }
        });
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

        console.log(points);

        reloadLayers();

        deleteDisable();
    }

    function cutDataPoints(i, j){
        if(i > j){
            trimmed_points = Object.values(points).splice(i, index-1);
            var k = 0;
            points = {};
            trimmed_points.map(function(e){
                if(!k){
                    points[k] = {"point": 0,"latLng": e.latLng, "measurable": false};
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

    //newLatLng(i, latlng) takes the index for the points object and a latlng that should be added to the map with a marker
    //this function is also used when a json file is loaded by the user

    function newLatLng(i, latLng){
        leafLatLng = L.latLng(latLng);   //leaflet is stupid and only uses latlngs that are created through L.latlng

        //check if index is the start point
        if(!points[i].point){
            var marker = L.marker(latLng, {icon: dark_navy_icon, draggable: true, title: "Start Point"});
        }
        //check if point is earlywood
        else if(points[i].earlywood){
            var marker = L.marker(latLng, {icon: dark_green_icon, draggable: true, title: "Year " + points[i].year + ", earlywood"});         
        }
        //otherwise it's latewood
        else{
            var marker = L.marker(latLng, {icon: dark_red_icon, draggable: true, title: "Year " + points[i].year + ", latewood"});
        }

        marker_list[i] = marker;     //add created marker to marker_list

        //tell marker what to do when being draged
        marker_list[i].on('dragend', function(e){
            points[i].latLng = e.target._latlng;     //get the new latlng of the mouse pointer
            console.log(points);

            //adjusting the line from the previous and preceeding point if they exist
            if(points[i-1] != undefined && points[i-1].latLng != undefined){
                lineLayer.removeLayer(lines[i]);
                lines[i] = L.polyline([points[i-1].latLng, e.target._latlng], {color: '#37474F'});
                lineLayer.addLayer(lines[i]);
            }
            if(points[i+1] != undefined && points[i+1].latLng != undefined){
                lineLayer.removeLayer(lines[i+1]);
                lines[i+1] = L.polyline([e.target._latlng, points[i+1].latLng], {color: '#37474F'});
                lineLayer.addLayer(lines[i+1]);
            }
        });

        marker_list[i].on('click', function(e){
            if(delete_active){
                console.log(i);
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
        })

        //drawing the line if the previous point exists
        if(points[i-1] != undefined && points[i-1].latLng != undefined && points[i-1].point < points[i].point){
            lines[i] = L.polyline([points[i-1].latLng, leafLatLng], {color: '#37474F'});
            lineLayer.addLayer(lines[i]);
        }

        markerLayer.addLayer(marker_list[i]);    //add the marker to the marker layer
    }

    //easybutton function to add gap years in the data
    function skipYear(){
        points[index] = {'year':year, 'measurable': false}; //no point or latlng
        year++;
        index++;
    }

    function missingYear(){
        points[index] = {'year':year, 'latLng': L.latLng([99, 99]), 'measurable': true};
        year++;
        index++;
    }

    //easybutton function for undoing the last created marker
    function undo(){
        //check if anything exists
        if(index){
            //check index-1 because current index is still empty
            //if point exists we need to remove the point and marker
            if(points[index-1].latLng != undefined){
                markerLayer.removeLayer(marker_list[index-1]); //remove marker
                console.log(year);
                //figure out if the year is early or late and adjust accordingly
                if(points[index-1].point){
                    if(!points[index-1].earlywood){
                        year--;
                    }
                    half_year--;
                    earlywood = !earlywood;
                    lineLayer.removeLayer(lines[index-1]);
                }
                //don't decrement point past 0
                if(point_num){
                    point_num--;
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
            points[index-1] = {};    //erase data in points
            index--;
            console.log(points);
        }
    }

    //easybutton function to being data collection, btn a multi-state button object
    function collectEnable(){
        collectBtn.state('active');    //change the state of the button

        $(map._container).click(function startLine(e){
            var latLng = map.mouseEventToLatLng(e);

            map.dragging.disable();  //leaflet doesn't differentiate between a click and a drag

            if(point_num){
                points[index] = {"point":point_num,"year":year, "earlywood": earlywood, "latLng":latLng, "measurable": true};
            }
            //first point will not have year or earlywood
            else{
                points[index] = {"point":point_num,"latLng":latLng, "measurable": false};
            }

            newLatLng(index, latLng); //call newLatLng with current index and new latlng 

            createMouseLineFrom(latLng); //create the next mouseline from the new latlng

            //avoid incrementing earlywood for start point
            if(point_num){
                half_year++;
                if(half_year%2){
                    earlywood = false;
                }
                else{
                    earlywood = true;
                    year++;
                }
            }

            index++;
            point_num++;

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

        console.log(points);

        point_num = 0;  //reset the point number to 0
    }

    var setYearDialog = L.control.dialog({'size': [300, 90], 'anchor': [120, 50], 'initOpen': false})
        .setContent('First year: <input type="number" size="4" maxlength="4" id="year_input_begining"/>' +
                    '<button id="year_submit_begining">enter</button>' + '<br>' +
                    'Last year: <input type="number" size="4" maxlength="4" id="year_input_ending"/>' +
                    '<button id="year_submit_ending">enter</button>')
        .addTo(map);
    setYearDialog.freeze();

    document.getElementById('year_submit_begining').addEventListener('click', setYearBegining, false);
    document.getElementById('year_submit_ending').addEventListener('click', setYearEnding, false);

    function setYearBegining(){
        new_year = document.getElementById('year_input_begining').value;
        console.log(year);
        setYearDialog.close();
        setYearBtn.state('inactive');

        year = Number(new_year);

        for(i = 0; i < index; i++){
            if(points[i].year != undefined){
                if(points[i].earlywood){
                    points[i].year = year;
                }
                else{
                    points[i].year = year++;
                }
            }
        }
        reloadLayers();
    }

    function setYearEnding(){
        new_year = document.getElementById('year_input_ending').value;
        console.log(year);
        setYearDialog.close();
        setYearBtn.state('inactive');

        last_year = Number(new_year);
        year = last_year;

        for(i = index-1; i > 0; i--){
            if(points[i].year != undefined){
                if(points[i].earlywood){
                    points[i].year = last_year--;
                }
                else{
                    points[i].year = last_year;
                }
            }
        }
        reloadLayers();
        year++;
    }

    function shiftYear(x){
        for(i = 0; i < index; i++){
            if(points[i].year != undefined){
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

    var dataDialog = L.control.dialog({'size': [300, 350], 'anchor': [5, 50], 'initOpen': false})
            .setContent('<h2>There are no data points to measure</h2>')
            .addTo(map);

    function loadData(){
        if(points[0] != undefined){
            console.log("hi");
            string = "<table><tr><th style='width: 30%;'>Year</th><th style='width: 70%;'>Length</th></tr>";
            Object.values(points).map(function(e, i){
                if(e.year != undefined){
                    if(e.measurable){
                        length = Math.round(map.distance(last_point.latLng, e.latLng)*1000000)/1000;
                        if(length > 999){
                            string = string.concat("<tr><td>"+ e.year + "</td><td>" + 0 + " mm</td></tr>");
                            last_point = e;
                            last_length = length;
                        }
                        else{
                            if(e.earlywood){
                                wood = "e";
                                row_color = "green";
                            }
                            else{
                                wood = "l";
                                row_color = "red";
                            }
                            last_point = e;
                            last_length = length;
                            string = string.concat("<tr style='color:" + row_color + ";'>");
                            string = string.concat("<td>"+ e.year + wood + "</td><td>" + length + " mm</td></tr>");
                        }
                    }
                    else{
                        string = string.concat("<tr><td>"+ e.year + "_</td><td>" + "N/A</td></tr>");
                    }
                }
                else{
                    last_point = e;
                    last_length = 0;
                }
            });
            dataDialog.setContent(string + "</table>");
        }
        dataDialog.open();
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
        setYearBtn.disable();
        shiftForwardBtn.disable();
        shiftBackwardBtn.disable();

        setYearDialog.close();
    }

    function collapseMeasureBar(){
        measureBtn.state('collapse');
        collectBtn.disable();
        skipBtn.disable();
        undoBtn.disable();
        missingBtn.disable();

        collectDisable();
    }

    function collapseEditBar(){
        editBtn.state('collapse');
        deleteBtn.disable();
        cutBtn.disable();

        deleteDisable();
        cutDisable();
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
                setYearBtn.enable();
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

    var setYearBtn = L.easyButton ({
        states: [
        {
            stateName:  'set-year',
            icon:       '<i class="material-icons md-18">access_time</i>',
            title:      'Set the first year of chronology',
            onClick:    function(btn, map){
                setYearDialog.open();
            }
        }]
    });

    var shiftForwardBtn = L.easyButton ({
        states: [
        {
            stateName:  'year-forward',
            icon:       '<i class="material-icons md-18">redo</i>',
            title:      'Shift series forward',
            onClick:    function(btn, map){
                shiftYear(1);
            }
        }]
    });

    var shiftBackwardBtn = L.easyButton ({
        states: [
        {
            stateName:  'year-backward',
            icon:       '<i class="material-icons md-18">undo</i>',
            title:      'Shift series backward',
            onClick:    function(btn, map){
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
                undoBtn.enable();
                missingBtn.enable();
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
            title:      'Add a gap year (Alt+S)',
            onClick:    function(btn, map){
                skipYear();
            }
        }]
    });

    var missingBtn = L.easyButton ({
        states: [
        {
            stateName:  'missing-year',
            icon:       '<i class="material-icons md-18">space_bar</i>',
            title:      'Add a missing year',
            onClick:    function(btn, map){
                missingYear();
            }
        }]
    });

    var undoBtn = L.easyButton ({
        states: [
        {
            stateName:  'undo',
            icon:       '<i class="material-icons md-18">undo</i>',
            title:      'Undo (Alt+Z)',
            onClick:    function(btn, map){
                undo();
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
            onClick: function(btn, map){
                deleteDisable();
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
            icon:       '<i class="material-icons md-18">storage</i>',
            title:      'Open Data',
            onClick:    function(btn, map){
                loadData();
            }  
        }]
    });




    //group the buttons into a toolbar
    var timeBar = L.easyBar([timescaleBtn, setYearBtn, shiftForwardBtn, shiftBackwardBtn]);
    timeBar.addTo(map);
    setYearBtn.disable();
    shiftForwardBtn.disable();
    shiftBackwardBtn.disable();

    var measurementBar = L.easyBar([measureBtn, collectBtn, skipBtn, missingBtn, undoBtn, deleteBtn]);
    measurementBar.addTo(map);
    collectBtn.disable();
    skipBtn.disable();
    missingBtn.disable();
    undoBtn.disable();

    var editBar = L.easyBar([editBtn, deleteBtn, cutBtn]);
    editBar.addTo(map);
    deleteBtn.disable();
    cutBtn.disable()

    var annotationBar = L.easyBar([annotationBtn, dateMarkerBtn, deleteAnnotationBtn]);
    annotationBar.addTo(map);
    dateMarkerBtn.disable();
    deleteAnnotationBtn.disable();

    dataBtn.addTo(map);
    //annotationButton.addTo(map)


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
            undo();
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




    /*function saveData(){
        if(points[0] != undefined){
            console.log("hi")
            string = "<table><tr><th style='width: 30%;'>Year</th><th style='width: 70%;'>Length</th></tr>"
            Object.values(points).map(function(e, i){
                if(e.year != undefined){
                    wood = "-"
                    length = "N/A"
                    string = string.concat("<tr")
                    if(e.measurable){
                        length = Math.round(map.distance(last_latLng, e.latLng)*1000000)/1000
                        if(e.earlywood){
                            wood = "e"
                            row_color = "green"
                        }
                        else{
                            wood = "l"
                            row_color = "red"
                        }
                        last_latLng = e.latLng
                        string = string.concat(" style='color:" + row_color + ";'>")
                    }
                    string = string.concat("<td>"+ e.year + wood + "</td><td>" + length + " mm</td></tr>")
                }
                else{
                    last_latLng = e.latLng
                }
            })
            dataDialog.setContent(string + "</table>")
        }
    }*/



    //saving the data as a JSON
    $( "#save" ).click(function( event ) {
        //create anoter JSON and store the current counters for year, half_year, earlywood, and index, along with points data
        dataJSON = {'year': year, 'half_year': half_year, 'earlywood': earlywood, 'index': index, 'points': points };
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
            half_year = newDataJSON.half_year;
            earlywood = newDataJSON.earlywood;

            console.log(points);

            reloadLayers();
        }

        fr.readAsText(files.item(0));
    }