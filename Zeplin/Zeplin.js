function Zeplin() {
    var BorderPositions = ["center", "inside", "outside"];
    var FillTypes = ["color", "gradient"];
    var GradientTypes = ["linear", "radial", "angular"];
    var ShadowTypes = ["outer", "inner"];
    var TextAligns = ["left", "right", "center", "justify"];

    function toJSString(str) {
        return new String(str).toString();
    }

    function toJSON(obj) {
        switch (toJSString(obj.className())) {
            case "GKRect":
            case "MSRect":
                return {
                    x: obj.x(),
                    y: obj.y(),
                    width: obj.width(),
                    height: obj.height()
                };

            case "MSColor":
                return {
                    r: Math.round(obj.red() * 255),
                    g: Math.round(obj.green() * 255),
                    b: Math.round(obj.blue() * 255),
                    a: obj.alpha()
                };

            case "MOStruct":
            case "CGPoint":
                return {
                    x: parseFloat(obj.x),
                    y: parseFloat(obj.y)
                };

            case "MSGradientStop":
                return {
                    color: toJSON(obj.color()),
                    position: obj.position()
                };

            case "MSGradient":
                var stops = [],
                    msStop, stopIter = obj.stops().array().objectEnumerator();
                while (msStop = stopIter.nextObject()) {
                    stops.push(toJSON(msStop));
                }

                return {
                    type: GradientTypes[obj.gradientType()],
                    from: toJSON(obj.from()),
                    to: toJSON(obj.to()),
                    stops: stops
                };

            case "MSStyleShadow":
                return {
                    type: "outer",
                    offsetX: obj.offsetX(),
                    offsetY: obj.offsetY(),
                    blurRadius: obj.blurRadius(),
                    spread: obj.spread(),
                    color: toJSON(obj.color())
                };

            case "MSStyleInnerShadow":
                return {
                    type: "inner",
                    offsetX: obj.offsetX(),
                    offsetY: obj.offsetY(),
                    blurRadius: obj.blurRadius(),
                    spread: obj.spread(),
                    color: toJSON(obj.color())
                };

            default:
                return null;
        }
    }

    function getBorders(style) {
        var borders = [],
            msBorder, borderIter = style.borders().array().objectEnumerator();
        while (msBorder = borderIter.nextObject()) {
            if (msBorder.isEnabled()) {
                var fillType = FillTypes[msBorder.fillType()],
                    border = {
                        fillType: fillType,
                        position: BorderPositions[msBorder.position()],
                        thickness: msBorder.thickness()
                    };

                switch (fillType) {
                    case "color":
                        border.color = toJSON(msBorder.color());
                        break;

                    case "gradient":
                        border.gradient = toJSON(msBorder.gradient());
                        break;

                    default:
                        continue;
                }

                borders.push(border);
            }
        }

        return borders;
    }

    function getFills(style) {
        var fills = [],
            msFill, fillIter = style.fills().array().objectEnumerator();
        while (msFill = fillIter.nextObject()) {
            if (msFill.isEnabled()) {
                var fillType = FillTypes[msFill.fillType()],
                    fill = {
                        fillType: fillType
                    };

                switch (fillType) {
                    case "color":
                        fill.color = toJSON(msFill.color());
                        break;

                    case "gradient":
                        fill.gradient = toJSON(msFill.gradient());
                        break;

                    default:
                        continue;
                }

                fills.push(fill);
            }
        }

        return fills;
    }

    function getShadows(style) {
        var msShadow, shadows = [],
            shadowIter = style.shadows().array().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(toJSON(msShadow)));
            }
        }

        shadowIter = style.innerShadows().array().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(toJSON(msShadow));
            }
        }

        return shadows;
    }

    this.exportArtboards = function (artboards) {
        var project = {
            screens: []
        };

        artboards.forEach(function (msArtboard) {
            var layers = [],
                msLayer, layerIter = msArtboard.children().objectEnumerator();
            while(msLayer = layerIter.nextObject()) {
                var layerType = toJSString(msLayer.className()),
                    layer = {
                        type: layerType === "MSTextLayer" ? "text" : "shape",
                        rect: toJSON(msLayer.frame())
                    };

                switch (layerType) {
                    case "MSTextLayer":
                        layer.content = toJSString(msLayer.name());
                        layer.color = toJSON(msLayer.textColor());
                        layer.fontSize = msLayer.fontSize();
                        layer.fontFace = toJSString(msLayer.fontPostscriptName());
                        layer.textAlign = TextAligns[msLayer.textAlignment()];
                        layer.letterSpacing = msLayer.characterSpacing();
                        layer.lineHeight = msLayer.lineSpacing();

                    case "MSShapeGroup":
                    case "MSBitmapLayer":
                        var style = msLayer.style();

                        layer.borders = getBorders(style);
                        layer.fills = getFills(style);
                        layer.shadows = getShadows(style);

                        layers.push(layer);
                        break;
                }
            }

            var imageFileName = NSUUID.UUID().UUIDString() + ".png",
                imagePath = NSTemporaryDirectory().stringByAppendingPathComponent(imageFileName),
                artboardFrame = toJSON(msArtboard.frame());

            [doc saveArtboardOrSlice:msArtboard toFile:imagePath];

            project.screens.push({
                name: toJSString(msArtboard.name()),
                imageFileName: imageFileName,
                width: artboardFrame.width,
                height: artboardFrame.height,
                layers: layers
            });
        });

        var path = NSTemporaryDirectory().stringByAppendingPathComponent("project.json"),
            content = NSString.stringWithString(JSON.stringify(project)),
            success = [content writeToFile:path
                                atomically:false
                                  encoding:NSUTF8StringEncoding
                                     error:null];

        doc.showMessage("Export completed.");

        [[NSWorkspace sharedWorkspace] openFile:path
                                withApplication:@"Zeplin"];
    }
}
