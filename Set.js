function Set() {
    var container = [];
    
    this.add = function (e) {
        if (container.indexOf(e) === -1) {
            container.push(e);
        }
    };
    
    this.count = function () {
        return container.length;
    };
    
    this.forEach = function (f) {
        container.forEach(f);
    };
    
    this.toArray = function () {
        return container.slice(0);
    };
    
    this.toString = function () {
        return "Set(" + container.join(", ") + ")";
    };
}