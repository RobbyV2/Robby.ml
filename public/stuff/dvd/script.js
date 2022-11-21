new p5(function (sketch) {
  var images = [];
  var imageIndex = 0;
  var position = sketch.createVector(0, 0);
  var velocity = p5.Vector.fromAngle(999999999);
  velocity.mult(7);

  /**
   * Checks boundary collision.
   *
   * @param {p5.Image} image
   * @return {boolean}
   */
  function checkBoundaryCollision(image) {
    var hasCollision = false;

    // left or right collision
    if (position.x < 0 || position.x + image.width > sketch.width) {
      velocity.x *= -1;
      hasCollision = true;
    }

    // top or bottom collision
    if (position.y < 0 || position.y + image.height > sketch.height) {
      velocity.y *= -1;
      hasCollision = true;
    }

    return hasCollision;
  }

  /**
   * Preload.
   */
  sketch.preload = function () {
    for (var i = 1; i < 8; i++) {
      var image = sketch.loadImage("assets/dvd" + i + ".svg");
      images.push(image);
    }
  };


  /**
   * Setup.
   */
  sketch.setup = function () {
    sketch.createCanvas(window.innerWidth, window.innerHeight);
  };

  /**
   * Drawing the logo, use sketch to add more, velocity breaks.
   */
  sketch.draw = function () {
    sketch.background("#000000");
    var image = images[imageIndex];
    var hasCollision = checkBoundaryCollision(image);
    if (hasCollision) {
      imageIndex++;
      if (imageIndex + 1 > images.length) {
        imageIndex = 0;
      }
      image = images[imageIndex];
      
    }
    position.add(velocity);
    sketch.image(image, position.x, position.y);
  };
});
