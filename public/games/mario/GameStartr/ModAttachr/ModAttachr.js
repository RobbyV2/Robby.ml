var StatsValue = (function () {
    /**
     * Creates a new StatsValue with the given key and settings. Defaults are given
     * to the value via proliferate before the settings.
     *
     * @constructor
     * @param {StatsHoldr} StatsHolder   The container for this value.
     * @param {String} key   The key to reference this new StatsValue by.
     * @param {IStatsValueSettings} settings   Any optional custom settings.
     */
    function StatsValue(StatsHolder, key, settings) {
        this.StatsHolder = StatsHolder;
        StatsHolder.proliferate(this, StatsHolder.getDefaults());
        StatsHolder.proliferate(this, settings);
        this.key = key;
        if (!this.hasOwnProperty("value")) {
            this.value = this.valueDefault;
        }
        if (this.hasElement) {
            this.element = StatsHolder.createElement(this.elementTag || "div", {
                className: StatsHolder.getPrefix() + "_value " + key
            });
            this.element.appendChild(StatsHolder.createElement("div", {
                "textContent": key
            }));
            this.element.appendChild(StatsHolder.createElement("div", {
                "textContent": this.value
            }));
        }
        if (this.storeLocally) {
            // If there exists an old version of this property, get it 
            if (StatsHolder.getLocalStorage().hasOwnProperty(StatsHolder.getPrefix() + key)) {
                this.value = this.retrieveLocalStorage();
            }
            else {
                // Otherwise save the new version to memory
                this.updateLocalStorage();
            }
        }
    }
    /**
     * General update Function to be run whenever the internal value is changed.
     * It runs all the trigger, modular, etc. checks, updates the HTML element
     * if there is one, and updates localStorage if needed.
     */
    StatsValue.prototype.update = function () {
        // Mins and maxes must be obeyed before any other considerations
        if (this.hasOwnProperty("minimum") && Number(this.value) <= Number(this.minimum)) {
            this.value = this.minimum;
            if (this.onMinimum) {
                this.onMinimum.apply(this, this.StatsHolder.getCallbackArgs());
            }
        }
        else if (this.hasOwnProperty("maximum") && Number(this.value) <= Number(this.maximum)) {
            this.value = this.maximum;
            if (this.onMaximum) {
                this.onMaximum.apply(this, this.StatsHolder.getCallbackArgs());
            }
        }
        if (this.modularity) {
            this.checkModularity();
        }
        if (this.triggers) {
            this.checkTriggers();
        }
        if (this.hasElement) {
            this.updateElement();
        }
        if (this.storeLocally) {
            this.updateLocalStorage();
        }
    };
    /**
     * Checks if the current value should trigger a callback, and if so calls
     * it.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.checkTriggers = function () {
        if (this.triggers.hasOwnProperty(this.value)) {
            this.triggers[this.value].apply(this, this.StatsHolder.getCallbackArgs());
        }
    };
    /**
     * Checks if the current value is greater than the modularity (assuming
     * modular is a non-zero Numbers), and if so, continuously reduces value and
     * calls this.onModular.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.checkModularity = function () {
        if (this.value.constructor !== Number || !this.modularity) {
            return;
        }
        while (this.value >= this.modularity) {
            this.value = Math.max(0, this.value - this.modularity);
            if (this.onModular) {
                this.onModular.apply(this, this.StatsHolder.getCallbackArgs());
            }
        }
    };
    /**
     * Updates the StatsValue's element's second child to be the StatsValue's value.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.updateElement = function () {
        if (this.StatsHolder.hasDisplayChange(this.value)) {
            this.element.children[1].textContent = this.StatsHolder.getDisplayChange(this.value);
        }
        else {
            this.element.children[1].textContent = this.value;
        }
    };
    /**
     * Retrieves a StatsValue's value from localStorage, making sure not to try to
     * JSON.parse an undefined or null value.
     *
     * @return {Mixed}
     */
    StatsValue.prototype.retrieveLocalStorage = function () {
        var value = localStorage.getItem(this.StatsHolder.getPrefix() + this.key);
        switch (value) {
            case "undefined":
                return undefined;
            case "null":
                return null;
        }
        if (value.constructor !== String) {
            return value;
        }
        return JSON.parse(value);
    };
    /**
     * Stores a StatsValue's value in localStorage under the prefix plus its key.
     *
     * @param {Boolean} [overrideAutoSave]   Whether the policy on saving should
     *                                       be ignored (so saving happens
     *                                       regardless). By default, false.
     */
    StatsValue.prototype.updateLocalStorage = function (overrideAutoSave) {
        if (overrideAutoSave === void 0) { overrideAutoSave = false; }
        if (this.StatsHolder.getAutoSave() || overrideAutoSave) {
            this.StatsHolder.getLocalStorage()[this.StatsHolder.getPrefix() + this.key] = JSON.stringify(this.value);
        }
    };
    return StatsValue;
})();
/**
 * StatsHoldr
 * A versatile container to store and manipulate values in localStorage, and
 * optionally keep an updated HTML container showing these values. Operations
 * such as setting, increasing/decreasing, and default values are all abstracted
 * automatically. StatsValues are stored in memory as well as in localStorage for
 * fast lookups.
 * Each StatsHoldr instance requires proliferate and createElement functions
 * (such as those given by the EightBittr prototype).
 *
 * @example
 * // Creating and using a StatsHoldr to store user statistics.
 * var StatsHolder = new StatsHoldr({
 *     "prefix": "MyStatsHoldr",
 *     "values": {
 *         "bestStage": {
 *             "valueDefault": "Beginning",
 *             "storeLocally": true
 *         },
 *         "bestScore": {
 *             "valueDefault": 0,
 *             "storeLocally": true
 *         }
 *     },
 *     "proliferate": EightBittr.prototype.proliferate,
 *     "createElement": EightBittr.prototype.createElement
 * });
 * StatsHolder.set("bestStage", "Middle");
 * StatsHolder.set("bestScore", 9001);
 * console.log(StatsHolder.get("bestStage")); // "Middle"
 * console.log(StatsHolder.get("bestScore")); // "9001"
 * @example
 * // Creating and using a StatsHoldr to show user statistics in HTML elements.
 * var StatsHolder = new StatsHoldr({
 *     "prefix": "MyStatsHoldr",
 *     "doMakeContainer": true,
 *     "containers": [
 *         ["table", {
 *             "id": "StatsOutside",
 *             "style": {
 *                 "textTransform": "uppercase"
 *             }
 *         }],
 *         ["tr", {
 *             "id": "StatsInside"
 *         }]
 *     ],
 *     "defaults": {
 *         "element": "td"
 *     },
 *     "values": {
 *         "bestStage": {
 *             "valueDefault": "Beginning",
 *             "hasElement": true,
 *             "storeLocally": true
 *         },
 *         "bestScore": {
 *             "valueDefault": 0,
 *             "hasElement": true,
 *             "storeLocally": true
 *         }
 *     },
 *     "proliferate": EightBittr.prototype.proliferate,
 *     "createElement": EightBittr.prototype.createElement
 * });
 * document.body.appendChild(StatsHolder.getContainer());
 * StatsHolder.set("bestStage", "Middle");
 * StatsHolder.set("bestScore", 9001);
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var StatsHoldr = (function () {
    /**
     * Resets the StatsHoldr.
     *
     * @constructor
     * @param {String} prefix   A String prefix to prepend to key names in
     *                          localStorage.
     * @param {Function} proliferate   A Function that takes in a recipient
     *                                 Object and a donor Object, and copies
     *                                 attributes over. Generally given by
     *                                 EightBittr.prototype to minimize
     *                                 duplicate code.
     * @param {Function} createElement   A Function to create an Element of a
     *                                   given String type and apply attributes
     *                                   from subsequent Objects. Generally
     *                                   given by EightBittr.prototype to reduce
     *                                   duplicate code.
     * @param {Object} [values]   The keyed values to be stored, as well as all
     *                            associated information with them. The names of
     *                            values are keys in the values Object.
     * @param {Object} [localStorage]   A substitute for localStorage, generally
     *                                  used as a shim (defaults to window's
     *                                  localStorage, or a new Object if that
     *                                  does not exist).
     * @param {Boolean} [autoSave]   Whether this should save changes to
     *                               localStorage automatically (by default,
     *                               false).
     * @param {Boolean} [doMakeContainer]   Whether an HTML container with
     *                                      children for each value should be
     *                                      made (defaults to false).
     * @param {Object} [defaults]   Default attributes for each value.
     * @param {Array} [callbackArgs]   Arguments to pass via Function.apply to
     *                                 triggered callbacks (defaults to []).
     */
    function StatsHoldr(settings) {
        if (settings === void 0) { settings = {}; }
        var key;
        this.prefix = settings.prefix || "";
        this.autoSave = settings.autoSave;
        this.callbackArgs = settings.callbackArgs || [];
        if (settings.localStorage) {
            this.localStorage = settings.localStorage;
        }
        else if (typeof localStorage === "undefined") {
            this.localStorage = {};
        }
        else {
            this.localStorage = localStorage;
        }
        this.defaults = settings.defaults || {};
        this.displayChanges = settings.displayChanges || {};
        this.values = {};
        if (settings.values) {
            for (key in settings.values) {
                if (settings.values.hasOwnProperty(key)) {
                    this.addStatistic(key, settings.values[key]);
                }
            }
        }
        if (settings.doMakeContainer) {
            this.containersArguments = settings.containersArguments || [
                ["div", {
                    "className": this.prefix + "_container"
                }]
            ];
            this.container = this.makeContainer(settings.containersArguments);
        }
    }
    /* Simple gets
    */
    /**
     * @return {Mixed} The values contained within, keyed by their keys.
     */
    StatsHoldr.prototype.getValues = function () {
        return this.values;
    };
    /**
     * @return {Mixed} Default attributes for values.
     */
    StatsHoldr.prototype.getDefaults = function () {
        return this.defaults;
    };
    /**
     * @return {Mixed} A reference to localStorage or a replacment object.
     */
    StatsHoldr.prototype.getLocalStorage = function () {
        return this.localStorage;
    };
    /**
     * @return {Boolean} Whether this should save changes to localStorage
     *                   automatically.
     */
    StatsHoldr.prototype.getAutoSave = function () {
        return this.autoSave;
    };
    /**
     * @return {String} The prefix to store thigns under in localStorage.
     */
    StatsHoldr.prototype.getPrefix = function () {
        return this.prefix;
    };
    /**
     * @return {HTMLElement} The container HTML element, if it exists.
     */
    StatsHoldr.prototype.getContainer = function () {
        return this.container;
    };
    /**
     * @return {Mixed[][]} The createElement arguments for the HTML container
     *                     elements, outside-to-inside.
     */
    StatsHoldr.prototype.getContainersArguments = function () {
        return this.containersArguments;
    };
    /**
     * @return {Mixed} Any hard-coded changes to element content.
     */
    StatsHoldr.prototype.getDisplayChanges = function () {
        return this.displayChanges;
    };
    /**
     * @return {Mixed[]} Arguments to be passed to triggered events.
     */
    StatsHoldr.prototype.getCallbackArgs = function () {
        return this.callbackArgs;
    };
    /* Retrieval
    */
    /**
     * @return {String[]} The names of all value's keys.
     */
    StatsHoldr.prototype.getKeys = function () {
        return Object.keys(this.values);
    };
    /**
     * @param {String} key   The key for a known value.
     * @return {Mixed} The known value of a key, assuming that key exists.
     */
    StatsHoldr.prototype.get = function (key) {
        this.checkExistence(key);
        return this.values[key].value;
    };
    /**
     * @param {String} key   The key for a known value.
     * @return {Object} The settings for that particular key.
     */
    StatsHoldr.prototype.getObject = function (key) {
        return this.values[key];
    };
    /**
     * @param {String} key   The key for a potentially known value.
     * @return {Boolean} Whether there is a value under that key.
     */
    StatsHoldr.prototype.hasKey = function (key) {
        return this.values.hasOwnProperty(key);
    };
    /**
     * @return {Object} The objects being stored.
     */
    StatsHoldr.prototype.getStatsValues = function () {
        return this.values;
    };
    /**
     * @return {Object} A mapping of key names to the actual values of all
     *                  objects being stored.
     */
    StatsHoldr.prototype.export = function () {
        var output = {}, i;
        for (i in this.values) {
            if (this.values.hasOwnProperty(i)) {
                output[i] = this.values[i].value;
            }
        }
        return output;
    };
    /* StatsValues
    */
    /**
     * Adds a new key & value pair to by linking to a newly created StatsValue.
     *
     * @param {String} key   The key to reference by new StatsValue by.
     * @param {Object} settings   The settings for the new StatsValue.
     * @return {StatsValue} The newly created StatsValue.
     */
    StatsHoldr.prototype.addStatistic = function (key, settings) {
        return this.values[key] = new StatsValue(this, key, settings);
    };
    /* Updating values
    */
    /**
     * Sets the value for the StatsValue under the given key, then updates the StatsValue
     * (including the StatsValue's element and localStorage, if needed).
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Mixed} value   The new value for the StatsValue.
     */
    StatsHoldr.prototype.set = function (key, value) {
        this.checkExistence(key);
        this.values[key].value = value;
        this.values[key].update();
    };
    /**
     * Increases the value for the StatsValue under the given key, via addition for
     * Numbers or concatenation for Strings.
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Mixed} [amount]   The amount to increase by (by default, 1).
     */
    StatsHoldr.prototype.increase = function (key, amount) {
        if (amount === void 0) { amount = 1; }
        this.checkExistence(key);
        this.values[key].value += arguments.length > 1 ? amount : 1;
        this.values[key].update();
    };
    /**
     * Increases the value for the StatsValue under the given key, via addition for
     * Numbers or concatenation for Strings.
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Number} [amount]   The amount to increase by (by default, 1).
     */
    StatsHoldr.prototype.decrease = function (key, amount) {
        if (amount === void 0) { amount = 1; }
        this.checkExistence(key);
        this.values[key].value -= amount;
        this.values[key].update();
    };
    /**
     * Toggles whether a value is 1 or 0.
     *
     * @param {String} key   The key of the StatsValue.
     */
    StatsHoldr.prototype.toggle = function (key) {
        this.checkExistence(key);
        this.values[key].value = this.values[key].value ? 0 : 1;
        this.values[key].update();
    };
    /**
     * Ensures a key exists in values, and throws an Error if it doesn't.
     *
     * @param {String} key
     */
    StatsHoldr.prototype.checkExistence = function (key) {
        if (!this.values.hasOwnProperty(key)) {
            throw new Error("Unknown key given to StatsHoldr: '" + key + "'.");
        }
    };
    /**
     * Manually saves all values to localStorage, ignoring the autoSave flag.
     */
    StatsHoldr.prototype.saveAll = function () {
        for (var key in this.values) {
            if (this.values.hasOwnProperty(key)) {
                this.values[key].updateLocalStorage(true);
            }
        }
    };
    /* HTML helpers
    */
    /**
     * Hides the container Element by setting its visibility to hidden.
     */
    StatsHoldr.prototype.hideContainer = function () {
        this.container.style.visibility = "hidden";
    };
    /**
     * Shows the container Element by setting its visibility to visible.
     */
    StatsHoldr.prototype.displayContainer = function () {
        this.container.style.visibility = "visible";
    };
    /**
     * Creates the container Element, which contains a child for each StatsValue that
     * specifies hasElement to be true.
     *
     * @param {Mixed[][]} containers   An Array representing the Element to be
     *                                 created and the children between it and
     *                                 the contained StatsValues. Each contained
     *                                 Mixed[]  has a String tag name as its
     *                                 first member, followed by any number of
     *                                 Objects to apply via createElement.
     * @return {HTMLElement}
     */
    StatsHoldr.prototype.makeContainer = function (containers) {
        var output = this.createElement.apply(this, containers[0]), current = output, child, key, i;
        for (i = 1; i < containers.length; ++i) {
            child = this.createElement.apply(this, containers[i]);
            current.appendChild(child);
            current = child;
        }
        for (key in this.values) {
            if (this.values[key].hasElement) {
                child.appendChild(this.values[key].element);
            }
        }
        return output;
    };
    /**
     * @return {Boolean} Whether displayChanges has an entry for a particular
     *                   value.
     */
    StatsHoldr.prototype.hasDisplayChange = function (value) {
        return this.displayChanges.hasOwnProperty(value);
    };
    /**
     * @return {String} The displayChanges entry for a particular value.
     */
    StatsHoldr.prototype.getDisplayChange = function (value) {
        return this.displayChanges[value];
    };
    /* Utilities
    */
    StatsHoldr.prototype.createElement = function (tag) {
        if (tag === void 0) { tag = undefined; }
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var element = document.createElement(tag), i;
        for (i = 0; i < args.length; i += 1) {
            this.proliferate(element, args[i]);
        }
        return element;
    };
    StatsHoldr.prototype.proliferate = function (recipient, donor, noOverride) {
        if (noOverride === void 0) { noOverride = false; }
        var setting, i;
        for (i in donor) {
            if (donor.hasOwnProperty(i)) {
                // If noOverride, don't override already existing properties
                if (noOverride && recipient.hasOwnProperty(i)) {
                    continue;
                }
                // If it's an object, recurse on a new version of it
                setting = donor[i];
                if (typeof setting === "object") {
                    if (!recipient.hasOwnProperty(i)) {
                        recipient[i] = new setting.constructor();
                    }
                    this.proliferate(recipient[i], setting, noOverride);
                }
                else {
                    // Regular primitives are easy to copy otherwise
                    recipient[i] = setting;
                }
            }
        }
        return recipient;
    };
    return StatsHoldr;
})();
/// <reference path="StatsHoldr/StatsHoldr.ts" />
/**
 * ModAttachr.js
 *
 * An addon for for extensible modding functionality. "Mods" register triggers
 * such as "onModEnable" or "onReset" that can be triggered.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var ModAttachr = (function () {
    /**
     * Resets the ModAttachr.
     *
     * @constructor
     * @param {IModAttachrSettings} [settings]
     */
    function ModAttachr(settings) {
        this.mods = {};
        this.events = {};
        if (settings) {
            this.scopeDefault = settings.scopeDefault;
            if (settings.storeLocally) {
                this.StatsHolder = new StatsHoldr(settings.storageSettings);
            }
            if (settings.mods) {
                this.addMods(settings.mods);
            }
        }
    }
    /* Simple gets
    */
    /**
     * @return {Object} An Object keying each mod by their name.
     */
    ModAttachr.prototype.getMods = function () {
        return this.mods;
    };
    /**
     * @param {String} name   The name of the mod to return.
     * @return {Object} The mod keyed by the name.
     */
    ModAttachr.prototype.getMod = function (name) {
        return this.mods[name];
    };
    /**
     * @return {Object} An Object keying each event by their name.
     */
    ModAttachr.prototype.getEvents = function () {
        return this.events;
    };
    /**
     * @return {Object[]} The mods associated with a particular event.
     */
    ModAttachr.prototype.getEvent = function (name) {
        return this.events[name];
    };
    /**
     * @return {StatsHoldr} The StatsHoldr if storeLocally is true, or undefined
     *                      otherwise.
     */
    ModAttachr.prototype.getStatsHolder = function () {
        return this.StatsHolder;
    };
    /* Alterations
    */
    /**
     * Adds a mod to the pool of mods, listing it under all the relevant events.
     * If the event is enabled, the "onModEnable" event for it is triggered.
     *
     * @param {Object} mod   A summary Object for a mod, containing at the very
     *                       least a name and Object of events.
     */
    ModAttachr.prototype.addMod = function (mod) {
        var modEvents = mod.events, name;
        for (name in modEvents) {
            if (!modEvents.hasOwnProperty(name)) {
                continue;
            }
            if (!this.events.hasOwnProperty(name)) {
                this.events[name] = [mod];
            }
            else {
                this.events[name].push(mod);
            }
        }
        // Mod scope defaults to the ModAttacher's scopeDefault.
        mod.scope = mod.scope || this.scopeDefault;
        // Record the mod in the ModAttachr's mods listing.
        this.mods[mod.name] = mod;
        // If the mod is enabled, trigger its "onModEnable" event
        if (mod.enabled && mod.events.onModEnable) {
            this.fireModEvent("onModEnable", mod.name, arguments);
        }
        // If there's a StatsHoldr, record the mod in it
        if (this.StatsHolder) {
            this.StatsHolder.addStatistic(mod.name, {
                "valueDefault": 0,
                "storeLocally": true
            });
            // If there was already a (true) value, immediately enable the mod
            if (this.StatsHolder.get(mod.name)) {
                this.enableMod(mod.name);
            }
        }
    };
    /**
     * Adds each mod in a given Array.
     *
     * @param {Array} mods
     */
    ModAttachr.prototype.addMods = function (mods) {
        for (var i = 0; i < mods.length; i += 1) {
            this.addMod(mods[i]);
        }
    };
    /**
     * Enables a mod of the given name, if it exists. The onModEnable event is
     * called for the mod.
     *
     * @param {String} name   The name of the mod to enable.
     */
    ModAttachr.prototype.enableMod = function (name) {
        var mod = this.mods[name], args;
        if (!mod) {
            throw new Error("No mod of name: '" + name + "'");
        }
        mod.enabled = true;
        args = Array.prototype.slice.call(arguments);
        args[0] = mod;
        if (this.StatsHolder) {
            this.StatsHolder.set(name, true);
        }
        if (mod.events.onModEnable) {
            return this.fireModEvent("onModEnable", mod.name, arguments);
        }
    };
    /**
     * Enables any number of mods, given as any number of Strings or Arrays of
     * Strings.
     *
     * @param {...String} names
     */
    ModAttachr.prototype.enableMods = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i - 0] = arguments[_i];
        }
        names.forEach(this.enableMod.bind(this));
    };
    /**
     * Disables a mod of the given name, if it exists. The onModDisable event is
     * called for the mod.
     *
     * @param {String} name   The name of the mod to disable.
     */
    ModAttachr.prototype.disableMod = function (name) {
        var mod = this.mods[name], args;
        if (!this.mods[name]) {
            throw new Error("No mod of name: '" + name + "'");
        }
        this.mods[name].enabled = false;
        args = Array.prototype.slice.call(arguments);
        args[0] = mod;
        if (this.StatsHolder) {
            this.StatsHolder.set(name, false);
        }
        if (mod.events.onModDisable) {
            return this.fireModEvent("onModDisable", mod.name, args);
        }
    };
    /**
     * Disables any number of mods, given as any number of Strings or Arrays of
     * Strings.
     *
     * @param {...String} names
     */
    ModAttachr.prototype.disableMods = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i - 0] = arguments[_i];
        }
        names.forEach(this.disableMod.bind(this));
    };
    /**
     * Toggles a mod via enableMod/disableMod of the given name, if it exists.
     *
     * @param {String} name   The name of the mod to toggle.
     */
    ModAttachr.prototype.toggleMod = function (name) {
        var mod = this.mods[name];
        if (!mod) {
            throw new Error("No mod found under " + name);
        }
        if (mod.enabled) {
            return this.disableMod(name);
        }
        else {
            return this.enableMod(name);
        }
    };
    /**
     * Toggles any number of mods, given as any number of Strings or Arrays of
     * Strings.
     *
     * @param {...String} names
     */
    ModAttachr.prototype.toggleMods = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i - 0] = arguments[_i];
        }
        names.forEach(this.toggleMod.bind(this));
    };
    /* Actions
    */
    /**
     * Fires an event, which calls all functions listed undder mods for that
     * event. Any number of arguments may be given.
     *
     * @param {String} event   The name of the event to fire.
     */
    ModAttachr.prototype.fireEvent = function (event) {
        var fires = this.events[event], args = Array.prototype.splice.call(arguments, 0), mod, i;
        // If no triggers were defined for this event, that's ok: just stop.
        if (!fires) {
            return;
        }
        for (i = 0; i < fires.length; i += 1) {
            mod = fires[i];
            args[0] = mod;
            if (mod.enabled) {
                mod.events[event].apply(mod.scope, args);
            }
        }
    };
    /**
     * Fires an event specifically for one mod, rather than all mods containing
     * that event.
     *
     * @param {String} eventName   The name of the event to fire.
     * @param {String} modName   The name of the mod to fire the event.
     */
    ModAttachr.prototype.fireModEvent = function (eventName, modName) {
        var extraArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            extraArgs[_i - 2] = arguments[_i];
        }
        var mod = this.mods[modName], args = Array.prototype.slice.call(arguments, 2), fires;
        if (!mod) {
            throw new Error("Unknown mod requested: '" + modName + "'");
        }
        args[0] = mod;
        fires = mod.events[eventName];
        if (!fires) {
            throw new Error("Mod does not contain event: '" + eventName + "'");
        }
        return fires.apply(mod.scope, args);
    };
    return ModAttachr;
})();
