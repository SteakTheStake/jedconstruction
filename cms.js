
// CMS functionality for managing gallery images
class GalleryCMS {
    constructor() {
        this.images = this.loadImages();
        this.initializeForm();
    }

    loadImages() {
        const stored = localStorage.getItem('galleryImages');
        return stored ? JSON.parse(stored) : [];
    }

    saveImages() {
        localStorage.setItem('galleryImages', JSON.stringify(this.images));
    }

    initializeForm() {
        const form = document.getElementById('imageForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Load existing images on home page
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            this.loadGalleryImages();
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('category').value;
        const imageFile = document.getElementById('imageFile').files[0];
        const description = document.getElementById('description').value;
        
        if (!imageFile) {
            this.showMessage('Please select an image file.', 'danger');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Date.now(),
                category: category,
                src: e.target.result,
                description: description,
                filename: imageFile.name,
                timestamp: new Date().toISOString()
            };

            this.images.push(imageData);
            this.saveImages();
            this.showMessage('Image added successfully!', 'success');
            
            // Reset form
            document.getElementById('imageForm').reset();
        };
        
        reader.readAsDataURL(imageFile);
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = `<div class="alert alert-${type}" role="alert">${text}</div>`;
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }

    loadGalleryImages() {
        // Categories mapping
        const categories = {
            'exterior-siding': 'Exterior Siding',
            'roof-repairs': 'Roof Repairs', 
            'new-home': 'New Home Construction',
            'deck-addition': 'Backyard Deck Addition'
        };

        // Group images by category
        const groupedImages = {};
        this.images.forEach(image => {
            if (!groupedImages[image.category]) {
                groupedImages[image.category] = [];
            }
            groupedImages[image.category].push(image);
        });

        // Find the projects section
        const projectsSection = document.getElementById('projects');
        if (!projectsSection) return;

        const container = projectsSection.querySelector('.container');
        
        // Add new images to existing categories or create new sections
        Object.keys(groupedImages).forEach(categoryKey => {
            const categoryName = categories[categoryKey];
            const images = groupedImages[categoryKey];
            
            // Look for existing category section
            let categorySection = this.findCategorySection(container, categoryName);
            
            if (!categorySection) {
                // Create new category section
                categorySection = this.createCategorySection(categoryName, images);
                // Insert before the last section (which should be deck addition)
                const lastSection = container.querySelector('.mb-8:last-of-type');
                if (lastSection) {
                    container.insertBefore(categorySection, lastSection.nextSibling);
                } else {
                    container.appendChild(categorySection);
                }
            } else {
                // Add images to existing category
                const gridContainer = categorySection.querySelector('.grid-img');
                images.forEach(image => {
                    const imageCard = this.createImageCard(image);
                    gridContainer.appendChild(imageCard);
                });
            }
        });
    }

    findCategorySection(container, categoryName) {
        const headings = container.querySelectorAll('h3');
        for (let heading of headings) {
            if (heading.textContent.trim() === categoryName) {
                return heading.closest('.mb-8, .bottom-margin');
            }
        }
        return null;
    }

    createCategorySection(categoryName, images) {
        const section = document.createElement('div');
        section.className = 'mb-8 bottom-margin';
        
        const heading = document.createElement('h3');
        heading.className = 'text-xl mb-4';
        heading.textContent = categoryName;
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 grid-img';
        
        images.forEach(image => {
            const imageCard = this.createImageCard(image);
            gridContainer.appendChild(imageCard);
        });
        
        section.appendChild(heading);
        section.appendChild(gridContainer);
        
        return section;
    }

    createImageCard(image) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card img';
        
        const img = document.createElement('img');
        img.src = image.src;
        img.className = 'w-full h-64 object-cover';
        img.alt = image.description;
        
        cardDiv.appendChild(img);
        return cardDiv;
    }
}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryCMS();
});
