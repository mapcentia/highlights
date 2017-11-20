/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var switchLayer;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;

var prettyUnits = require("pretty-units");

var featuresWithKeys = {};

var handlebars = require('handlebars');

var showdown = require('showdown');

var converter = new showdown.Converter();

var position;

var vectorLayers;

var features = [];

var tripLayer = L.geoJson(null);

var React = require('react');

var ReactDOM = require('react-dom');

var urlparser = require('./../../../browser/modules/urlparser');

var urlVars = urlparser.urlVars;

var todoItems = [];

var source1 =
    '<h1>{{{title}}}</h1>' +
    '<div>{{{text}}}</div>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '<ol class="carousel-indicators">' +
    '{{#images}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/images}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#images}}' +
    '<div class="item {{#if @first}}active{{/if}}">' +
    '<img style="width: 100%" src="{{.}}" alt="">' +
    '<div class="carousel-caption">' +
    '<p>{{[1]}}</p>' +
    '</div>' +
    '</div>' +
    '{{/images}}' +
    '</div>' +


    '<a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev">' +
    '<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' +
    '<span class="sr-only">Previous</span>' +
    '</a>' +
    '<a class="right carousel-control" href="#myCarousel" role="button" data-slide="next">' +
    '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
    '<span class="sr-only">Next</span>' +
    '</a>' +
    '</div>' +

    '{{#if video}}' +
    '<div class="embed-responsive embed-responsive-16by9">' +
    '<iframe class="embed-responsive-item" src="{{video}}" allowfullscreen></iframe>' +
    '</div>' +
    '{{/if}}';

var sourceShare =
    '<div style="text-align: center" class="bs-component btn-group-sm">' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="facebook" data-poi-id="{{id}}"><i class="material-icons fa fa-facebook"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="twitter" data-poi-id="{{id}}"><i class="material-icons fa fa-twitter"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-todo-id="{{id}}"><i class="material-icons">directions</i></a>'
'</div>';

var template1 = handlebars.compile(source1);

var templateShare = handlebars.compile(sourceShare);

var icon = L.icon({
    iconUrl: 'https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/leaflet-icons/Krone-piktogram.png',
    iconSize: [40, 40], // size of the icon
    iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        switchLayer = o.switchLayer;
        backboneEvents = o.backboneEvents;
        vectorLayers = o.extensions.vectorLayers.index;
        return this;
    },
    init: function () {

        var parent = this, layerName = "v:punkter.poi";

        cloud.get().map.addLayer(tripLayer);

        vectorLayers.setOnEachFeature(layerName, function (feature, layer) {
            layer.on("click", function () {
                parent.createInfoContent(feature.properties.id);
            });
        });

        vectorLayers.setOnLoad(layerName, function (store) {

            features = store.geoJSON.features;

            /*    if ("geolocation" in navigator) {

             navigator.geolocation.watchPosition(
             function (p) {
             position = p;
             $("#btn-list-dis").removeClass("disabled");
             if ($("#btn-list-dis").hasClass("active")) {
             parent.renderListWithDistance();
             }
             },

             function () {
             parent.renderListWithoutDistance();
             $("#btn-list-alpha").addClass("active");
             $("#btn-list-dis").removeClass("active");
             $("#btn-list-dis").addClass("disabled");
             }
             );

             } else {

             parent.renderListWithoutDistance();

             }*/

            $.each(store.geoJSON.features, function (i, v) {

                featuresWithKeys[v.properties.id] = v.properties;
                featuresWithKeys[v.properties.id].geometry = v.geometry;

            });

        });

        vectorLayers.setOnSelect(layerName, function (id, layer) {

            parent.createInfoContent(layer.feature.properties.id);

        });

        vectorLayers.setOnMouseOver(layerName, _.debounce(function (id, layer) {

            var p = new R.Pulse(
                [layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]],
                30,
                {'stroke': 'none', 'fill': 'none'},
                {'stroke': '#30a3ec', 'stroke-width': 3});

            cloud.get().map.addLayer(p);

            setTimeout(function () {
                cloud.get().map.removeLayer(p);
            }, 800);

        }, 250));

        vectorLayers.setCM(layerName,
            [
                {
                    header: "Titel",
                    dataIndex: "titel",
                    sortable: true
                },
                {
                    header: "Info",
                    dataIndex: "kort_detaljetekst",
                    sortable: true
                }
            ]
        );

        vectorLayers.setStyle(layerName,
            {
                weight: 5,
                color: '#ff00ff',
                dashArray: '',
                fillOpacity: 0.2
            }
        );

        vectorLayers.setPointToLayer(layerName, function (feature, latlng) {

                return L.marker(latlng, {
                    icon: L.ExtraMarkers.icon({
                        icon: 'fa-eye',
                        //number: 'V',
                        markerColor: 'green-light',
                        shape: feature.properties.tid === "Vikingetid" ? 'star' :
                            feature.properties.tid === "Stenalder" ? 'square' :
                                feature.properties.tid === "Middelalder" ? 'penta' :
                                    feature.properties.tid === "Jernalder" ? 'circle' :
                                        'circle'
                        ,
                        prefix: 'fa',
                        iconColor: "#ffffff",
                        //innerHTML: '<svg width="20" height="30"> <circle cx="10" cy="15" r="10" stroke="green" stroke-width="1" fill="yellow" /> </svg>'

                    })
                });
            }
        );

        backboneEvents.get().on("ready:vectorLayers", function () {
            vectorLayers.switchLayer(layerName, true);
        });

        try {
            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));
        } catch (e) {
        }

        $("#locale-btn").append($(".leaflet-control-locate"));

    },

    createInfoContent: function (id) {

        featuresWithKeys[id].text = converter.makeHtml(featuresWithKeys[id].tekst);
        featuresWithKeys[id].title = featuresWithKeys[id].titel;
        featuresWithKeys[id].images = featuresWithKeys[id].billeder;

        var html = template1(featuresWithKeys[id]);

        var htmlShare = templateShare(featuresWithKeys[id]);

        $("#click-modal").modal({});
        $("#click-modalLabel").html(featuresWithKeys[id].navn);
        $("#click-modal .modal-body").html(html + htmlShare);
    },

    renderListWithDistance: function () {
        var d, i;

        if (!position) {
            return;
        }

        var getDistanceFromLatLonInKm = function (lat1, lon1, lat2, lon2) {
            var R = 6371000; // Radius of the earth in km
            var dLat = deg2rad(lat2 - lat1);  // deg2rad below
            var dLon = deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            return d;
        };

        var deg2rad = function (deg) {
            return deg * (Math.PI / 180)
        };

        for (i = 0; i < features.length; i++) {

            if (features[i].geometry.type !== "Point") {
                features[i].properties.__distanceNum = 1000000000;
                features[i].properties.__distanceStr = '-';

            } else {

                d = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, features[i].geometry.coordinates[1], features[i].geometry.coordinates[0]);
                features[i].properties.__distanceNum = d;
                features[i].properties.__distanceStr = prettyUnits(d) + 'm'
            }
        }
        features.sort(function (a, b) {
            var keyA = a.properties.__distanceNum,
                keyB = b.properties.__distanceNum;
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        // ReactDOM.render(
        //     <FeatureListDistance features={features}/>,
        //     document.getElementById("inner-list")
        // );

    },

    renderListWithoutDistance: function () {
        features.sort(function (a, b) {
            var alc = a.properties.titel.toLowerCase(), blc = b.properties.titel.toLowerCase();
            return alc > blc ? 1 : alc < blc ? -1 : 0;
        });
        ReactDOM.render(
            <FeatureList features={features}/>,
            document.getElementById("inner-list")
        );
    },

    updateTodo: function (id, add) {

        todoItems.push({
            index: 3,
            value: featuresWithKeys[id].titel,
            done: false,
            geometry: featuresWithKeys[id].geometry
        });

        createOsrmTripUrl(todoItems)

            .then(
                function (res) {
                    return addTripLayer(res.url);
                },
                function () {
                    console.log(res);
                })

            .then(
                function (res) {
                    console.log(res);
                },
                function () {
                    console.log(res);
                });

        try {
            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));
        } catch (e) {
        }

        return true;
    }
};

/**
 * Builds a OSRM Trip URL from array array of GeoJSON point geometries
 * First point is the geolocation
 * @param arr
 * @returns {Promise}
 */
var createOsrmTripUrl = function (arr) {

    return new Promise(function (resolve, reject) {

        var coords = arr.map(function (e) {
            return e.geometry.coordinates[0] + "," + e.geometry.coordinates[1];
        });

        if ("geolocation" in navigator) {

            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var crd = pos.coords;

                    console.log('Your current position is:');
                    console.log(`Latitude : ${crd.latitude}`);
                    console.log(`Longitude: ${crd.longitude}`);
                    console.log(`More or less ${crd.accuracy} meters.`);

                    coords.unshift(crd.longitude + "," + crd.latitude);

                    if (coords.length > 1) {
                        resolve(
                            {
                                url: "https://router.project-osrm.org/trip/v1/driving/" + coords.join(";") + "?overview=simplified&steps=false&hints=;&geometries=geojson",
                                success: true
                            })
                    } else {
                        reject({
                            code: 1,
                            message: "Less than two points"
                        });
                    }
                },

                function () {
                    reject({
                        code: 2,
                        message: "ERROR"
                    });
                },

                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                },
            );

        } else {


        }
    })
};

/**
 * Fetches the GeoJSON from OSRM and add it to Leaflet
 * @param url
 * @returns {Promise}
 */
var addTripLayer = function (url) {

    return new Promise(function (resolve, reject) {

        if (!url) {
            reject({
                message: "No URL"
            });
        }

        $.getJSON(url, function (data) {

            tripLayer.clearLayers();
            tripLayer.addData(data.trips[0].geometry);
            resolve({
                message: "Trip added to map"
            })


        }).fail(function () {
            reject({
                message: "Trip NOT added to map"
            });

        })
    })
};

class TodoList extends React.Component {
    render() {
        var items = this.props.items.map((item, index) => {
            return (
                <TodoListItem key={index} item={item} index={index} removeItem={this.props.removeItem}
                              markTodoDone={this.props.markTodoDone}/>
            );
        });
        return (
            <ul className="list-group"> {items} </ul>
        );
    }
}

class TodoListItem extends React.Component {
    constructor(props) {
        super(props);
        this.onClickClose = this.onClickClose.bind(this);
        this.onClickDone = this.onClickDone.bind(this);
    }

    onClickClose() {
        var index = parseInt(this.props.index);
        this.props.removeItem(index);
    }

    onClickDone() {
        var index = parseInt(this.props.index);
        this.props.markTodoDone(index);
    }

    render() {
        var todoClass = this.props.item.done ?
            "done" : "undone";
        return (
            <li className="list-group-item">
                <div className={todoClass}>
                    <span className="glyphicon glyphicon-ok icon" aria-hidden="true" onClick={this.onClickDone}></span>
                    {this.props.item.value}
                    <button type="button" className="close" onClick={this.onClickClose}>&times;</button>
                </div>
            </li>
        );
    }
}

class TodoHeader extends React.Component {
    render() {
        return <p>Hvis du er interesseret i at besøge en seværdig, så klik i info-vinduet på <i
            className="material-icons inherit-size">directions</i> knappen. Så kommer seværdigen på listen. Kortet vil
            foreslå en rute du kan tage rundt til de forskellige seværdiger. God tur!</p>
    }
}

class TodoApp extends React.Component {
    constructor(props) {
        super(props);
        this.addItem = this.addItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
        this.markTodoDone = this.markTodoDone.bind(this);
        this.state = {todoItems: todoItems};
    }

    addItem(todoItem) {
        todoItems.unshift({
            index: todoItems.length + 1,
            value: todoItem.newItemValue,
            done: false
        });
        this.setState({todoItems: todoItems});
    }

    removeItem(itemIndex) {
        todoItems.splice(itemIndex, 1);
        this.setState({todoItems: todoItems});

        createOsrmTripUrl(this.state.todoItems)

            .then(
                function (res) {
                    console.log(res);
                    return addTripLayer(res.url);
                },
                function (res) {
                    console.log(res);
                    if (res.code === 1) {
                        tripLayer.clearLayers();
                    }
                    return;
                }
            )

            .then(
                function (res) {
                    console.log(res);
                },
                function (res) {
                    console.log(res);
                });
    }

    markTodoDone(itemIndex) {
        var todo = todoItems[itemIndex];
        todoItems.splice(itemIndex, 1);
        todo.done = !todo.done;
        todo.done ? todoItems.push(todo) : todoItems.unshift(todo);
        this.setState({todoItems: todoItems});
    }

    render() {
        return (
            <div id="main">
                <TodoHeader />
                <TodoList items={this.props.initItems} removeItem={this.removeItem} markTodoDone={this.markTodoDone}/>
            </div>
        );
    }
}


