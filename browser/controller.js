/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';


/**
 *
 */
var backboneEvents;

var highlights;

var jquery = require('jquery');
require('snackbarjs');


/**
 *
 * @returns {*}
 */
module.exports = {
    set: function (o) {
        backboneEvents = o.backboneEvents;
        highlights = o.extensions.highlights.index;
        return this;
    },
    init: function () {
        $("#btn-kort").on("click", function (e) {
            $("#map").fadeIn(200);
            $("#list").fadeOut(200);
            $("#btn-kort").addClass("active");
            $("#btn-list").removeClass("active");
        });
        $("#btn-list").on("click", function (e) {
            $("#map").fadeOut(200);
            $("#list").fadeIn(200);
            $("#btn-list").addClass("active");
            $("#btn-kort").removeClass("active");
        });

        $("#btn-list-dis").on("click", function (e) {
            if ($("#btn-list-dis").hasClass("disabled")) {
                return;
            }
            highlights.renderListWithDistance();
            $("#btn-list-dis").addClass("active");
            $("#btn-list-alpha").removeClass("active");
        });

        $("#btn-list-alpha").on("click", function (e) {
            highlights.renderListWithoutDistance();
            $("#btn-list-alpha").addClass("active");
            $("#btn-list-dis").removeClass("active");
        });

        $("#burger-btn").on("click", function () {
            $("#info-modal.slide-left").animate({
                left: "0"
            }, 500)
        });

        $("#info-modal.slide-left .close").on("click", function () {
            $("#info-modal.slide-left").animate({
                left: "-100%"
            }, 500)
        });

        $("#info-modal-top.slide-left .close").on("click", function () {
            $("#info-modal-top.slide-left").animate({
                left: "-100%"
            }, 500)
        });

        $("#todo-btn").on("click", function () {
            $("#todo-list-modal").modal({});
        });



        $(document).arrive('.btn-share', function () {
            $(this).on("click", function (e) {
                var site = $(this).data('some-site'),
                    id = $(this).data('poi-id'),
                    hashTag = "#naturparklillebælt",
                    url = removeParam("poi", window.location.href).replace("?", "") + "?poi=" + id;

                switch (site) {
                    case "facebook":
                        window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&t=" + hashTag, '_blank', 'location=yes,height=300,width=520,scrollbars=yes,status=yes');
                        break;
                    case "twitter":
                        window.open("https://twitter.com/share?url=" + encodeURIComponent(url) + "&text=" + hashTag, '_blank', 'location=yes,height=300,width=520,scrollbars=yes,status=yes');
                        break;
                }
            });
        });

        $(document).arrive('[data-todo-id]', function () {

            $(this).on("click", function (e) {

                var id = $(this).data('todo-id');

                if (highlights.updateTodo(id, true)) {
                    jquery.snackbar({id: "snackbar", content: "<span>" + __("Seværdigheden er tilføjet din 'Skal Se' liste") + "</span>", htmlAllowed: true, timeout: 2000});
                    e.stopPropagation();
                }

            });
        });
    }
};

var removeParam = function (key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
        param,
        params_arr = [],
        hash = sourceURL.split("#")[1],
        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
        params_arr = queryString.split("&");
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        rtn = rtn + "?" + params_arr.join("&") + (hash ? "#" + hash : "");
    }
    return rtn;
};