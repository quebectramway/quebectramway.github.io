let zoom = 12;
let center = [-71.25, 46.8];

if (window.location.hash !== '') {
  const hash = window.location.hash.replace('#map=', '');
  const parts = hash.split('/');
  if (parts.length === 4) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
  }
}

var styleCache = {};

function getStyle(tenth) {
  var tenthColor = "";

  switch(tenth) {
    case 0:
      tenthColor = "#c1e7ff00";
      break;
    case 1:
      tenthColor = "#abd2ec20";
      break;
    case 2:
      tenthColor = "#94bed940";
      break;
    case 3:
      tenthColor = "#7faac660";
      break;
    case 4:
      tenthColor = "#6996b380";
      break;
    case 5:
      tenthColor = "#5383a1A0";
      break;
    case 6:
      tenthColor = "#3d708fB0";
      break;
    case 7:
      tenthColor = "#255e7eC0";
      break;
    case 8:
      tenthColor = "#004c6dD0";
      break;      
    case 9:
      tenthColor = "#00354dE0";
      break;  

  }
  tenthColorNoAlpha = tenthColor.slice(0, -2);
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: tenthColor
    })
  });
}
								
function styleFunction(feature, resolution) {
    var val = feature.get('density2021');
    tenth = 0;

 if(val <= 10)
    tenth = 0
  else if(val <= 100)
    tenth = 0;
  else if(val <= 500)
    tenth =  1;
  else if(val <= 1000)
    tenth =  4;
  else if(val <= 2500)
    tenth =  5;
  else if(val <= 5000)
    tenth =  6;
  else if(val <= 7500)
    tenth =  7;
  else if(val <= 10000)
    tenth =  8;
  else if(val <= 20000)
    tenth =  9;
  else if(val > 20000)
    tenth =  10;


    if(!styleCache[tenth]) {
      styleCache[tenth] = getStyle(tenth);
    }
    return styleCache[tenth];
}
var quebecExtent =  [-7976369.003918784, 5877934.621700673, -7890327.411480391, 5941350.853766653];
const disseminationBlocksDataSourceZoomLevel = 10;

var disseminationBlocksLayer = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: "https://sequelfirst.com/tilecache/dissemination-blocks-2021/{z}/{x}/{y}.pbf",
      crossOrigin: 'anonymous',
      minZoom: disseminationBlocksDataSourceZoomLevel,
      maxZoom: disseminationBlocksDataSourceZoomLevel  
    }),
    style: styleFunction,
    extent: quebecExtent,
    minZoom: 10,
    maxZoom: 20      
  });

var selection = null;
var selectedStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,0.8)',
    width: 5,
  })
});  

var baseLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://geoegl.msp.gouv.qc.ca/carto/tms/1.0.0/carte_gouv_qc_ro@EPSG_3857/{z}/{x}/{-y}.png",
    crossOrigin: 'anonymous'
  })
});

var tramwayStationBuffer1km = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://sequelfirst.com/geojson/tramway/tramway-station-buffer-1km.json',
    format: new ol.format.GeoJSON() 
  }),
  style: new ol.style.Style({
    stroke: null,
    fill: null
  }),
  extent: quebecExtent
});

var dbWithin1kStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,0.8)',
    width: 2,
  })
});  
var trajetStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#ff8003',
    width: 7,
  })
});  
var db1km = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://sequelfirst.com/geojson/tramway/dissemination-blocks-contains-1km-tramway-station-union.json',
    format: new ol.format.GeoJSON() 
  }),
  style: dbWithin1kStyle,
  extent: quebecExtent
});
var trajet = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://sequelfirst.com/geojson/tramway/tramway-trajet.json',
    format: new ol.format.GeoJSON() 
  }),
  style: trajetStyle,
  extent: quebecExtent
});
const widthStation = 3;
const widthpoles = 5;
const poleStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: widthpoles * 2,
      fill: new ol.style.Fill({
        color: '#ff5003',
      }),
      stroke: new ol.style.Stroke({
        color: [255, 255, 255, 1],
        width: widthpoles / 2,
      })
    }),
    zIndex: Infinity,
  });
const stationStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: widthStation * 2,
    fill: new ol.style.Fill({
      color: '#ff8050',
    }),
    stroke: new ol.style.Stroke({
      color: [255, 255, 255, 1],
      width: widthStation / 2,
    }),
  }),
  zIndex: Infinity,
});
function stationStyleFunction(feature, resolution) {
  if(feature.getProperties().type === 'Station')
    return stationStyle;
  else
    return poleStyle;
}
var stations = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://sequelfirst.com/geojson/tramway/tramway-stations.json',
    format: new ol.format.GeoJSON() 
  }),
  style: stationStyleFunction,
  extent: quebecExtent
});
var selectionLayer = new ol.layer.Vector({
  map: map,
  renderMode: 'vector',
  source: tramwayStationBuffer1km.getSource(),
  extent: quebecExtent,
  style: function (feature) {
    if(!!selection)
    if (feature.getProperties().nom == selection.getProperties().nom) { // TODO: comparer par id, mais il n'est pas disponible sur la station. uniquement sur le buffer.
      return selectedStyle;
    }
  },
});

var layerGroup = new ol.layer.Group({layers:[ disseminationBlocksLayer, trajet, tramwayStationBuffer1km, stations]});
var selectionLayerGroup = new ol.layer.Group({layers:[selectionLayer]});

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform(center,'EPSG:4326','EPSG:3857'),
    zoom: zoom,
    minZoom: 10,
    maxZoom: 16,
    extent: quebecExtent
  }),
  layers: [baseLayer,selectionLayerGroup,layerGroup]
});

const view = map.getView();
var firstUpdate = true;
const updatePermalink = function () {
  if (firstUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    firstUpdate = false;
    return;
  }
   
  const center = ol.proj.transform(view.getCenter(),'EPSG:3857', 'EPSG:4326');
    zoom: 12
  const hash =
    '#map=' +
    view.getZoom().toFixed(2) +
    '/' +
    center[0].toFixed(2) +
    '/' +
    center[1].toFixed(2);
  const state = {
    zoom: view.getZoom(),
    center: view.getCenter()
  };
  window.history.replaceState(state, 'map', hash);
};

map.on('moveend', updatePermalink);

const popup = new ol.Overlay({
  element: document.getElementById('popup'),
});
const element = popup.getElement();
map.addOverlay(popup);

map.on(['click'], function (event) {


  stations.getFeatures(event.pixel).then(function (features) {
    var feature = null;
    if (features.length) {
      feature = features[0];
    } 
    selection = feature;
    displayPopup(event, feature);
    selectionLayer.changed();    
  });
});

function displayPopup(event, feature) {
  const coordinate = event.coordinate;
  popup.setPosition(coordinate);
  let popover = bootstrap.Popover.getInstance(element);
  
  if (popover) {
    popover.dispose();
  }
  if(feature) {
    popover = new bootstrap.Popover(element, {
      animation: false,
      container: 'body',
      content: '<b>Population (1km)</b>: ' + parseInt(feature.getProperties().population, 10).toLocaleString('fr-CA') + '</br><b>Type:</b> ' + feature.getProperties().type + '</br><b>Description:</b> ' + feature.getProperties().description ,
      html: true,
      placement: 'top',
      title: 'Station '  + feature.getProperties().nom,
      offset:'50,50'
    });
    popover.show();
  }

}
