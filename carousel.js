// Author: Rens Tillmann
// URL: github.com/RensTillmann/CarouselJS
// Description: A lightweight carousel/slider script, designed for `Super Forms`

"use strict";
var CarouselJS = {

    // Settings & Options
    settings: {
        selector: '.carouseljs',        // Selector to intialize the carousel element
        customClass: 'super-carousel',  // A custom class to be added on the container
        method: 'multi',                // This determines how the slide should be executed
                                        // `single` : slide only one item forward/backward at a time
                                        // `multi` : slide all visible items forward/backward up to "nextItem"
        layout: 'grid',                 // Choose what layout to use
                                        // `grid` : use flex grid, allowing you to only display a specific amount of items per slide 
                                        // `auto` : puts each item simply behind eachother, not caring about how many are visible
        columns: 4,                     // The items per slide (only works when `grid` layout is enabled)
                                        // This will basically create slides of X items each
                                        // Each item will get a width based on the carousel container width
                                        // For instance: if the carousel is 900px in width, each element would be 300px in width when
                                        // this option is set to `columns: 3`
        // Items
        items: {
            margin: '10px 10px 10px 10px',  // Define margin for each item
            padding: '10px 10px 10px 10px'  // Define padding for each item
        },
        animationSpeed: 0.3,                // The scroll animation speed in seconds
        
        // Navigation
        navigation: {
            buttons: {
                enabled: true,  // Display Prev/Next buttons (true|false)
                previous: {
                    html: ''    // HTML for inside the "prev/backward" button (leave blank for default buttons)
                },
                next: {
                    html: ''    // HTML for inside the "next/forward" button (leave blank for default buttons)
                }
            }
        }
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
        this._containerWidth = this.itemWidth(this._self);
        this._currentItem = this._self.querySelector('.current');
        this._currentItemWidth = this.itemWidth(this._currentItem);
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
        if (_.method == 'single' && this._action == 'next') {
            while (nextNode = nextNode.nextElementSibling) {
                width += this.itemWidth(nextNode);
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
        if (_.method == 'single' && this._action == 'prev') {
            if (this.overlapLeft() > 0) {
                this.slideCarousel(this.overlapLeft()); // Slide carousel
            } else {
                // Simply grab previous sibling width and scroll
                if (this._currentItem.previousElementSibling) {
                    this.updateCurrentItem(this._currentItem.previousElementSibling); // Update current item
                    this.slideCarousel(this.itemWidth(this._currentItem.previousElementSibling)); // Slide carousel
                }
            }
        }

        // Multi method
        if (_.method == 'multi' && this._action == 'next') {
            while (nextNode = nextNode.nextElementSibling) {
                width += this.itemWidth(nextNode);
                if (width > this._containerWidth) {
                    // Before scrolling, check if next item + next siblings width does not exceed container width
                    // If this is the case we can simply scroll to the last item of the carousel
                    var nextSibling = nextNode;
                    var siblingsWidth = (this.itemWidth(nextNode) - (this.itemWidth(nextNode) - (width - this._containerWidth)));
                    while (nextSibling = nextSibling.nextElementSibling) {
                        siblingsWidth += this.itemWidth(nextSibling);
                    }
                    if (siblingsWidth < this._containerWidth) {
                        this.slideCarousel(siblingsWidth); // Slide carousel
                        this.updateCurrentItem(nextNode.previousElementSibling); // Update current item
                    } else {
                        this.slideCarousel(width-this.itemWidth(nextNode)); // Slide carousel
                        this.updateCurrentItem(nextNode); // Update current item
                    }
                    break;
                }
            }
        }
        if (_.method == 'multi' && this._action == 'prev') {
            // We are at the beginning of the carousel, no need to do anything
            if (this._totalScrolled >= 0) {
                // Silence is golden
            } else {
                var overlapLeft = this.overlapLeft();
                if (overlapLeft > 0) {
                    // In this case we will scroll the item to the far right of the container so that the item becomes fully visible
                    // and so that the other items next (previous items really) will also become visible as much as possible
                    while (nextNode = nextNode.nextElementSibling) {
                        width += this.itemWidth(nextNode);
                        if (width > this._containerWidth) {
                            // Before scrolling, check if next item + next siblings width does not exceed container width
                            // If this is the case we can simply scroll to the last item of the carousel
                            var nextSibling = this._currentItem;
                            var siblingsWidth = overlapLeft;
                            var firstNode = null;
                            while (nextSibling = nextSibling.previousElementSibling) {
                                siblingsWidth += this.itemWidth(nextSibling);
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
                                    width += this.itemWidth(nextNode);
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
                        width += this.itemWidth(nextNode);
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
            width += this.itemWidth(node);
        }
        if(this.settings.method=='single'){
            if(typeof visible === 'undefined') visible = 0;
            return (this._totalScrolled-visible) + width;
        }else{
            return this._totalScrolled + width;
        }
        return overlapRight;
    },
    itemWidth: function(node){
        var style = window.getComputedStyle ? getComputedStyle(node, null) : node.currentStyle,
            marginLeft = parseFloat(style.marginLeft) || 0,
            marginRight = parseFloat(style.marginRight) || 0;
        return node.offsetWidth+(marginLeft+marginRight);
    },
    setMarginPadding: function(node){
        var _ = this.settings;
        if(_.items.margin!='') node.style.margin = _.items.margin;
        if(_.items.padding!='') node.style.padding = _.items.padding;
    },

    // Initialize CarouselJS
    init: function() { // Returns the first visible item in the slider
        var fn = this; 
        var _ = fn.settings;
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
                // Create wrapper
                var wrapper = document.createElement('div');
                wrapper.classList.add('carouseljs-wrapper');
                wrapper.classList.add(_.customClass + '-wrapper');
                // Create container
                var container = document.createElement('div');
                container.classList.add('carouseljs-container');
                container.classList.add(_.customClass + '-container');
                // Add buttons if enabled
                if (_.navigation.buttons.enabled === true) {
                    // Add "Previous" button
                    var prevButton = document.createElement('div');
                    prevButton.innerHTML = _.navigation.buttons.previous.html ? _.navigation.buttons.previous.html : '<i class="top-line"></i><i class="bottom-line"></i>';
                    prevButton.setAttribute("onclick", "CarouselJS.trigger(this, 'prev')");
                    prevButton.className = 'button prev';
                    wrapper.appendChild(prevButton);
                    // Add "Next" button
                    var nextButton = document.createElement('div');
                    nextButton.innerHTML = _.navigation.buttons.next.html ? _.navigation.buttons.next.html : '<i class="top-line"></i><i class="bottom-line"></i>';
                    nextButton.setAttribute("onclick", "CarouselJS.trigger(this, 'next')");
                    nextButton.className = 'button next';
                    wrapper.appendChild(nextButton);
                }
                // Insert wrapper before carousel slider in the DOM tree
                carousel.parentNode.insertBefore(wrapper, carousel);
                // Move carousel slider into container
                container.appendChild(carousel);
                // Move container into wrapper
                wrapper.appendChild(container);
                // Setup item width if `grid` layout is being used
                if(_.layout=='grid'){
                    console.log('Grid layout is used, set correct item width based on carousel container');
                    var itemWidth = parseFloat(container.clientWidth / _.columns).toFixed(2),
                        nodes = carousel.children,
                        len = nodes.length,
                        style = null,
                        i = 0,
                        marginLeft, marginRight, paddingLeft, paddingRight;
 
                    // @IMPORTANT:
                    // To speed up the loop, make sure we put the margins and paddings into our cache
                    // instead of calling `getComputedStyle` inside the loop on each item
                    
                    // First set the margin and paddings based on the settings for the first item
                    fn.setMarginPadding(nodes[i]);
                    // After we have set the item padding and margin, we can set it's width
                    // We must substract the items margin in order to get a correct width
                    style = window.getComputedStyle ? getComputedStyle(nodes[i], null) : nodes[i].currentStyle;
                    marginLeft = parseFloat(style.marginLeft) || 0;
                    marginRight = parseFloat(style.marginRight) || 0;
                    paddingLeft = parseFloat(style.paddingLeft) || 0;
                    paddingRight = parseFloat(style.paddingRight) || 0;
                    // Set correct width
                    nodes[i].style.width = itemWidth-(marginLeft+marginRight)-(paddingLeft+paddingRight)+'px';

                    // Now that we have our margin and padding loop over all other items
                    for (var i = 1; i < len; i++) {
                        // Set margin and paddings for the item
                        fn.setMarginPadding(nodes[i]);
                        // Set correct width
                        nodes[i].style.width = itemWidth-(marginLeft+marginRight)-(paddingLeft+paddingRight)+'px';
                    }
                }
            });
        } else {
            // Display error to the user about a missing option/setting
            alert('You forgot to define a selector in the CarouselJS options section!');
        }
    }
};
// Initialize CarouselJS
CarouselJS.init();
