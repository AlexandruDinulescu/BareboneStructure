/**
import jquery from './lib/jquery.min.js';
window.jQuery = window.$ = jquery;

import './lib/bootstrap.bundle.min.js';
 * 
 import './lib/ekko-lightbox.min.js';
 import './lib/hoverIntent.js';
 import './lib/superfish.min.js';
 */

let WebsiteContainer = {
    /**
     * SuperFish Initialization
     */
    superFish: function(){
        $('.sf-menu').superfish();
    },
    
    /**
     * Toggle the main navigation menu on mobile devices
     */
    menuToggler: function(){
        $('.icon-span').on('click', function(){
            $('.sf-menu').stop().slideToggle();
        });
    },
    
    /**
     * Init Popovers 
     */
    getPopovers: function(){
        $('[data-toggle="popover"]').popover();
    },

    /**
     * Init Tooltips
     */
    getTooltips: function(){
        $('[data-toggle="tooltip"]').tooltip();
    },

    /**
     * Init Bootstrap Lightbox 
     */
    setLightbox: function(){
        $(document).on('click', '[data-toggle="lightbox"]', function(event){
            event.preventDefault();
            $(this).ekkoLightbox({
                
            });
        });
    },
    /**
     * Init Function
     */
    init: function(){
        this.superFish();
        this.menuToggler();
        this.getPopovers();
        this.getPopovers();
        this.setLightbox();
    }
};

$(document).ready(function(){
    WebsiteContainer.init();
});

