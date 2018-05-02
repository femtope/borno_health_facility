var d, m, y, date, type = '', distance, map, long_health, lat_health, query, current_lat, current_long,
    state = '', lga = '', lga_select = '', stateSelect = '', lgaSelect = '',
    geoData = null, dataLayer = null, markerGroup = null,
    guineaAdminLayer0, guineaAdminLayer1, guineaAdminLayer2, lat, long,
    state_layer = null, lga_layer = null, sub_lga_layer = null, bufferLayer = null, substance_layer = null,
    GINLabels = [],
    buffered = null, point_health = null, GINAdmin2 = false,
    googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {maxZoom: 25, subdomains: ['mt0', 'mt1', 'mt2', 'mt3']}),
    googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {maxZoom: 25, subdomains:['mt0', 'mt1', 'mt2', 'mt3']}),
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


//This drives all the operation that will be rendering on the map
function triggerUiUpdate() {
    type = $('#type_scope').val();
    status = $('#status_scope').val();
    state = $('#state_scope').val();
    lga = $('#lga_scope').val();
    console.log("All Seleceted: ", state+"  "+lga+"  "+type+"  "+status)
    query = buildQuery(state, lga, type, status)
    download_query = (query.replace("http:", "https:").replace("format=GeoJSON&", ""))+"&format=CSV";
    document.getElementById("query").setAttribute("href",download_query);
    console.log("Query: ", query)
    lga_select = $('#lga_scope').val()
    getData(query)
}

//Read data from carto and filter via selection from the interface
function buildQuery(state, lga, type, status) {
  var needsAnd = false;
    query = 'https://femtope.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM hf';
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

    if (bufferLayer != null)
        map.removeLayer(bufferLayer)

    var markerHealth = L.icon({
        iconUrl: "image/hf_logo.png",
        iconSize: [20, 20],
        iconAnchor: [25, 25]
    });

    var markerNotFunction = L.icon({
        iconUrl: "image/hf_logo_d.png",
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
            if(feature.properties.status == "Functioning" || feature.properties.status == "Partially Functioning"){
                var marker = L.marker(latlng, {icon: markerHealth})
            }

            if(feature.properties.status == "Not Functioning"){
                var marker = L.marker(latlng, {icon: markerNotFunction})
            }

            return marker
        },

        onEachFeature: function (feature, layer) {
            lat_health = feature.properties.latitude;
            long_health = feature.properties.longitude;
            if(feature.properties.longitude != "" && feature.properties.latitude != ""){
                layer.on('click',function(){
                     success(feature);
                })
            };
            if (feature.properties && feature.properties.cartodb_id) {
                layer.on('click', function () {
                    displayInfo(feature);
                })
            }
//            console.log("lat_health_long: "+lat_health+", "+long_health)
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
                "fillOpacity": 0.0001
            },
            'state': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#80FFFFFF',
                "weight": 2.0,
                "opacity": 0.7,
                "fillOpacity": 0.0001
            },
            'lga': {
                "clickable": true,
                "color": '#e2095c',
                "fillColor": '#80FFFFFF',
                "weight": 2.5,
                "opacity": 0.7,
                "fillOpacity": 0.0001
            }
      }

    stateSelect = $('#state_scope').val()
    lgaSelect = $('#lga_scope').val()
//    console.log("State and LGA Selected: "+stateSelect+"   "+lgaSelect)

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
    map.fitBounds(state_layer);

    //Zoom In to lga Level on selection

    if(lga_layer != null)
      map.removeLayer(lga_layer)

    lga_layer = L.geoJson(layers['guineaAdmin2'], {
        filter: function(feature) {
            return feature.properties.admin2name === lgaSelect
      },
      style: layerStyles['lga'],
      }).addTo(map)
    map.fitBounds(lga_layer);
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


function success(feature) {
    if (bufferLayer != null)
        map.removeLayer(bufferLayer)

    current_lat = feature.properties.latitude;
    current_long = feature.properties.longitude;
     console.log("lat_health_long: "+current_lat+", "+current_long)

    var fc = {
            "type": "FeatureCollection",
            "features": [
                    { "type": "Feature", "properties": { "id": 5 }, "geometry": { "type": "Point", "coordinates": [current_long, current_lat] } }
            ]
        }
        var coord = fc.features[0].geometry.coordinates;
        lalo = L.GeoJSON.coordsToLatLng(coord);
        map.setView(lalo, 13);

    var km = 2;
    buffered = turf.buffer(fc, km, 'kilometers');
    console.log('Buffered::  ', buffered);
    bufferLayer = L.geoJson(buffered).addTo(map);
    bufferLayer.setStyle({
        stroke:false,
        strokeWidth: 2,
        fillColor: 'blue',
        fillOpacity: 0.08
    })

}

getAdminLayers()
hideLoader()


