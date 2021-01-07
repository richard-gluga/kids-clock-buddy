var myApp = (function () {
    // Main constants.
    var s = {
        amPmSize: 7,

        hourArcWidth: 7,
        hourColor: 'rgba(51, 51, 255, 0.7)',
        hourColorPm: 'rgba(51, 255, 51, 0.4)',
        hourMarkColor: 'rgba(255, 255, 255, 0.8)',
        hourSize: 4.5,

        minuteArcWidth: 5,
        minuteColor: 'rgba(255, 51, 51, 0.7)',

        secondsArcWidth: 1,
        secondColor: 'rgba(255, 255, 0, 0.7)',

        pageBackground: 'black',

        timeColor: 'rgba(51, 255, 51, 0.7)',
        timeSize: 6,
    };

    // Map of options used to customize behavior.
    var options = {};

    // Accelerated time factor when the time sliders are enabled.
    var speedFactor = 0;

    // GLOBAL STATE used for all render styles
    var state = {
        lastDate: new Date(),
        now: new Date(),
        page: null,
        pw: 100,
        ph: 100,
        tickAudio: new Audio("tick.mp3"),
        hourNumber: [],  // References to h nums around clock face.
    };

    var drawHour = function (page, cx, cy, radius, h) {
        if (!options.showHourNumbers) return;

        // Draw the hour and set style.
        h24 = state.now.getHours();
        hDisplay = h;
        if (options.blink24h && h24 > 11 && (state.now.getSeconds() % 10) < 5) {
            hDisplay = h == 12 ? 12 : h + 12;
        }
        if (state.hourNumber[h]) state.hourNumber[h].remove();
        var hour = page.text('' + hDisplay).stroke({}).fill({
            color: options.hourNumbersColor
        });
        state.hourNumber[h] = hour;
        hour.size(s.hourSize);
        var pos = myUtils.polarToCartesian(cx, cy, radius, h * 30);
        hour.move(pos.x - hour.bbox().w / 2, pos.y - hour.bbox().h / 2);
    };


    var drawMinute = function (page, cx, cy, radius, m, sec) {
        // Draw the minute number and set style.
        if (!options.showMinuteNumber || !options.showMinuteArc) return;

        var minute = page.text('' + m).stroke({}).fill({
            color: options.minuteColor
        });
        minute.size(9);
        var pos;
        pos = myUtils.polarToCartesian(cx, cy, radius, ((m * 60) + sec / 3) * 360 / (60 * 60));
        minute.move(pos.x - minute.bbox().w / 2, pos.y - minute.bbox().h / 2);
    };

    var drawMinuteMark = function (page, cx, cy, radius, m, sec) {
        if (!options.showMinuteArc) return;

        var degStart = (((m) * 60) - (60 - sec)) * 360 / (60 * 60);
        var degEnd = ((m * 60) + sec) * 360 / (60 * 60);

        // Sepcial case for < 1 minute, start degrees from 0 instead of negative
        degStart = degStart < 0 ? 0 : degStart;
        degEnd = degEnd < 0.5 ? 0.5 : degEnd;

        page.path(myUtils.describeArc(cx, cy, radius + 5, degStart, degEnd)).fill("none").stroke({
            color: options.minuteColor,
            width: s.minuteArcWidth - 3,
        });
    }

    var renderStyle2 = function (startTimer, forceRedraw) {
        var cx = state.pw / 2;
        var cy = state.ph / 2;
        var r = 30;
        var now;

        //Init state
        speedFactor = Math.floor(speedFactor);
        if (speedFactor) { // This means fake accelerated/reverse time mode.
            now = state.lastDate;
            now.setSeconds(now.getSeconds() + Math.pow(speedFactor, 2) * speedFactor);
            state.lastDate = now;
            state.now = now;
        } else {  // Normal time ticking.
            state.now = new Date(); // ('2018-01-02 10:00:00');
            state.lastDate = new Date(); // ('2018-01-02 10:00:00');
        }
        now = state.now;

        // Update brightness of glass
        $('#glass').css('opacity', 1 - options.brightness);

        if (!forceRedraw && state.fullRedrawMinute === state.now.getMinutes()) {
            if (isNightTime(now) && state.drewNightLight) {
                // it's still night time, and we already drew the nigh light, no need to do anything

            } else {  // Need to draw time, but only need to do a partial seconds redraw.
                state.drewNightLight = false;

                // Draw second circle if options is on.
                if (options.showSecondArc && Math.abs(speedFactor) < 2) {
                    var degrees2 = now.getSeconds() * 360 / 60;
                    if (state.secondsPath) state.secondsPath.remove();
                    state.secondsPath = state.page.path(myUtils.describeArc(cx, cy, r - 4, 0, degrees2))
                        .fill("none").stroke({
                            color: options.secondColor,
                            width: s.secondArcWidth,
                        });
                    maybePlaySecondTickSound();
                }

                // Draw 24h marks of options is on
                if (options.blink24h) {
                    for (var h = 1; h <= 12; h++) drawHour(state.page, cx, cy, r, h, myUtils.hours12(now));
                }
            }

            // Schedule next update.
            if (startTimer) setTimeout(function () {
                renderStyle2(true, false);
            }, speedFactor ? 5 : 1000);
            return;
        }

        // Else need to do a full page redraw
        state.fullRedrawMinute = state.now.getMinutes();

        // Remove existing drawings.
        var root = document.getElementById('drawing');
        while (root.firstChild) {
            root.removeChild(root.firstChild);
        }

        // Draw new page
        state.page = SVG('drawing').size(state.pw * 600, state.ph * 600).style('background', s.pageBackground);
        state.page.viewbox(0, 0, state.pw, state.ph);

        if (options.showNightLight && isNightTime(now)) {
            state.drewNightLight = true;
            state.page.image('images/moon02.png')
                .size(options.nightLightSize, options.nightLightSize)
                .style('opacity', options.nightLightBrightness)
                .move((100 - options.nightLightSize) / 2, (100 - options.nightLightSize) / 2);
        } else {
            state.drewNightLight = false;

            // Draw the hour and center it.
            const hour = state.page.text('' + myUtils.hours12(now));
            hour.stroke({}).fill({
                color: now.getHours() < 12 ? options.hourColorAm : options.hourColorPm
            }).size(r * 1.3);
            hour.move(cx - hour.bbox().w / 2, cy - hour.bbox().h / 2);

            // Draw am/pm below the hour
            if (options.showAmPm) {
                var m = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
                var amPm = state.page.text(now.getHours() < 12 ? 'am' : 'pm').stroke({}).fill({
                    color: now.getHours() < 12 ? options.hourColorAm : options.hourColorPm
                });
                amPm.size(s.amPmSize);
                amPm.move(cx - amPm.bbox().w / 2, (cy - amPm.bbox().h / 2) + hour.bbox().h / 2.4);
            }


            // Draw the hour circle.
            var h = myUtils.hours12(now) == 12 ? 0 : myUtils.hours12(now);
            var degHour = ((h * 60) + now.getMinutes()) * 360 / (12 * 60);
            state.page.path(myUtils.describeArc(cx, cy, r, 0, degHour)).fill('none').stroke({
                color: now.getHours() < 12 ? options.hourColorAm : options.hourColorPm,
                width: s.hourArcWidth,
            });

            // Draw the minute circle.
            if (options.showMinuteArc) {
                var degrees = ((now.getMinutes() * 60) + now.getSeconds()) * 360 / (60 * 60);
                degrees = degrees < 0.5 ? 0.5 : degrees;
                state.page.path(myUtils.describeArc(cx, cy, r + 6, 0, degrees)).fill("none").stroke({
                    color: options.minuteColor,
                    width: s.minuteArcWidth,
                });
            }

            // Draw second circle
            if (options.showSecondArc && Math.abs(speedFactor) < 2) {
                var degrees2 = now.getSeconds() * 360 / 60;
                state.secondsPath = state.page.path(myUtils.describeArc(cx, cy, r - 4, 0, degrees2))
                    .fill("none").stroke({
                        color: options.secondColor,
                        width: s.secondArcWidth,
                    });
            }

            // Draw hour marks
            for (var h = 1; h <= 12; h++) drawHour(state.page, cx, cy, r, h, myUtils.hours12(now));

            // Draw minute text
            drawMinute(state.page, cx, cy, 46, now.getMinutes(), now.getSeconds());

            // Draw minute tick
            drawMinuteMark(state.page, cx, cy, 33.959, now.getMinutes(), now.getSeconds());

            drawTimeSliders();
            maybePlaySecondTickSound();
        }

        if (startTimer) setTimeout(function () {
            renderStyle2(true, false);
        }, speedFactor ? 5 : 1000);
    };

    var isNightTime = function (now) {
        var nowMinutes = now.getHours() * 60 + now.getMinutes();
        var nightStartMinutes =
            parseInt(options.nightStartHour, 10) * 60 + parseInt(options.nightStartMinute, 10);
        var nightEndMinutes =
            parseInt(options.nightEndHour, 10) * 60 + parseInt(options.nightEndMinute, 10);

        return nowMinutes >= nightStartMinutes || nowMinutes < nightEndMinutes;
    }


    var maybePlaySecondTickSound = function () {
        // This doesn't work on page load in Chrome 66+ because they try to prevent on-load auto-play.
        if (options.playTickSound && !options.showTimeSliders) {
            try {
                state.tickAudio.pause();
                state.tickAudio.currentTime = 0;
                state.tickAudio.play().then(function () { }, function () { });
            } catch (ex) {
                // doesn't work as described
            }
        };
    };

    var drawTimeSliders = function () {
        if (options.showTimeSliders) {  // Render either the landscape or the portrait slider.
            if (!myUtils.isPortrait()) {
                $('#landscapeTimeSliderContainer').css('visibility', 'visible');
                $('#portraitTimeSliderContainer').css('visibility', 'hidden');
            }
            else if (isPortrait()) {
                $('#portraitTimeSliderContainer').css('visibility', 'visible');
                $('#landscapeTimeSliderContainer').css('visibility', 'hidden');
            }
        } else {  // Hide and reset default value to both.
            speedFactor = 0;
            $('#landscapeTimeSliderContainer').css('visibility', 'hidden');
            $('#portraitTimeSliderContainer').css('visibility', 'hidden');
            $('#landscapeTimeSlider').val($('#landscapeTimeSlider').data('default')).change();
            $('#portraitTimeSlider').val($('#portraitTimeSlider').data('default')).change();
        }
    };

    var scheduleReload = function () {
        // Reload every hour to avoid potential memory leaks, etc.
        setTimeout(function () {
            if (!myOptions.isSettingsOpen() && !options.showTimeSliders) {
                // Only reload if not on settings page or using time slider.
                location.reload();
            } else {  // Otherwise try again later.
                scheduleReload();
            }
        }, 1000 * 60 * 60 * 1);  // Reload page every hour.
    };

    var initTimeSliders = function () {
        console.log('initTimeSliders');
        // Initialize time sliders
        $('#portraitTimeSlider').change(function () {
            const v = $(this).val();
            if ($('#landscapeTimeSlider').val() != v) {
                $('#landscapeTimeSlider').val(v).change();
                speedFactor = v;
            }
        });
        $('#landscapeTimeSlider').change(function () {
            const v = $(this).val();
            if ($('#portraitTimeSlider').val() != v) {
                $('#portraitTimeSlider').val(v).change();
                speedFactor = v;
            }
        });
    };

    return {
        start: function () {
            myUtils.initScreenWakeLock();
            
            // Load main options.
            options = myOptions.loadOptions(function () {
                renderStyle2(false, true);  // Handler for when settings are updated.
            });

            initTimeSliders();
            scheduleReload(); // Reload whole page/app every X hours to avoid memory leaks.

            // START THE RENDERING LOOP
            renderStyle2(true, true);
        }
    };
})();

myApp.start();