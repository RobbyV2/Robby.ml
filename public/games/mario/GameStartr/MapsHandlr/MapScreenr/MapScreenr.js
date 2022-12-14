/**
 * MapScreenr.js
 *
 * A simple container for Map attributes given by switching to an Area within
 * that map. A bounding box of the current viewport is kept, along with any
 * other information desired.
 *
 * MapScreenr is the closest thing GameStartr projects have to a "global"
 * variable depository, where miscellaneous variables may be stored.
 *
 * @example
 * // Creating and using a MapScreenr to emulate a simple screen.
 * var MapScreener = new MapScreenr({
 *     "width": 640,
 *     "height": 480
 * });
 * MapScreener.clearScreen();
 *
 * // [0, 640, 480, 0]
 * console.log([
 *     MapScreener.top, MapScreener.right, MapScreener.bottom, MapScreener.left
 * ]);
 *
 * @example
 * // Creating and using a MapScreenr to store screen information.
 * var MapScreener = new MapScreenr({
 *     "width": 640,
 *     "height": 480,
 *     "variables": {
 *         "pixels": function () {
 *             return this.width * this.height;
 *         },
 *         "resolution": function () {
 *             return this.width / this.height;
 *         }
 *     }
 * });
 * MapScreener.clearScreen();
 *
 * // 307200 "pixels at" 1.3333333333333333
 * console.log(MapScreener.pixels, "pixels at", MapScreener.resolution);
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var MapScreenr = (function () {
    /**
     * Resets the MapScreenr. All members of the settings argument are copied
     * to the MapScreenr itself, though only width and height are required.
     */
    function MapScreenr(settings) {
        var name;
        if (typeof settings.width === "undefined") {
            throw new Error("No width given to MapScreenr.");
        }
        if (typeof settings.height === "undefined") {
            throw new Error("No height given to MapScreenr.");
        }
        for (name in settings) {
            if (settings.hasOwnProperty(name)) {
                this[name] = settings[name];
            }
        }
        this.variables = settings.variables || {};
        this.variableArgs = settings.variableArgs || [];
    }
    /* State changes
    */
    /**
     * Completely clears the MapScreenr for use in a new Area. Positioning is
     * reset to (0,0) and user-configured variables are recalculated.
     */
    MapScreenr.prototype.clearScreen = function () {
        this.left = 0;
        this.top = 0;
        this.right = this.width;
        this.bottom = this.height;
        this.setMiddleX();
        this.setMiddleY();
        this.setVariables();
    };
    /**
     * Computes middleX as the midpoint between left and right.
     */
    MapScreenr.prototype.setMiddleX = function () {
        this.middleX = (this.left + this.right) / 2;
    };
    /**
     * Computes middleY as the midpoint between top and bottom.
     */
    MapScreenr.prototype.setMiddleY = function () {
        this.middleY = (this.top + this.bottom) / 2;
    };
    /**
     * Runs all variable Functions with variableArgs to recalculate their
     * values.
     */
    MapScreenr.prototype.setVariables = function () {
        for (var i in this.variables) {
            if (this.variables.hasOwnProperty(i)) {
                this[i] = this.variables[i].apply(this, this.variableArgs);
            }
        }
    };
    /* Element shifting
    */
    /**
     * Shifts the MapScreenr horizontally and vertically via shiftX and shiftY.
     *
     * @param {Number} dx
     * @param {Number} dy
     */
    MapScreenr.prototype.shift = function (dx, dy) {
        if (dx) {
            this.shiftX(dx);
        }
        if (dy) {
            this.shiftY(dy);
        }
    };
    /**
     * Shifts the MapScreenr horizontally by changing left and right by the dx.
     *
     * @param {Number} dx
     */
    MapScreenr.prototype.shiftX = function (dx) {
        this.left += dx;
        this.right += dx;
    };
    /**
     * Shifts the MapScreenr vertically by changing top and bottom by the dy.
     *
     * @param {Number} dy
     */
    MapScreenr.prototype.shiftY = function (dy) {
        this.top += dy;
        this.bottom += dy;
    };
    return MapScreenr;
})();
