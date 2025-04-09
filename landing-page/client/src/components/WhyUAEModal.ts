/**
 * WhyUAEModal.ts
 * Manages small tile click expansion with modal functionality
 */

// Content data for the modal details
interface TileDetails {
  [key: string]: {
    description: string;
    benefits: string[];
  }
}

// Define detailed content for each small tile
const tileDetailsContent: TileDetails = {
  "Economic Diversification": {
    description: "The UAE has successfully diversified its economy beyond oil, creating robust sectors in technology, finance, tourism, and renewable energy that offer diverse business opportunities.",
    benefits: [
      "Multiple revenue streams across various sectors",
      "Reduced dependency on oil and gas markets",
      "Government initiatives supporting emerging industries"
    ]
  },
  "Modern Infrastructure": {
    description: "The UAE boasts world-class infrastructure including state-of-the-art transport networks, telecommunications, advanced logistics facilities, and smart city innovations.",
    benefits: [
      "High-speed internet and 5G connectivity throughout major cities",
      "World-class transportation hubs including airports and seaports",
      "Smart city technologies reducing business operational costs"
    ]
  },
  "Foreign Ownership": {
    description: "Recent legislative changes now allow 100% foreign ownership of companies in most sectors, eliminating the previous requirement for local partners in mainland businesses.",
    benefits: [
      "Complete control over business operations and decisions",
      "Enhanced investor protection and security",
      "Streamlined ownership structure without local partner requirements"
    ]
  },
  "Quality of Life": {
    description: "The UAE offers an exceptional lifestyle with world-class healthcare, education, housing, and entertainment options, making it attractive for relocating executives and their families.",
    benefits: [
      "Top-tier international schools and universities",
      "Premium healthcare facilities with international standards",
      "Diverse cultural experiences and leisure activities"
    ]
  }
};

// Initialize modal functionality for small tiles
export function initializeSmallTileModal() {
  if (typeof document === 'undefined') return;
  
  // Get all small tiles
  const smallTiles = document.querySelectorAll('.metro-tile.small');
  
  // Add click event to each small tile
  smallTiles.forEach(tile => {
    tile.addEventListener('click', function(event) {
      // Prevent default behavior and stop propagation
      event.stopPropagation();
      
      // Extract content from the tile
      const titleEl = tile.querySelector('.tile-title');
      const iconEl = tile.querySelector('.tile-icon');
      
      if (!titleEl || !iconEl) return;
      
      const title = titleEl.textContent || '';
      const iconHTML = iconEl.innerHTML;
      
      // Get detailed content for this tile
      const details = tileDetailsContent[title] || {
        description: `Detailed information about ${title} in the UAE.`,
        benefits: ["Key benefit point one", "Key benefit point two", "Key benefit point three"]
      };
      
      // Create modal with content
      const modal = document.createElement('div');
      modal.className = 'tile-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-close">&times;</div>
          <div class="modal-icon">${iconHTML}</div>
          <h3 class="modal-title">${title}</h3>
          <p class="modal-description">${details.description}</p>
          <ul class="modal-details">
            ${details.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
      `;
      
      // Append modal to body
      document.body.appendChild(modal);
      
      // Add animation class after a small delay
      setTimeout(() => {
        modal.classList.add('active');
      }, 10);
      
      // Close modal functionality
      const closeButton = modal.querySelector('.modal-close');
      if (closeButton) {
        closeButton.addEventListener('click', function() {
          modal.classList.remove('active');
          setTimeout(() => {
            modal.remove();
          }, 300);
        });
      }
      
      // Close on background click
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.classList.remove('active');
          setTimeout(() => {
            modal.remove();
          }, 300);
        }
      });
      
      // Close on Escape key
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          modal.classList.remove('active');
          setTimeout(() => {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
          }, 300);
        }
      });
    });
  });
}

// Initialize when DOM is loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Wait a short moment to ensure all elements are rendered
    setTimeout(initializeSmallTileModal, 800);
  });
}