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

var React = require('react');

var ReactDOM = require('react-dom');

var urlparser = require('./../../../browser/modules/urlparser');

var urlVars = urlparser.urlVars;

var todoItems = [];

var source1 =
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-fab-mini" data-todo-id="{{id}}"><i class="material-icons">directions</i></a>' +
    '<h1>{{{titel}}}</h1>' +
    '<div><b>{{{manchet}}}</b></div>' +
    '<div>{{{beskrivelse}}}</div>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '<ol class="carousel-indicators">' +
    '{{#foto_karrusel}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/foto_karrusel}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#foto_karrusel}}' +
    '<div class="item {{#if @first}}active{{/if}}">' +
    '<img style="width: 100%" src="{{.}}" alt="">' +
    '<div class="carousel-caption">' +
    '<p>{{[1]}}</p>' +
    '</div>' +
    '</div>' +
    '{{/foto_karrusel}}' +
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

        var parent = this, layerName = "v:_l_den_gode_tur.interessepunkter";

        vectorLayers.setOnEachFeature(layerName, function (feature, layer) {
            layer.on("click", function () {
                parent.createInfoContent(feature.properties.id);
            });
        });

        vectorLayers.setOnLoad(layerName, function (store) {

            features = store.geoJSON.features;

            if ("geolocation" in navigator) {

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

            }

            $.each(store.geoJSON.features, function (i, v) {

                featuresWithKeys[v.properties.id] = v.properties;

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
                        shape: 'star',
                        // shape: feature.properties.tid === "Vikingetid" ? 'star' :
                        //     feature.properties.tid === "Stenalder" ? 'square' :
                        //         feature.properties.tid === "Middelalder" ? 'penta' :
                        //             feature.properties.tid === "Jernalder" ? 'circle' :
                        //                 'circle'
                        // ,
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

        ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));

        $("#locale-btn").append($(".leaflet-control-locate"));

    },

    createInfoContent: function (id) {

        //featuresWithKeys[id].text1 = converter.makeHtml(featuresWithKeys[id].tekst);
        //featuresWithKeys[id].title = featuresWithKeys[id].titel;
        //featuresWithKeys[id].images = featuresWithKeys[id].billeder;

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

        todoItems.push({index: 3, value: featuresWithKeys[id].titel, done: false});

        ReactDOM.render(<TodoApp initItems={todoItems}/>, document.getElementById('app'));

        return true;
    }
};

/*
 Todo app structure

 TodoApp
 - TodoHeader
 - TodoList
 - TodoListItem #1
 - TodoListItem #2
 ...
 - TodoListItem #N
 - TodoForm
 */


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

class TodoForm extends React.Component {
    constructor(props) {
        super(props);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        this.refs.itemName.focus();
    }

    onSubmit(event) {
        event.preventDefault();
        var newItemValue = this.refs.itemName.value;

        if (newItemValue) {
            this.props.addItem({newItemValue});
            this.refs.form.reset();
        }
    }

    render() {
        return (
            <form ref="form" onSubmit={this.onSubmit} className="form-inline">
                <input type="text" ref="itemName" className="form-control" placeholder="add a new todo..."/>
                <button type="submit" className="btn btn-default">Add</button>
            </form>
        );
    }
}

class TodoHeader extends React.Component {
    render() {
        return <p>Hvis du er interesseret i at besøge en seværdig, så klik i info-vinduet på <i className="material-icons inherit-size">directions</i> knappen. Så kommer seværdigen på listen. Kortet vil foreslå en rute du kan tage rundt til de forskellige seværdiger. God tur!</p>
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


