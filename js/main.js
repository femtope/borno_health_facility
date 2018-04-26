var d, m, y, date, type = '', distance, map,
    state = '', lga = '', lga_select = '', sub_lga = '',
    geoData = null, dataLayer = null, markerGroup = null,
    guineaAdminLayer0, guineaAdminLayer1, guineaAdminLayer2,lat, long,
    state_layer = null, lga_layer = null, sub_lga_layer = null, bufferLayer = null, substance_layer = null,
    GINLabels = [],
    within, within_fc, buffered = null, GINAdmin2 = false,
    googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom: 25, subdomains:['mt0','mt1','mt2','mt3']}),
    googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 25, subdomains:['mt0','mt1','mt2','mt3']}),
    osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18}),
    mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicy1jaGFuZCIsImEiOiJjaXdmcmtnc2QwMDBhMnltczBldmc1MHZuIn0.eIdXZvG0VOOcZhhoHpUQYA')


//Initiating and declaring leaflet map object
var map = L.map('map', {
    center: [9, 9],
    zoom: 6,
//    animation: true,
    zoomControl: false,
    layers: [osm],
    minZoom: 6,
    maxZoom: 22

});

var baseMaps = {
    "Google Satelite": googleSat,
    "OSM": osm,
    "Google Street": googleStreets,
    "Map Box": mapbox
};

new L.Control.Zoom({
    position: 'bottomright'
}).addTo(map);

L.control.layers(baseMaps).addTo(map);

//Helps add label to the polygons for admin boundary at zoom level greater than 9
function adjustLayerbyZoom(zoomGIN) {

    if (zoomGIN > 11) {
        if (!GINAdmin2) {
            map.addLayer(guineaAdminLayer2)
                //Add labels to the Admin2
            for (var i = 0; i < GINLabels.length; i++) {
                GINLabels[i].addTo(map)

            }
            GINAdmin2 = true
        }
    } else if(zoomGIN <= 10) {
        map.removeLayer(guineaAdminLayer2)
        for (var i = 0; i < GINLabels.length; i++) {
            map.removeLayer(GINLabels[i])

        }

        GINAdmin2 = false
    }

}

//This drives all the operation that will be rendering on the map
function triggerUiUpdate() {
    type = $('#type_scope').val();
    status = $('#status_scope').val();
    state = $('#state_scope').val();
    lga = $('#lga_scope').val();
    console.log("All Seleceted: ", state+"  "+lga+"  "+type+"  "+status)
    var query = buildQuery(state, lga, type, status)
    //download_query = (query.replace("http:", "https:").replace("format=GeoJSON&", ""))+"&format=CSV";
   // document.getElementById("query").setAttribute("href",download_query);
    console.log("Query: ", query)
    getData(query)
}

//Read data from carto and filter via selection from the interface
function buildQuery(state, lga, type, status) {
  var needsAnd = false;
    query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM hf';
   // console.log("Date in Query: ",date)
   if (state.length > 0 || lga.length > 0 || type.length > 0 || status.length > 0 ){
       query = query.concat(' WHERE')
       if (state.length > 0){
           query = query.concat(" state = '".concat(state.concat("'")))
      needsAnd = true
    }


    if(lga.length > 0) {
        query = needsAnd  ? query.concat(" AND lga = '".concat(lga.concat("'"))) :  query.concat(" lga = '".concat(lga.concat("'")))
      needsAnd = true
    }

    if (type.length > 0){
        query = needsAnd  ? query.concat(" AND type_hf = '".concat(type.concat("'"))) :  query.concat(" type_hf = '".concat(type.concat("'")))
      needsAnd = true
    }

    if (status.length > 0){
        query = needsAnd  ? query.concat(" AND status = '".concat(status.concat("'"))) :  query.concat(" status = '".concat(status.concat("'")))
      needsAnd = true
    }

   }
    else query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM hf';
    return query

}


//Helps add data to the marker cluster and cluster to the map with icons
function addDataToMap(geoData) {
    if (dataLayer != null)
        map.removeLayer(dataLayer)

    if (markerGroup != null)
        map.removeLayer(markerGroup)
    var _radius = 8
    var _outColor = "#fff"
    var _weight = 2
    var _opacity = 2
    var _fillOpacity = 2.0

    var markerHealth = L.icon({
        iconUrl: "image/hf_logo.png",
        iconSize: [20, 20],
        iconAnchor: [25, 25]
    });

    $('#projectCount').text(geoData.features.length)
    markerGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true
        })

    dataLayer = L.geoJson(geoData, {
        pointToLayer: function (feature, latlng) {
            var marker = L.marker(latlng, {icon: markerHealth})
            return marker
        },

        onEachFeature: function (feature, layer) {
            lat = feature.properties.latitude;
            long = feature.properties.longitude;
            if (feature.properties && feature.properties.cartodb_id) {
                layer.on('click', function () {
                    displayInfo(feature);
//                    var point = turf.point([lat, long]);
//                    var buffered = turf.buffer(point,2,'kilometers');
                })
            }
            console.log("lat_long: "+lat+", "+long)
        }
    })
    markerGroup.addLayer(dataLayer);
    map.addLayer(markerGroup);
}


//Add administrative boundaries to the map and symbolizes them
function addAdminLayersToMap(layers) {
    var layerStyles = {
            'admin0': {
                "clickable": true,
                "color": '#B81609',
                "fillColor": '#ffffff',
                "weight": 2.0,
                "opacity": 1,
                "fillOpacity": 0.05
            },
            'admin2': {
                "clickable": true,
                "color": '#412406',
                "fillColor": '#FFFFFF',
                "weight": 1.5,
                "opacity": 0.5,
                "fillOpacity": 0.05
            },
            'state': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#FFFFFF',
                "weight": 2.0,
                "opacity": 0.7,
                "fillOpacity": 0.05
            },
            'lga': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#80FFFFFF',
                "weight": 2.5,
                "opacity": 0.7,
                "fillOpacity": 0.05
            }
      }

    stateSelect = $('#state_scope').val()
    lgaSelect = $('#lga_scope').val()
    console.log("State and LGA Selected: "+stateSelect+"   "+lgaSelect)

    guineaAdminLayer0 = L.geoJson(layers['guineaAdmin0'], {
        style: layerStyles['admin0']
    }).addTo(map)


    //Zoom In to state level on selection
    if(state_layer != null)
      map.removeLayer(state_layer)

    state_layer = L.geoJson(layers['guineaAdmin1'], {
        filter: function(feature) {
            return feature.properties.admin1name === stateSelect
      },
      style: layerStyles['state'],
      }).addTo(map)
    map.fitBounds(state_layer)

    //Zoom In to lga Level on selection

    if(lga_layer != null)
      map.removeLayer(lga_layer)

    lga_layer = L.geoJson(layers['guineaAdmin2'], {
        filter: function(feature) {
            return feature.properties.admin2name === lgaSelect
      },
      style: layerStyles['state'],
      }).addTo(map)
    map.fitBounds(lga_layer)
    console.log("Zoom Level ",map.getZoom());
}

//Help attached counts of verious multiselection via query to the interface
function displayInfo(feature) {
    var infoContent = buildPopupContent(feature)
    $('#infoContent').html(infoContent)
}


//Normalizaes the data pull from carto by removing unwanted spaces and charater
function normalizeName(source) {
    source = source.replace("_", " ").replace('of_', ' of ')
    source = source.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    return source
}

//Help with popup information
function buildPopupContent(feature) {
    var subcontent = ''
    var propertyNames = ['state', 'lga', 'ward', 'health_facility', 'type_hf', 'status', 'accessibility']
    for (var i = 0; i < propertyNames.length; i++) {
        subcontent = subcontent.concat('<p><strong>' + normalizeName(propertyNames[i]) + ': </strong>' + feature.properties[propertyNames[i]] + '</p>')
    }
    return subcontent;
}

function showLoader() {
    $('.fa-spinner').addClass('fa-spin')
    $('.fa-spinner').show()
}

function hideLoader() {
    $('.fa-spinner').removeClass('fa-spin')
    $('.fa-spinner').hide()
}


function getData(queryUrl) {
    showLoader()
    $.post(queryUrl, function (data) {
        hideLoader()
        addDataToMap(data)
        console.log('Data-Geo::  ', data);
    }).fail(function () {
        console.log("error!")
    });
}

function getAdminLayers() {
    var adminLayers = {}

    //Add Admin Layers to Map
    $.get('resources/NGR_Admin0.json', function (guinea_admin0) {
        adminLayers['guineaAdmin0'] = guinea_admin0
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })

    $.get('resources/NGR_Admin1.json', function (guinea_admin1) {
        adminLayers['guineaAdmin1']= guinea_admin1
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })

    $.get('resources/NGR_Admin2.json', function (guinea_admin2) {
        adminLayers['guineaAdmin2'] = guinea_admin2
        addAdminLayersToMap(adminLayers)
		}).fail(function () {
            logError(null)
        })
}

function logError(error) {
    console.log("error!")
}


function geoLocate(km){
var options = {
  enableHighAccuracy: true,
  timeout: Infinity,
  maximumAge: 0
};

function success(pos) {
    var crd = pos.coords;
    var fc = {
"type": "FeatureCollection",
"features": [
{ "type": "Feature", "properties": { "id": 5 }, "geometry": { "type": "Point", "coordinates": [long, lat] } }
]
}
        var jsonLayer = L.geoJson(fc).addTo(map);
        var coord = fc.features[0].geometry.coordinates;
        lalo = L.GeoJSON.coordsToLatLng(coord);
        map.setView(lalo, 14);

    var drive = km * 1;
    buffered = turf.buffer(fc, drive, 'kilometers');
    bufferLayer = L.geoJson(buffered).addTo(map);
    bufferLayer.setStyle({
        stroke:false,
        strokeWidth: 2,
        fillColor: 'red',
        fillOpacity: 0.1
    })

};

    // navigator.geolocation.getCurrentPosition(success, error, options);
}



function radio_drive() {
    if(document.getElementById("2km").checked) {
        if(bufferLayer != null)
            map.removeLayer(bufferLayer)
        twokm = $('#2km').val();
        geoLocate(twokm);
		}

    if(document.getElementById("3km").checked) {
        if(bufferLayer != null)
            map.removeLayer(bufferLayer)
        threekm = $('#3km').val();
        geoLocate(threekm);
		}

    if(document.getElementById("4km").checked) {
        if(bufferLayer != null)
            map.removeLayer(bufferLayer)
        fourkm = $('#4km').val();
        geoLocate(fourkm);
		}
}

getAdminLayers()
hideLoader()


