// Comparison slider functionality
function initializeComparisonSlider() {
  const sliderHandle = document.querySelector('.slider-handle');
  const afterImage = document.querySelector('.after-image');
  const comparisonSlider = document.querySelector('.comparison-slider');
  
  if (!sliderHandle || !afterImage || !comparisonSlider) {
    console.log('Comparison slider elements not found');
    return;
  }

  let isDragging = false;

  function updateSliderPosition(x: number) {
    if (!comparisonSlider) return;
    
    const sliderRect = comparisonSlider.getBoundingClientRect();
    let position = (x - sliderRect.left) / sliderRect.width;
    
    // Constrain position between 0 and 1
    position = Math.max(0, Math.min(1, position));
    
    // Update slider handle and after image
    (sliderHandle as HTMLElement).style.left = `${position * 100}%`;
    (afterImage as HTMLElement).style.width = `${position * 100}%`;
  }

  sliderHandle.addEventListener('mousedown', () => {
    isDragging = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch support
  sliderHandle.addEventListener('touchstart', () => {
    isDragging = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Initialize at 50%
  if (comparisonSlider) {
    updateSliderPosition(comparisonSlider.getBoundingClientRect().width / 2);
    console.log('Comparison slider initialized');
  }
}

export default initializeComparisonSlider;