var map;
var src;

$(document).ready(function () {

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
        tile.src = "https://s3.amazonaws.com/" + params.Bucket + "/" + params.Key;
        //console.log(tile.src);
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

    var mapSize = map.getSize();
    var mousePos = 0;

    map.on('mousemove', function(e){
        var oldMousePos = mousePos
        mousePos = e.containerPoint;
        var mouseLatLng = e.latlng;
        var mapCenter = map.getCenter();

        if(mousePos.x <= 80 && mousePos.y > 250 && oldMousePos.x > mousePos.x){
            map.panTo([mapCenter.lat, (mapCenter.lng - .015)]);
        }
        if(mousePos.x + 80 > mapSize.x && oldMousePos.x < mousePos.x){
            map.panTo([mapCenter.lat, (mapCenter.lng + .015)]);
        }
    })


    var miniLayer = new L.tileLayer.elevator(function(coords, tile, done) {
        var error
        var params = {Bucket: 'elevator-assets', Key: "testasset5/tiledBase_files/" + coords.z + "/" + coords.x + "_" + coords.y + ".jpeg"}
        tile.onload = (function(done, error, tile) {
            return function() {
                done(error, tile)
            }
        })(done, error, tile)
        tile.src = "https://s3.amazonaws.com/" + params.Bucket + "/" + params.Key
        src = tile.src
        return tile.src
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

    //snap to location


    //coordinate information in bottom left hand side of map
    var coordinatesDiv = document.createElement("div")
    coordinatesDiv.innerHTML = "<div class='leaflet-control-attribution leaflet-control'><p id='leaflet-coordinates-tag'></p></div>"
    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].appendChild(coordinatesDiv)

    $(map._container).mousemove(function showCoordsAndZoom(e) {
        var coords = map.mouseEventToContainerPoint(e)
        var x = Math.floor(coords.x) //not really x and y coordinates, they're arbitrary and based on rounding the latitude and longitude (because this is mapping software)
        var y = Math.floor(coords.y)
        document.getElementById("leaflet-coordinates-tag").innerHTML = "X: " + x + "   Y: " + y
    })


    green_icon = L.icon({
        iconUrl: 'images/green_icon.png',
        iconSize:     [30, 30] // size of the icon
    })
    red_icon = L.icon({
        iconUrl: 'images/red_icon.png',
        iconSize:     [30, 30] // size of the icon
    })
    black_icon = L.icon({
        iconUrl: 'images/black_icon.png',
        iconSize:     [30, 30] // size of the icon
    })


    var points = {};

    var point_num = 0;      //point #
    var year = 0;
    var half_year = 0;
    var earlywood = true
    var index = 0;      //dataJSON index

    var marker_list = new Array()

    var markerLayer = L.layerGroup().addTo(map)
    var mouseLine = L.layerGroup().addTo(map)

    var data_collect = false

    function createMouseLineFrom(latLng){
        $(map._container).mousemove(function lineToMouse(e){
            if(data_collect){
                mouseLine.clearLayers()
                var mousePoint = map.mouseEventToLayerPoint(e)
                var mouseLatLng = map.mouseEventToLatLng(e)
                var point = map.latLngToLayerPoint(latLng)

                var newX = mousePoint.x + (point.x - mousePoint.x)*Math.cos(Math.PI/2) - (point.y - mousePoint.y)*Math.sin(Math.PI/2)
                var newY = mousePoint.y + (point.x - mousePoint.x)*Math.sin(Math.PI/2) + (point.y - mousePoint.y)*Math.cos(Math.PI/2)
                var topPoint = map.layerPointToLatLng([newX, newY])

                var newX = mousePoint.x + (point.x - mousePoint.x)*Math.cos(Math.PI/2*3) - (point.y - mousePoint.y)*Math.sin(Math.PI/2*3)
                var newY = mousePoint.y + (point.x - mousePoint.x)*Math.sin(Math.PI/2*3) + (point.y - mousePoint.y)*Math.cos(Math.PI/2*3)
                var bottomPoint = map.layerPointToLatLng([newX, newY])

                mouseLine.addLayer(L.polyline([latLng, mouseLatLng, topPoint, bottomPoint]))
            }
        })
    }

    function newLatLng(i, latLng){
        leafLatLng = L.latLng(latLng)

        if(!points[i].point){
            var marker = L.marker(latLng, {icon: black_icon, draggable: true, title: "Start Point"})
        }
        else if(points[i].earlywood){
            var marker = L.marker(latLng, {icon: red_icon, draggable: true, title: "Year " + points[i].year + ", earlywood"})
        }
        else{
            var marker = L.marker(latLng, {icon: green_icon, draggable: true, title: "Year " + points[i].year + ", latewood"})
        }

        marker_list[i] = marker

        marker_list[i].on('dragend', function(e){
            points[i].latLng = e.target._latlng
            console.log(points)
        })

        markerLayer.addLayer(marker_list[i])
    }

    var skipButton = L.easyButton ({
        states: [
        {
            stateName:  'skip-year',
            icon:       '<i class="material-icons md-18">redo</i>',
            title:      'Add a gap year',
            onClick: function(btn, map){
                points[index] = {'year':year, 'measurable': false}
                year++
                index++
            }
        }]
    })

    var deleteButton = L.easyButton ({
        states: [
        {
            stateName:  'delete-marker',
            icon:       '<i class="material-icons md-18">delete</i>',
            title:      'Delete the last point',
            onClick: function(btn, map){
                if(index){
                    if(points[index-1].latLng != undefined){
                        markerLayer.removeLayer(marker_list[index-1])
                        console.log(year)
                        if(points[index-1].point){
                            if(!points[index-1].earlywood){
                                year--
                            }
                            half_year--
                            earlywood = !earlywood
                        }
                        if(point_num){
                            point_num--
                        }
                    }
                    else{
                        year--
                    }
                    if(data_collect){
                        createMouseLineFrom(points[index-2].latLng)
                    }
                    points[index-1] = {}
                    index--
                    console.log(points)
                }
            }
        }]
    })

    var collectButton = L.easyButton ({
        states: [
        {
            stateName:  'begin-collect',
            icon:       '<i class="material-icons md-18">timeline</i>',
            title:      'Begin data collection',
            onClick: function(btn, map){
                btn.state('end-collect')
                L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');

                $(map._container).click(function startLine(e){
                    var latLng = map.mouseEventToLatLng(e)

                    map.dragging.disable()

                    if(point_num){
                        points[index] = {"point":point_num,"year":year, "earlywood": earlywood, "latLng":latLng, "measurable": true}
                    }
                    else{
                        points[index] = {"point":point_num,"latLng":latLng, "measurable": false}
                    }

                    newLatLng(index, latLng)

                    createMouseLineFrom(latLng)

                    if(point_num){
                        half_year++
                        if(half_year%2){
                            earlywood = false
                        }
                        else{
                            earlywood = true
                            year++
                        }
                    }

                    index++
                    point_num++

                    data_collect = true
                })
            }
        },
        {
            stateName:  'end-collect',
            icon:       '&#10006',
            title:      'End data collection',
            onClick: function(btn, map){
                $(map._container).off('click')
                btn.state('begin-collect')
                data_collect = false;
                L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
                map.dragging.enable()
                mouseLine.clearLayers()

                console.log(points)

                point_num = 0;  //reset the point number to 0
            }
        }]
    })

    var toolbar = L.easyBar([collectButton, skipButton, deleteButton])
    toolbar.addTo(map)


    document.getElementById('load_data').onclick = function(){
        filtered_data = Object.values(points).filter(e => e.latLng != undefined)
        console.log(filtered_data)

        document.getElementById('table').innerHTML = "<tr><th style='width: 30%;'>Year</th><th style='width: 70%;'>Length</th></tr>"
        Object.values(points).map(function(e, i){
            if(e.year != undefined){
                wood = "-"
                length = "N/A"
                row_node = document.createElement('tr')
                if(e.measurable){
                    length = map.distance(last_latLng, e.latLng)
                    if(e.earlywood){
                        wood = "e"
                        row_node.style.color = 'red'
                    }
                    else{
                        wood = "l"
                        row_node.style.color = 'green'
                    }
                    last_latLng = e.latLng
                }
                row_node.innerHTML = '<td>'+ e.year + wood + '</td><td>' + length + '</td>'
                document.getElementById('table').appendChild(row_node)
            }
            else{
                last_latLng = e.latLng
            }
        })
    }



    $( "#save" ).click(function( event ) {
        dataJSON = {'year': year, 'half_year': half_year, 'earlywood': earlywood, 'index': index, 'points': points }
        this.href = 'data:plain/text,' + JSON.stringify(dataJSON)
    });

    document.getElementById('import').onclick = function() {
        var files = document.getElementById('selectFiles').files;
        console.log(files);
        if (files.length <= 0) {
            return false;
        }
      
        var fr = new FileReader();
      
        fr.onload = function(e) { 
            console.log(e);
            newDataJSON = JSON.parse(e.target.result);

            points = newDataJSON.points
            index = newDataJSON.index
            year = newDataJSON.year
            half_year = newDataJSON.half_year
            earlywood = newDataJSON.earlywood

            console.log(points)

            document.getElementById('table').innerHTML = ""
            markerLayer.clearLayers()


            Object.values(points).map(function(e, i){
                if(e.latLng != undefined){
                    newLatLng(i, e.latLng)
                }
            })
        }

        fr.readAsText(files.item(0));
    };




    /*var drawActive = false;

    var dataJSON = {'points': {}, 'lengths': {}};

    var l = 0;      //line #
    var p = 0;      //point #
    var year = 0;
    var v = 0;      //dataJSON index

    var points;     //declare array of points


    //A button for adding gap years in the data
    var skipButton = L.easyButton ({
        states: [
        {
            stateName:  'skip-year',
            icon:       '&#10148',
            title:      'Add a gap year',
            onClick: function(btn, map){
                dataJSON.points[v] = {"line_number":l,"year":year}
                var node = document.createElement('P')
                node.setAttribute('id', v)
                var nodeInfo = document.createTextNode('Year ' + year + ' Line ' + l + ' none ')
                node.appendChild(nodeInfo)
                document.getElementById('data').appendChild(node)
                year++
                v++
            }
        }]
    })

    //markers are added into a leaflet marker layer
    var markerLayer = L.layerGroup().addTo(map)

    var mouseLine = L.layerGroup().addTo(map)

    var lineLayers = new Array()

    function drawLine(x){
        lineLayers[x].clearLayers()

        var lineValues = Object.values(dataJSON.points).filter((val) => val.line == x)

        var points = lineValues.map((val) => val.latLng)

        lineLayers[x].addLayer(L.polyline(points)) 
    }

    function newLatLng(val, latLng){
        leafLatLng = L.latLng(latLng)
        var marker = L.marker(latLng, {draggable: false})
        markerLayer.addLayer(marker)
        marker.bindPopup("Point " + dataJSON.points[val].point + " at " + leafLatLng.toString())

        var adjustButton = document.createElement('BUTTON')
        adjustButton.innerHTML = 'Adjust'
        adjustButton.style.margin = '5px'
        adjustButton.setAttribute('id', val)

        lengthNode = document.createElement('P')
        lengthNode.setAttribute('id', 'length' + val)
        var lengthInfo = document.createTextNode('')

        $(map._container).mousemove(function lineToMouse(e){
            if(drawActive){
                mouseLine.clearLayers()
                var mouseLocation = map.mouseEventToLatLng(e)

                mouseLine.addLayer(L.polyline([latLng, mouseLocation, [mouseLocation.lat + .005, mouseLocation.lng], [mouseLocation.lat - .005, mouseLocation.lng]]))
            }
        })

        if(dataJSON.points[val].point){
            lengthInfo = document.createTextNode('Distance: ' + 100 * dataJSON.lengths[val].distance + ' centimeters')
        }

        lengthNode.appendChild(lengthInfo)
        document.getElementById('data').appendChild(lengthNode)

        pointNode = document.createElement('P')
        pointNode.setAttribute('id', 'point' + val)

        pointInfo = document.createTextNode('Year ' + dataJSON.points[val].year + ' Line ' + dataJSON.points[val].line + ' Point ' + dataJSON.points[val].point + ' at ' + leafLatLng.toString())
        pointNode.appendChild(pointInfo)
        pointNode.appendChild(adjustButton)
        document.getElementById('data').appendChild(pointNode)

        adjustButton.addEventListener('click', function(){
            if(drawActive){
                alert('End line before adjusting points!')
            }
            else{
                $(map._container).click(function adjustPoint(e){
                    var id = parseInt(adjustButton.id)
                    var newLatLng = map.mouseEventToLatLng(e)
                    marker.setLatLng(newLatLng)

                    dataJSON.points[id].latLng = newLatLng

                    if(dataJSON.points[id-1] != undefined && Math.abs(dataJSON.points[id-1].point - dataJSON.points[id].point) == 1){
                        dataJSON.lengths[id].distance = map.distance(dataJSON.points[id-1].latLng, dataJSON.points[id].latLng)
                        document.getElementById('length'+ id).innerHTML = 'Distance: ' + 100 * dataJSON.lengths[id].distance + ' centimeters' 
                    }

                    document.getElementById('point' + id).innerHTML = 'Year ' + dataJSON.points[id].year + ' Line ' + dataJSON.points[id].line + ' Point ' + dataJSON.points[id].point + ' at ' + newLatLng.toString()
                    document.getElementById('point' + id).appendChild(adjustButton)

                    if(dataJSON.points[id+1] != undefined && dataJSON.points[id+1].point){
                        dataJSON.lengths[id+1].distance = map.distance(dataJSON.points[id].latLng, dataJSON.points[id+1].latLng)
                        document.getElementById('length'+ (id + 1)).innerHTML = 'Distance: ' + 100 * dataJSON.lengths[id+1].distance + ' centimeters'
                    }

                    drawLine(dataJSON.points[id].line)

                    $(map._container).off('click')
                })
            }
        })
    }

    //button to create a new line segment
    var lineButton = L.easyButton ({
        states: [
        {
            stateName:  'create-line',
            icon:       '&#10148',
            title:      'Create a new line segment',
            onClick: function(btn, map){
                btn.state('end-line')
                skipButton.addTo(map)   //the skip button only appears when a line is being made
                drawActive = true;
                L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');

                points = new Array()    //initialize a new array of points

                lineLayers.push(L.layerGroup().addTo(map))

                $(map._container).click(function startLine(e){
                    var latLng = map.mouseEventToLatLng(e)

                    map.dragging.disable()

                    dataJSON.points[v] = {"point":p,"line":l,"year":year,"latLng":latLng}

                    points.push(latLng) //add the new point to the array of points
                    lineLayers[l].addLayer(L.polyline(points))

                    if(dataJSON.points[v].point){
                        distance = map.distance(dataJSON.points[v - 1].latLng, dataJSON.points[v].latLng)
                        dataJSON.lengths[v] = {"distance": distance}
                    }

                    newLatLng(v, latLng)

                    p++
                    v++
                    year++
                })
            }
        },
        {
            stateName:  'end-line',
            icon:       '&#10006',
            title:      'End line segment',
            onClick: function(btn, map){
                $(map._container).off('click')
                btn.state('create-line')
                skipButton.remove()
                drawActive = false;
                L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
                map.dragging.enable()
                mouseLine.clearLayers()

                if(p){      //if no points were drawn we don't want to increment the line #
                    l++
                }
                p = 0;  //reset the point number to 0
            }
        }]
    })

    lineButton.addTo(map)

    $( "#save" ).click(function( event ) {
        this.href = 'data:plain/text,' + JSON.stringify(dataJSON)
    });

    document.getElementById('import').onclick = function() {
        var files = document.getElementById('selectFiles').files;
        console.log(files);
        if (files.length <= 0) {
            return false;
        }
      
        var fr = new FileReader();
      
        fr.onload = function(e) { 
            console.log(e);
            dataJSON = JSON.parse(e.target.result);

            console.log(dataJSON)

            v = Object.keys(dataJSON.points).length
            console.log(v)

            l = dataJSON.points[v-1].line +1
            year = dataJSON.points[v-1].year +1

            document.getElementById('data').innerHTML = ""
            markerLayer.clearLayers()

            for(x in dataJSON.points){
                newLatLng(x, dataJSON.points[x].latLng)
            }

            for(i in lineLayers){
                lineLayers[i].clearLayers()
            }

            lineLayers = new Array()

            for(i = 0; i < l; i++){
                lineLayers.push(L.layerGroup().addTo(map))
                drawLine(i)
            }
        }

        fr.readAsText(files.item(0));
    };*/

})