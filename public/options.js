var myOptions = (function () {
    var opts = {};  // Options map.

    var scheduleFadeSettingsIcon_ = function () {
        setTimeout(function () {
            $('#settingsIcon').fadeTo('slow', 0.3);
        }, 10000);
    }

    var showConditionalRatingLink_ = function () {
        if (myUtils.isAndroid() && false) {  // TODO - this part doesn't work in web app mode.
            $('#androidRating').css('display', 'block');
        }
    }

    // Registers handlers to save options when DOM values are changed by the user.
    // MUST call this for options changes to be saved.
    // Optional callback function is called after settings are saved.
    var initSaveOptions_ = function (onSavedCallback) {
        $('.option input').each(function () {
            // Register save handled when the dom option value changes.
            $(this).change({ savedCallback: onSavedCallback }, saveOptions_);
        });
    };

    // Persist all dom options to global options var and to localStorage.
    // eventData contains onSavedCallback optional callback.
    var saveOptions_ = function (e) {
        console.log('Saving options...');
        // Read values from dom elements into global options object.
        $('.option input').each(function () {
            const input = this;
            const inputId = $(input).prop('id');
            if ($(input).prop('type') == 'checkbox') {
                opts[inputId] = $(input).prop("checked");
            } else {
                opts[inputId] = $(input).val();
            }
        });
        // Store the updated global options back to localStorage.
        window.localStorage.setItem('options', JSON.stringify(opts));
        console.log('Persisted options to localStorage:');
        console.log(opts);

        if (e.data && e.data.savedCallback) {
            e.data.savedCallback();
        }
    }

    return {
        // Load options from localStorage if present, otherwise use default values.
        // Register change listener to persist state when user changes them.
        // Optional callback function is called after settings are saved.
        loadOptions: function (onSavedCallback) {
            // Register event listeners for showing/hiding options.
            document.getElementById('settingsCloseIcon').onclick = function () {
                document.getElementById('settings').style.display = 'none';
                document.getElementById('settingsIcon').style.display = 'block';
                document.getElementById('settingsCloseIcon').style.display = 'none';
            };
            document.getElementById('settingsIcon').onclick = function () {
                document.getElementById('settings').style.display = 'block';
                document.getElementById('settingsIcon').style.display = 'none';
                document.getElementById('settingsCloseIcon').style.display = 'block';
            };

            // Load options from local storage if possible, otherwise init as empty object.
            if (window.localStorage.getItem('options')) {
                opts = JSON.parse(window.localStorage.getItem('options') || '{}');
            }

            console.log('Loaded options from local storage:');
            console.log(opts);

            // Go through option input elements and set their state either to what
            // was loaded from localStorage option, or otherwise the default value.
            // Sync the options global var and localStorage with the element states.
            $('.option input').each(function () {
                const input = this;
                const inputId = $(input).prop('id');
                console.log('Reading value from input:');
                console.log(input);

                if ($(input).prop('type') == 'checkbox') {
                    if (inputId in opts) {
                        console.log("Found localStorage value: " + !!opts[inputId]);
                        $(input).prop("checked", !!opts[inputId]);
                    } else {
                        console.log("No localStorage value, using default: " + $(input).data("default"));
                        $(input).prop("checked", $(input).data("default"));
                        opts[inputId] = $(input).data("default");
                    }
                } else {
                    if (inputId in opts) {
                        $(input).val(opts[inputId]);
                    } else {
                        $(input).val($(input).data("default"));
                        opts[inputId] = $(input).val();
                    }
                }

                // Register save handled when the dom option value changes.
                $(input).change(saveOptions_);
            });

            // Initialize color-picker plugin.
            $('.colorPicker').spectrum({
                showPaletteOnly: true,
                showPalette: true,
                hideAfterPaletteSelect: true,
                palette: [
                    ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231'],
                    ['#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabebe'],
                    ['#469990', '#e6beff', '#9A6324', '#fffac8', '#800000'],
                    ['#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'],
                    ['#000000', '#222222', '#777777', '#dddddd', '#ffffff'],
                ]
            });

            // Initialize rangeslider plugin.
            $('.range').rangeslider({
                polyfill: false,
                onInit: function () {
                    var slider = $(this)[0];
                    var valueselector = slider.$element[0].dataset.valueselector;
                    if (valueselector) {
                        $(valueselector).text(slider.value);
                    }
                },
                onSlide: function () {
                    var slider = $(this)[0];
                    var valueselector = slider.$element[0].dataset.valueselector;
                    if (valueselector) {
                        $(valueselector).text(slider.value);
                    }
                }
            });

            // Store the updated options back to localStorage
            window.localStorage.setItem('options', JSON.stringify(opts));
            console.log('Persisted options to localStorage:');
            console.log(opts);

            scheduleFadeSettingsIcon_();
            showConditionalRatingLink_();
            initSaveOptions_(onSavedCallback);

            return opts;
        },

        isSettingsOpen: function () {
            return $('#settingsCloseIcon').is(':visible');
        }
    };
})();