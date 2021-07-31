var generic_viewer = (function () {
  function createQuadKey(x, y, z) {
      const quadKey = [];
      for (var i = z; i > 0; i--) {
          let digit = '0';
          let mask = 1 << (i - 1);
          if ((x & mask) !== 0) {
              digit++;
          }
          if ((y & mask) !== 0) {
              digit++;
              digit++;
          }
          quadKey.push(digit);
      }
      return quadKey.join('');
  }
  function fillTemplate(tpl, coords) {
    return tpl+createQuadKey(coords.x, coords.y, 7)+".jpg";
  }
  return {
    "name": "Generic dezoomer",
    "description": "Just put the url of a tile, replacing it's horizontal coordinate by {{X}} and vertical coordinate by {{Y}}.",
    "urls": [
      "*"
    ],
    "open": function (url) {
      var current_dimension = 0;
      var dimensions_interval = [[0, 1000], [0, 1000]];
      var tileSize = 256;
      function middle(interval) {
        return Math.floor((interval[0] + interval[1]) / 2);
      }
      function dichotomy_step() {
        var img = new Image;
        var coords = dimensions_interval.map(function (interval, i) {
          return i === current_dimension ? middle(interval) : 0;
        });
        img.src = fillTemplate(url, { x: coords[0], y: coords[1] });
        function next_image(border) {
          var interval = dimensions_interval[current_dimension];
          var new_coord = middle(interval);
          return function update() {
            interval[border] = new_coord;
            console.log(dimensions_interval);
            if (interval[0] + 1 == interval[1])
              current_dimension++;
            if (current_dimension >= dimensions_interval.length) {
              return ZoomManager.readyToRender({
                "origin": url,
                "width": dimensions_interval[0][1] * tileSize,
                "height": dimensions_interval[1][1] * tileSize,
                "tileSize": tileSize
              });
            }
            if (img.height > 0 && img.width > 0) {
              // Try to guess tilesize.
              // There can be overlap between tiles, but there cannot be blanks.
              // The tiles at near the right and bottom margins of the image may be smaller
              // (In most cases, width and height will be the same)
              tileSize = Math.max(tileSize, Math.min(img.width, img.height));
            }
            return dichotomy_step();
          }
        }
        img.onload = next_image(0);
        img.onerror = next_image(1);
      }
      return dichotomy_step();
    },
    "getTileURL": function (x, y, zoom, data) {
      return fillTemplate(data.origin, { x: x, y: y });
    }
  };
})();
ZoomManager.addDezoomer(generic_viewer);
