document.addEventListener('DOMContentLoaded', () => {
  // Initialize comparison interactivity
  console.log('Comparison section interactivity initialized');
  
  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  
  // Observe the comparison container
  const comparisonSection = document.querySelector('.comparison-section');
  if (comparisonSection) {
    observer.observe(comparisonSection);
  }
  
  // Add hover effect on rows
  const rows = document.querySelectorAll('.comparison-row');
  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      rows.forEach(r => r.classList.remove('highlighted'));
      row.classList.add('highlighted');
    });
  });
});

export {}; // This makes the file a module