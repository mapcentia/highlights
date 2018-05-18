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

var tripLayer = L.geoJson(null, {
    color: '#888888',
    opacity: 0.5
});

var highLightLayer = new L.FeatureGroup();

var React = require('react');

var ReactDOM = require('react-dom');

var urlparser = require('./../../../browser/modules/urlparser');

var urlVars = urlparser.urlVars;

var todoItems = [];

var googleUrl;

handlebars.registerHelper('checklength', function (v1, v2, options) {
    'use strict';
    if (v1.length > v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

var source1 =
    '<h1>{{{title}}}</h1>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '{{#checklength images 1}}' +

    '<ol class="carousel-indicators">' +
    '{{#images}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/images}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#images}}' +
    '<div class="item {{#if @first}}active{{/if}}">' +
    '<img style="width: 100%" src="https://s3-eu-west-1.amazonaws.com/mapcentia-www/vmus/{{.}}" alt="">' +
    '<div class="carousel-caption">' +
    //'<p>{{[1]}}</p>' +
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

    '{{else}}' +
    '<img style="width: 100%" src="https://s3-eu-west-1.amazonaws.com/mapcentia-www/vmus/{{images.[0]}}" alt="">' +

    '{{/checklength}}' +

    '<div class="vmus-text">{{{text}}}</div>' +


    '{{#if video}}' +
    '<div class="embed-responsive embed-responsive-16by9">' +
    '<iframe class="embed-responsive-item" src="{{video}}?rel=0&modestbranding=1&fs=0&autohide=1&showinfo=0&wmode=transparent" allowfullscreen></iframe>' +
    '</div>' +
    '{{/if}}';

var sourceShare =
    '<div id="share-buttons" style="text-align: center" class="bs-component btn-group-sm">' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="facebook" data-poi-id="{{id}}"><i class="material-icons fa fa-facebook"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="twitter" data-poi-id="{{id}}"><i class="material-icons fa fa-twitter"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-info btn-fab btn-share" data-todo-id="{{id}}"><i class="material-icons">shopping_cart</i></a>' +
    '</div>' +

    '<script>' +
    'window.disqus_config = function () {' +
    'this.page.url = "https://vidi.mapcentia.com/app/vmus?poi={{id}}";' +
    'this.page.identifier = "{{id}}"' +
    '};' +
    '</script>' +

    '<div id="disqus_thread"></div>';

var template1 = handlebars.compile(source1);

var templateShare = handlebars.compile(sourceShare);

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

        var parent = this,
            layerNames = ["v:punkter.poi", "v:punkter.natur", "v:punkter.spisning", "v:punkter.overnatning"];
        cloud.get().map.addLayer(tripLayer);
        cloud.get().map.addLayer(highLightLayer);

        layerNames.map(function (layerName) {
            vectorLayers.setOnEachFeature(layerName, function (feature, layer) {
                layer.on("click", function () {
                    createInfoContent(feature.properties.id);
                });
            });

            vectorLayers.setOnLoad(layerName, function (store) {

                features = store.geoJSON.features;

                $.each(store.geoJSON.features, function (i, v) {

                    featuresWithKeys[v.properties.id] = v.properties;
                    featuresWithKeys[v.properties.id].geometry = v.geometry;

                });

                // Open POI if any
                if(layerName === "v:punkter.poi") {
                    if (urlVars.poi !== undefined) {

                        var parr = urlVars.poi.split("#");
                        if (parr.length > 1) {
                            parr.pop();
                        }

                        createInfoContent(parr.join());
                    }
                }

            });

            vectorLayers.setOnSelect(layerName, function (id, layer) {

                createInfoContent(layer.feature.properties.id);
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
                    }
                ]
            );

            vectorLayers.setStyle(layerName,
                {
                    weight: 5,
                    color: '#ff0000',
                    dashArray: '',
                    fillOpacity: 0.2
                }
            );

            vectorLayers.setPointToLayer(layerName, function (feature, latlng) {

                    return L.marker(latlng, {
                        icon: L.ExtraMarkers.icon({
                            icon: feature.properties.icon === 1 ? 'fa-eye' :
                                feature.properties.icon === 2 ? 'fa-eye' :
                                    feature.properties.icon === 3 ? 'fa-book' :
                                        feature.properties.icon === 4 ? 'fa-cutlery' :
                                            feature.properties.icon === 5 ? 'fa-bed' : 'fa-question',

                            markerColor: layerName === "v:punkter.poi" || layerName === "v:punkter.natur" ? feature.properties.farve || 'black' :
                                layerName === "v:punkter.spisning" || "v:punkter.overnatning" ? 'white' : 'black',

                            shape: feature.properties.icon === 1 ? 'star' :
                                feature.properties.icon === 2 ? 'circle' :
                                    feature.properties.icon === 3 ? 'square' :
                                        feature.properties.icon === 4 || feature.properties.icon === 5 ? 'circle' : 'circle'
                            ,

                            prefix: 'fa',
                            iconColor: feature.properties.icon === 4 || feature.properties.icon === 5 ? '#777' : "#fff",
                            //innerHTML: '<svg width="20" height="30"> <circle cx="10" cy="15" r="10" stroke="green" stroke-width="1" fill="yellow" /> </svg>'
                        })
                    });
                }
            );
        });

        vectorLayers.setStyle("v:punkter.k0820",
            {
                weight: 3,
                color: '#ff0000',
                opacity: 0.5,
                dashArray: '',
                fillOpacity: 0.0
            }
        );

        backboneEvents.get().on("ready:vectorLayers", function () {
            vectorLayers.switchLayer("v:punkter.poi", true);
            vectorLayers.switchLayer("v:punkter.natur", true);
            vectorLayers.switchLayer("v:punkter.k0820", true);
        });


        try {
            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));
        } catch (e) {
        }

        $("#locale-btn").append($(".leaflet-control-locate"));


        // Remove Youtube video when closing modal
        $('#click-modal').on('hidden.bs.modal', function (e) {
            $(".embed-responsive").empty();
        });

        cloud.get().on("zoomend", function () {
            if (cloud.get().map.getZoom() < 9) {
                cloud.get().map.setZoom(9);
            }
        });
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
            id: id,
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

        return true;
    }
};

var createInfoContent = function (id) {

    featuresWithKeys[id].text = converter.makeHtml(featuresWithKeys[id].tekst);
    featuresWithKeys[id].title = featuresWithKeys[id].titel;
    featuresWithKeys[id].images = featuresWithKeys[id].billeder;

    var html = template1(featuresWithKeys[id]);

    var htmlShare = templateShare(featuresWithKeys[id]);

    $("#click-modal").modal({});
    $("#click-modalLabel").html(featuresWithKeys[id].navn);
    $("#click-modal .modal-body").html(html + htmlShare);


    if (typeof DISQUS === "undefined") {
        var d = document, s = d.createElement("script");
        s.src = "https://vidi-mapcentia-com.disqus.com/embed.js";
        s.setAttribute("data-timestamp", +new Date());
        (d.head || d.body).appendChild(s);
    }

    (function poll() {
        if (typeof DISQUS !== "undefined") {
            DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = "" + id;
                    this.page.url = "https://vidi.mapcentia.com/app/vmus?poi=" + id;
                }
            });
        } else {
            setTimeout(function () {
                poll();
            }, 100)
        }

    })();
};

/**
 * Builds a OSRM Trip URL from array array of GeoJSON point geometries
 * First point is the geolocation
 * @param arr
 * @returns {Promise}
 */
var createOsrmTripUrl = function (arr) {

    tripLayer.clearLayers();
    highLightLayer.clearLayers();

    return new Promise(function (resolve, reject) {


        var coords = arr.map(function (e) {

            var color = e.done ? "#00ff33" : "#ff0033";
            L.circleMarker([e.geometry.coordinates[1], e.geometry.coordinates[0]], {
                fillColor: color,
                fillOpacity: 0.2,
                stroke: false,
                radius: 20,
            }).addTo(highLightLayer);

            L.circleMarker([e.geometry.coordinates[1], e.geometry.coordinates[0]], {
                fillColor: color,
                fillOpacity: 0.4,
                stroke: false,
                radius: 10,
            }).addTo(highLightLayer);


            return e.geometry.coordinates[0] + "," + e.geometry.coordinates[1];
        });

        var coordsR = arr.map(function (e) {

            return e.geometry.coordinates[1] + "," + e.geometry.coordinates[0];

        });


        if ("geolocation" in navigator) {

            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var crd = pos.coords;
                    // Add home marker
                    L.marker([crd.latitude, crd.longitude], {
                        icon: L.AwesomeMarkers.icon({
                                icon: 'home',
                                markerColor: '#C31919',
                                prefix: 'fa'
                            }
                        )
                    }).addTo(tripLayer);

                    console.log('Your current position is:');
                    console.log(`Latitude : ${crd.latitude}`);
                    console.log(`Longitude: ${crd.longitude}`);
                    console.log(`More or less ${crd.accuracy} meters.`);

                    coords.unshift(crd.longitude + "," + crd.latitude);

                    googleUrl = "https://www.google.com/maps/dir/?api=1&origin=" + crd.latitude + "," + crd.longitude + "&destination=" + crd.latitude + "," + crd.longitude + "&waypoints=" + coordsR.join("|");


                    if (coords.length > 1) {


                        resolve(
                            {
                                url: "https://router.project-osrm.org/trip/v1/driving/" + coords.join(";") + "?overview=simplified&steps=false&hints=;&geometries=geojson",
                                googleUrl: googleUrl,
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
                        message: "Geolocation failed"
                    });
                    alert("Kunne ikke finde din position")
                },

                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                },
            );

        } else {

            alert("Ingen lokationsservice i din browser");
            reject({
                code: 1,
                message: "No geolocation in browser"
            });
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

            tripLayer.addData(data.trips[0].geometry);
            resolve({
                message: "Trip added to map"
            })

            ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));


        }).fail(function () {
            reject({
                message: "Trip NOT added to map"
            });
            alert("Kunne ikke hente ruten!");

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
        this.onClickShow = this.onClickShow.bind(this);
    }

    onClickClose() {
        var index = parseInt(this.props.index);
        this.props.removeItem(index);
    }

    onClickDone() {
        var index = parseInt(this.props.index);
        this.props.markTodoDone(index);
    }

    onClickShow() {
        var id = (this.props.item.id);
        createInfoContent(id)
    }

    render() {
        var todoClass = this.props.item.done ?
            "done" : "undone";
        return (
            <li className="list-group-item">
                <div className={todoClass}>
                    <span className="glyphicon glyphicon-ok icon" aria-hidden="true" onClick={this.onClickDone}></span>
                    <span style={{textDecoration: "underline", cursor: "pointer"}}
                          onClick={this.onClickShow}>{this.props.item.value}</span>
                    <button type="button" className="close" onClick={this.onClickClose}>&times;</button>
                </div>
            </li>
        );
    }
}

class TodoHeader extends React.Component {
    render() {
        return <p>Hvis du er interesseret i at besøge en seværdighed, så klik på ikonet med den blå indkøbsvogn, og det
            valgte punkt tilføjes en samlet liste. Vha. Google Maps er det senere muligt at få foreslået en rute rundt
            til de valgte steder. Rigtig god tur!</p>
    }
}

class TodoUpdateRouteBtn extends React.Component {
    constructor(props) {
        super(props);
        this.fullWidth = {
            width: "100%"
        };
    }

    render() {
        return <button className="btn btn-raised btn-default" style={this.fullWidth} onClick={function () {

            createOsrmTripUrl(todoItems)

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
        }}>Opdater den foreslåede rute</button>
    }
}

class TodoGoogleLink extends React.Component {
    render() {
        return <a target="_blank" href={googleUrl} style={{"textDecoration": "underline"}}>Google Maps <i
            className="fa fa-arrow-right" aria-hidden="true"></i></a>
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

    render() {
        return (
            <div id="main">
                <TodoHeader/>
                <TodoUpdateRouteBtn/>
                <TodoList items={this.props.initItems} removeItem={this.removeItem} markTodoDone={this.markTodoDone}/>
                <TodoGoogleLink/>
            </div>
        );
    }
}


