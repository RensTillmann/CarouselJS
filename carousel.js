// Author: Rens Tillmann
// URL: github.com/RensTillmann/CarouselJS
// Description: A lightweight carousel/slider script, designed for `Super Forms`

"use strict";
var CarouselJS = {

    // Settings & Options
    settings: {
        animationSpeed: 0.3,            // The scroll animation speed in seconds
        selector: '.carouseljs',        // Selector to intialize the carousel element
        displayButtons: true,           // Display Prev/Next buttons (true|false)
        prevButtonHtml: '&lt;',         // HTML for inside the "prev/backward" button
        nextButtonHtml: '&gt;',         // HTML for inside the "next/forward" button
        buttonsHtmlTAG: 'button',       // e.g: `button`, `div`, `span` (default)
        customClass: 'super-carousel',  // A custom class to be added on the container
        slideMethod: 'multi'            // This determines how the slide should be executed
                                        // `single` : slide only one item forward/backward at a time
                                        // `multi` : slide all visible items forward/backward up to "nextItem"
    },

    // "action" holds the type of action to trigger the slide e.g `next` `prev`
    // ...you could think of it as the "direction" (forward/backward)
    trigger: function(button, action) {
        this._setters(button, action);
        this.doSlide();
    },

    // Setters
    _setters: function(node, action) {
        this._self = node.parentNode;
        this._action = action;
        this._containerWidth = this._self.clientWidth;
        this._currentItem = this._self.querySelector('.current');
        this._currentItemWidth = this._currentItem.clientWidth;
        this._carouselTrack = this._currentItem.parentNode;
        this._totalScrolled = (this._carouselTrack.style.marginLeft !== '' ? parseFloat(this._carouselTrack.style.marginLeft) : 0);
    },
    _self: null,                 // Reference
    _containerWidth: null,       // The total width of the container
    _nextItem: null,             // The next item is the first item that is not completely visible
    _nextItemWidth: null,        // This is the width of the "nextItem" that was found
    _currentItem: null,          // Returns the first visible item in the slider
    _currentItemWidth: null,     // Returns the width of "currentItem"
    _carouselTrack: null,        // Holds the "track" of all items, this is the element that we will be animating
    _totalScrolled: null,        // Current amount the carousel was scrolled

    // Slide carousel forward or backward 
    doSlide: function() {
        var _ = this.settings,
            nextNode = this._currentItem,
            width = this._currentItemWidth;

        if (this._action == 'next') {
            if (this.overlapRight() > 0) {
                width = this.overlapRight();
            }
        }
        
        // Single step method
        if (_.slideMethod == 'single' && this._action == 'next') {
            while (nextNode = nextNode.nextElementSibling) {
                width += nextNode.clientWidth;
                if (width > this._containerWidth) {
                    this.slideCarousel(width-this._containerWidth); // Slide carousel
                    // Update current item only if current item is no longer visible
                    if (this.overlapRight(width-this._containerWidth) <= 0) {
                        this.updateCurrentItem(this._currentItem.nextElementSibling); // Update current item
                    }
                    break;
                }
            }
        }
        if (_.slideMethod == 'single' && this._action == 'prev') {
            if (this.overlapLeft() > 0) {
                this.slideCarousel(this.overlapLeft()); // Slide carousel
            } else {
                // Simply grab previous sibling width and scroll
                if (this._currentItem.previousElementSibling) {
                    this.updateCurrentItem(this._currentItem.previousElementSibling); // Update current item
                    this.slideCarousel(this._currentItem.previousElementSibling.clientWidth); // Slide carousel
                }
            }
        }

        // Multi method
        if (_.slideMethod == 'multi' && this._action == 'next') {
            while (nextNode = nextNode.nextElementSibling) {
                width += nextNode.clientWidth;
                if (width > this._containerWidth) {
                    // Before scrolling, check if next item + next siblings width does not exceed container width
                    // If this is the case we can simply scroll to the last item of the carousel
                    var nextSibling = nextNode;
                    var siblingsWidth = (nextNode.clientWidth - (nextNode.clientWidth - (width - this._containerWidth)));
                    while (nextSibling = nextSibling.nextElementSibling) {
                        siblingsWidth += nextSibling.clientWidth;
                    }
                    if (siblingsWidth < this._containerWidth) {
                        this.slideCarousel(siblingsWidth); // Slide carousel
                        this.updateCurrentItem(nextNode.previousElementSibling); // Update current item
                    } else {
                        this.slideCarousel(width-nextNode.clientWidth); // Slide carousel
                        this.updateCurrentItem(nextNode); // Update current item
                    }
                    break;
                }
            }
        }
        if (_.slideMethod == 'multi' && this._action == 'prev') {
            // We are at the beginning of the carousel, no need to do anything
            if (this._totalScrolled >= 0) {
                // Silence is golden
            } else {
                var overlapLeft = this.overlapLeft();
                if (overlapLeft > 0) {
                    // In this case we will scroll the item to the far right of the container so that the item becomes fully visible
                    // and so that the other items next (previous items really) will also become visible as much as possible
                    while (nextNode = nextNode.nextElementSibling) {
                        width += nextNode.clientWidth;
                        if (width > this._containerWidth) {
                            // Before scrolling, check if next item + next siblings width does not exceed container width
                            // If this is the case we can simply scroll to the last item of the carousel
                            var nextSibling = this._currentItem;
                            var siblingsWidth = overlapLeft;
                            var firstNode = null;
                            while (nextSibling = nextSibling.previousElementSibling) {
                                siblingsWidth += nextSibling.clientWidth;
                                firstNode = nextSibling;
                            }
                            if (siblingsWidth < this._containerWidth) {
                                this.slideCarousel(siblingsWidth); // Slide carousel
                                this.updateCurrentItem(firstNode); // Update current item
                            } else {
                                this.slideCarousel(width-this._currentItemWidth); // Slide carousel
                                nextNode = this._currentItem;
                                width = this._currentItemWidth;
                                while (nextNode = nextNode.previousElementSibling) {
                                    width += nextNode.clientWidth;
                                    if (width > this._containerWidth) {
                                        this.updateCurrentItem(nextNode); // Update current item
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else {
                    width = 0;
                    var firstNode = null;
                    while (nextNode = nextNode.previousElementSibling) {
                        firstNode = nextNode;
                        width += nextNode.clientWidth;
                        if (width > this._containerWidth) {
                            this.updateCurrentItem(nextNode); // Update current item
                            this.slideCarousel(this._containerWidth); // Slide carousel
                            break;
                        }
                    }
                    if (width <= this._containerWidth) {
                        this.updateCurrentItem(firstNode); // Update current item
                        this.slideCarousel(width); // Slide carousel
                    }
                }
            }
        }
    },
    updateCurrentItem: function(next) {
        if(next){
            this._currentItem.classList.remove('current');
            next.classList.add('current');
        }
    },
    slideCarousel: function(amount) {
        if(this._action=='next'){
            amount = this._totalScrolled - amount; // If sliding forward (next)
        }else{
            amount = this._totalScrolled + amount; // If sliding backward (previous)
        }
        this._carouselTrack.style.marginLeft = amount + 'px';
    },
    overlapLeft: function() {
        return this._currentItemWidth - this.overlapRight();
    },
    overlapRight: function(visible) {
        var node = this._currentItem,
            width = this._currentItemWidth;
        while (node = node.previousElementSibling) {
            width += node.clientWidth;
        }
        if(this.settings.slideMethod=='single'){
            if(typeof visible === 'undefined') visible = 0;
            return (this._totalScrolled-visible) + width;
        }else{
            return this._totalScrolled + width;
        }
        return overlapRight;
    },

    // Initialize CarouselJS
    init: function() { // Returns the first visible item in the slider
        var _ = this.settings;
        // Search for DOM elements based on the selector
        if (typeof _.selector !== 'undefined' && _.selector !== '') {
            // Find and loop over all CarouselJS sliders
            var obj = document.querySelectorAll(_.selector);
            Object.keys(obj).forEach(function(key) {
                var carousel = obj[key];
                carousel.classList.remove('carouseljs');
                carousel.classList.add(_.customClass + '-track');
                carousel.firstElementChild.classList.add('current');
                // Set transitions
                carousel.style.WebkitTransition = "all " + parseFloat(_.animationSpeed) + "s"; // Code for Safari 3.1 to 6.0
                carousel.style.transition = "all " + parseFloat(_.animationSpeed) + "s"; // Standard syntax  
                // Create container
                var container = document.createElement('div');
                // Add classes to the container
                container.classList.add('carouseljs-container');
                container.classList.add(_.customClass + '-container');
                // Add buttons if enabled
                if (_.displayButtons === true) {
                    // Add "Previous" button
                    var prevButton = document.createElement(_.buttonsHtmlTAG);
                    prevButton.innerHTML = _.prevButtonHtml;
                    prevButton.setAttribute("onclick", "CarouselJS.trigger(this, 'prev')");
                    container.appendChild(prevButton);
                    // Add "Next" button
                    var nextButton = document.createElement(_.buttonsHtmlTAG);
                    nextButton.innerHTML = _.nextButtonHtml;
                    nextButton.setAttribute("onclick", "CarouselJS.trigger(this, 'next')");
                    container.appendChild(nextButton);
                }
                // Insert container before carousel slider in the DOM tree
                carousel.parentNode.insertBefore(container, carousel);
                // Move carousel slider into container
                container.appendChild(carousel);
            });
        } else {
            // Display error to the user about a missing option/setting
            alert('You forgot to define a selector in the CarouselJS options section!');
        }
    }
};
// Initialize CarouselJS
CarouselJS.init();
