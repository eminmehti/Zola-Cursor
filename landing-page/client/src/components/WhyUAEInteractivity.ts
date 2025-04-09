/**
 * WhyUAEInteractivity.ts
 * Manages interactive effects for the metro tiles in Why UAE section
 */

// Types for event handlers
type EventHandler = (event: Event) => void;

// Initialize interactive effects for metro tiles
export function initializeMetroTileInteractivity() {
  if (typeof document === 'undefined') return;
  
  // Get all metro tiles
  const metroTiles = document.querySelectorAll('.metro-tile');
  
  // Add event listeners to each tile
  metroTiles.forEach(tile => {
    // Event listeners for mouse interactions
    tile.addEventListener('mouseenter', handleTileMouseEnter);
    tile.addEventListener('mousemove', handleTileMouseMove);
    tile.addEventListener('mouseleave', handleTileMouseLeave);
  });

  // Handle window resize to reset transforms
  window.addEventListener('resize', function() {
    if ((window as any).resizeTimeoutId) {
      clearTimeout((window as any).resizeTimeoutId);
    }
    
    (window as any).resizeTimeoutId = setTimeout(() => {
      metroTiles.forEach(tile => {
        (tile as HTMLElement).style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    }, 100);
  });
  
  // Accessibility: add keyboard focus events
  metroTiles.forEach(tile => {
    tile.addEventListener('focus', (e) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'translateY(-8px)';
      target.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.1)';
    });
    
    tile.addEventListener('blur', (e) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'translateY(0)';
      target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
    });
  });
}

// Tile mouse enter handler
const handleTileMouseEnter: EventHandler = (event) => {
  // For mobile/touch devices, don't apply these effects
  if (window.innerWidth < 992) return;
  
  const tile = event.currentTarget as HTMLElement;
  
  // Reset to default position
  tile.style.transition = 'transform 0.3s ease';
  
  // Add subtle glow effect
  setTimeout(() => {
    tile.style.transition = 'transform 0.05s ease, box-shadow 0.3s ease';
  }, 300);
};

// Tile mouse move handler for 3D effect
const handleTileMouseMove: EventHandler = (event) => {
  // For mobile/touch devices, don't apply these effects
  if (window.innerWidth < 992) return;
  
  const mouseEvent = event as MouseEvent;
  const tile = event.currentTarget as HTMLElement;
  const tileRect = tile.getBoundingClientRect();
  
  // Calculate mouse position relative to the tile
  const mouseX = mouseEvent.clientX - tileRect.left;
  const mouseY = mouseEvent.clientY - tileRect.top;
  
  // Calculate the percentage of the mouse position within the tile
  const percentX = mouseX / tileRect.width;
  const percentY = mouseY / tileRect.height;
  
  // Calculate tilt values (less rotation for small tiles)
  let tiltX, tiltY;
  
  if (tile.classList.contains('small')) {
    tiltX = 3 * (0.5 - percentY); // Inverted for natural feel
    tiltY = 3 * (percentX - 0.5); // Positive for right tilt
  } else {
    tiltX = 6 * (0.5 - percentY); // Inverted for natural feel
    tiltY = 6 * (percentX - 0.5); // Positive for right tilt
  }
  
  // Apply 3D transform
  tile.style.transform = `
    translateY(-8px)
    rotateX(${tiltX}deg)
    rotateY(${tiltY}deg)
  `;
};

// Tile mouse leave handler
const handleTileMouseLeave: EventHandler = (event) => {
  const tile = event.currentTarget as HTMLElement;
  
  // Smoothly return to original position
  tile.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  tile.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
};

// Initialize when DOM is loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Wait a short moment to ensure all elements are rendered
    setTimeout(initializeMetroTileInteractivity, 800);
  });
}