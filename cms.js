

// CMS functionality for managing gallery images
class GalleryCMS {
    constructor() {
        this.images = this.loadImages();
        this.categories = this.loadCategories();
        this.initializeForm();
    }

    loadImages() {
        const stored = localStorage.getItem('galleryImages');
        return stored ? JSON.parse(stored) : [];
    }

    loadCategories() {
        const stored = localStorage.getItem('galleryCategories');
        const defaultCategories = {
            'exterior-siding': 'Exterior Siding',
            'roof-repairs': 'Roof Repairs',
            'new-home': 'New Home Construction',
            'deck-addition': 'Backyard Deck Addition'
        };
        return stored ? { ...defaultCategories, ...JSON.parse(stored) } : defaultCategories;
    }

    saveImages() {
        localStorage.setItem('galleryImages', JSON.stringify(this.images));
    }

    saveCategories() {
        // Only save custom categories (not default ones)
        const customCategories = {};
        const defaultKeys = ['exterior-siding', 'roof-repairs', 'new-home', 'deck-addition'];
        
        Object.keys(this.categories).forEach(key => {
            if (!defaultKeys.includes(key)) {
                customCategories[key] = this.categories[key];
            }
        });
        
        localStorage.setItem('galleryCategories', JSON.stringify(customCategories));
    }

    getCategories() {
        return Object.keys(this.categories).map(key => ({
            key: key,
            name: this.categories[key]
        }));
    }

    getImages() {
        return this.images;
    }

    getImageById(id) {
        return this.images.find(img => img.id === id);
    }

    addCategory(key, name) {
        this.categories[key] = name;
        this.saveCategories();
        return true;
    }

    deleteCategory(categoryKey) {
        // Don't allow deletion of default categories
        const defaultKeys = ['exterior-siding', 'roof-repairs', 'new-home', 'deck-addition'];
        if (defaultKeys.includes(categoryKey)) {
            return false;
        }

        // Remove all images in this category
        this.images = this.images.filter(img => img.category !== categoryKey);
        this.saveImages();

        // Remove the category
        delete this.categories[categoryKey];
        this.saveCategories();
        
        return true;
    }

    updateImage(imageId, updates) {
        const imageIndex = this.images.findIndex(img => img.id === imageId);
        if (imageIndex !== -1) {
            this.images[imageIndex] = { ...this.images[imageIndex], ...updates };
            this.saveImages();
            return true;
        }
        return false;
    }

    deleteImage(imageId) {
        const initialLength = this.images.length;
        this.images = this.images.filter(img => img.id !== imageId);
        
        if (this.images.length < initialLength) {
            this.saveImages();
            return true;
        }
        return false;
    }

    initializeForm() {
        const form = document.getElementById('imageForm');
        if (form) {
            // Check authentication before allowing form submission
            if (this.isAuthenticated()) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
        }
        
        // Load existing images on home page
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            this.loadGalleryImages();
        }
    }

    isAuthenticated() {
        return sessionStorage.getItem('jedAdminAuth') === 'true';
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Double-check authentication
        if (!this.isAuthenticated()) {
            this.showMessage('Authentication required. Please log in again.', 'danger');
            return;
        }
        
        let category = document.getElementById('category').value;
        const imageFile = document.getElementById('imageFile').files[0];
        const description = document.getElementById('description').value;
        
        // Handle custom category
        if (category === 'custom') {
            const customCategoryName = document.getElementById('customCategory').value.trim();
            if (!customCategoryName) {
                this.showMessage('Please enter a category name.', 'danger');
                return;
            }
            
            // Create category key from name
            category = customCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            this.addCategory(category, customCategoryName);
        }
        
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
            document.getElementById('customCategoryDiv').style.display = 'none';
            document.getElementById('customCategory').required = false;
        };
        
        reader.readAsDataURL(imageFile);
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.innerHTML = `<div class="alert alert-${type}" role="alert">${text}</div>`;
            
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        }
    }

    loadGalleryImages() {
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
            const categoryName = this.categories[categoryKey];
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

