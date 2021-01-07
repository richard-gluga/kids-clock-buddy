var myUtils = (function () {
    return {
        // Return hour from given date in 12h format.
        hours12: function (date) {
            return (date.getHours() + 24) % 12 || 12;
        },

        // Returns true if screen size appears to be portrait.
        isPortrait: function () {
            return window.innerHeight > window.innerWidth;
        },

        isAndroid: function () {
            var ua = navigator.userAgent.toLowerCase();
            return ua.indexOf("android") > -1;
        },


        // Takes an x,y coordinate for the center of a circle, and the radius and angle,
        // and returns x,y coordinates for the point on the circumferance.
        polarToCartesian: function (centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        },


        // Returns an SVG arc description string to draw the path.
        describeArc: function (x, y, radius, startAngle, endAngle) {
            const start = myUtils.polarToCartesian(x, y, radius, endAngle);
            const end = myUtils.polarToCartesian(x, y, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            return [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(" ");
        },
    };
})();