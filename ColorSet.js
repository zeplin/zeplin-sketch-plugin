function ColorSet() {
    var container = [];

    this.add = function (newColor) {
        var colorAlreadyExists = container.some(function (color) {
            return color.r === newColor.r &&
                color.g === newColor.g &&
                color.b === newColor.b &&
                color.a === newColor.a;
        });

        if (!colorAlreadyExists) {
            container.push(newColor);
        }
    };

    this.clear = function () {
        container.length = 0;
    }

    this.count = function () {
        return container.length;
    };

    this.forEach = function (fn) {
        container.forEach(fn);
    };

    this.toArray = function () {
        return container.slice(0);
    };

    this.toString = function () {
        return "Set(" + container.map(JSON.stringify).join(", ") + ")";
    };
}
