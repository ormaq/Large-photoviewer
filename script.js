document.addEventListener('DOMContentLoaded', function() {
  var imageData = [
    // 1) 1943
    {
      date: "01-02-1943",
      folder: "1943",
      dzi: "tiles/1943_tiles.dzi",
      offsetX: -20000,
      offsetY: -20000,
      rotation: 1,
      zoomLevel: 3
    }
    /// ... etc
  ]

  imageData.sort(function(a, b) {
    const [monthA, dayA, yearA] = a.date.split('-').map(num => parseInt(num, 10));
    const [monthB, dayB, yearB] = b.date.split('-').map(num => parseInt(num, 10));
  
    const dateAObj = new Date(yearA, monthA - 1, dayA);
    const dateBObj = new Date(yearB, monthB - 1, dayB);
  
    return dateAObj - dateBObj;
  });
  
  var slider = document.getElementById('date-slider');
  var dateLabel = document.getElementById('date-label');
  var rotateBtn = document.getElementById('rotate-btn');
  var zoomBtn = document.getElementById('zoom-btn');
  var compareBtn = document.getElementById('compare-btn');
  var compareContainer = document.querySelector('.compare-container');
  var compareSelect = document.getElementById('compare-select');
  var fadeSlider = document.getElementById('fade-slider');

  var prevImageBtn = document.getElementById('prev-image-btn');
  var nextImageBtn = document.getElementById('next-image-btn');

  // Populate compare select dropdown
  imageData.forEach(function(data, i) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = data.date;
    compareSelect.appendChild(opt);
  });

  slider.min = 0;
  slider.max = imageData.length - 1;
  slider.value = 0;
  dateLabel.textContent = imageData[0].date;

  var rotateActive = false;
  var zoomActive = false;
  var compareActive = false;

  var currentMainIndex = 0;
  var currentCompareIndex = 0;

  var tiledImageA = null; // main image
  var tiledImageB = null; // compare image if active

  var viewer = OpenSeadragon({
      id: "viewer",
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/3.1.0/images/",
      tileSources: imageData[0].dzi,
      showNavigationControl: true,
      gestureSettingsMouse: {
          scrollToZoom: true,
          clickToZoom: false,
          dblClickToZoom: true
      },
      showNavigator: true,
      navigatorPosition: "TOP_RIGHT",
      navigatorSizeRatio: 0.2,
      animationTime: 0.5,
      blendTime: 0.1,
      springStiffness: 7.0,
      immediateRender: false,
      maxImageCacheCount: 300,
      preserveViewport: true,
      visibilityRatio: 1,
      constrainDuringPan: true,
      smoothTileEdgesMinZoom: Infinity,
      timeout: 120000
  });

  viewer.addHandler('open', function() {
    var container = document.querySelector('.viewer-container');
    if (container) {
      container.classList.add('loaded');
    }

    tiledImageA = viewer.world.getItemAt(0);

    // Reset states when a new main image is loaded
    rotateActive = false;
    zoomActive = false;
    rotateBtn.textContent = "Rotate";
    zoomBtn.textContent = "Zoom";

    // If compare is active, re-add second image
    if (compareActive) {
      addSecondImage(currentCompareIndex);
    }
  });

  // Change main image on slider input
  slider.addEventListener('input', function() {
    currentMainIndex = parseInt(slider.value, 10);
    var data = imageData[currentMainIndex];
    dateLabel.textContent = data.date;

    var container = document.querySelector('.viewer-container');
    container.classList.remove('loaded');

    viewer.open(data.dzi);
    tiledImageA = null;
    tiledImageB = null; 
  });

  prevImageBtn.addEventListener('click', function() {
    if (parseInt(slider.value,10) > parseInt(slider.min,10)) {
      slider.value = parseInt(slider.value, 10) - 1;
      slider.dispatchEvent(new Event('input'));
    }
  });

  nextImageBtn.addEventListener('click', function() {
    // Convert slider.value and slider.max to integers for comparison
    if (parseInt(slider.value, 10) < parseInt(slider.max, 10)) {
        slider.value = parseInt(slider.value, 10) + 1;
        slider.dispatchEvent(new Event('input'));
    }
});


  // Rotate toggle
  rotateBtn.addEventListener('click', function() {
    rotateActive = !rotateActive;
    rotateBtn.textContent = rotateActive ? "Un-Rotate" : "Rotate";
    applyTransforms();
  });

  // Zoom toggle
  zoomBtn.addEventListener('click', function() {
    zoomActive = !zoomActive;
    zoomBtn.textContent = zoomActive ? "Un-Zoom" : "Zoom";
    applyTransforms();
  });

  // Compare toggle
  compareBtn.addEventListener('click', function() {
    compareActive = !compareActive;
    if (compareActive) {
      compareBtn.textContent = "Compare ON";
      compareContainer.style.display = "flex";
      addSecondImage(currentCompareIndex);
    } else {
      compareBtn.textContent = "Compare OFF";
      compareContainer.style.display = "none";
      removeSecondImage();
    }
    applyTransforms();
  });

  // Change second image
  compareSelect.addEventListener('change', function() {
    currentCompareIndex = parseInt(compareSelect.value, 10);
    if (compareActive) {
      addSecondImage(currentCompareIndex);
    }
  });

  fadeSlider.addEventListener('input', function() {
    if (tiledImageB) {
      tiledImageB.setOpacity(parseFloat(fadeSlider.value));
    }
  });

  function addSecondImage(index) {
    removeSecondImage();
    var data = imageData[index];
    viewer.addTiledImage({
      tileSource: data.dzi,
      success: function(event) {
        tiledImageB = event.item;
        tiledImageB.setOpacity(parseFloat(fadeSlider.value));
        applyTransforms();
      }
    });
  }

  function removeSecondImage() {
    if (tiledImageB) {
      viewer.world.removeItem(tiledImageB);
      tiledImageB = null;
    }
  }

  // Apply transformations (rotation/zoom) to both images
  function applyTransforms() {
    if (tiledImageA) {
      transformImage(tiledImageA, imageData[currentMainIndex]);
    }
    if (tiledImageB && compareActive) {
      transformImage(tiledImageB, imageData[currentCompareIndex]);
    }
  }

  function transformImage(tiledImage, data) {
    // Reset image to default first
    tiledImage.setRotation(0);
    tiledImage.setWidth(1);
    tiledImage.setPosition(new OpenSeadragon.Point(0,0));

    // If rotate active, apply rotation
    if (rotateActive) {
      tiledImage.setRotation(data.rotation);
    }

    // If zoom active, apply zoom and offsets
    if (zoomActive) {
      tiledImage.setWidth(data.zoomLevel);
      var contentSize = tiledImage.getContentSize();
      var offsetXWorld = data.offsetX / contentSize.x;
      var offsetYWorld = data.offsetY / contentSize.y;
      tiledImage.setPosition(new OpenSeadragon.Point(offsetXWorld, offsetYWorld));
    }
  }
});