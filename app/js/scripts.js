/*
 * Get Viewport Dimensions
 * returns object with viewport dimensions to match css in width and height properties
 * ( source: http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript )
 */
function updateViewportDimensions() {
    var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0], x = w.innerWidth || e.clientWidth || g.clientWidth, y = w.innerHeight || e.clientHeight || g.clientHeight;
    return {width: x, height: y}
}
// setting the viewport width
var viewport = updateViewportDimensions();
/*
 * Throttle Resize-triggered Events
 * Wrap your actions in this function to throttle the frequency of firing them off, for better performance, esp. on mobile.
 * ( source: http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed )
 */
var waitForFinalEvent = (function () {
    var timers = {};
    return function (callback, ms, uniqueId) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (timers[uniqueId]) {
            clearTimeout(timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
    };
})();
// how long to wait before deciding the resize has stopped, in ms. Around 50-100 should work ok.
var timeToWaitForLast = 100;
function loadGravatars() {
    viewport = updateViewportDimensions();
    if (viewport.width >= 768) {
        jQuery('.comment img[data-gravatar]').each(function () {
            jQuery(this).attr('src', jQuery(this).attr('data-gravatar'));
        });
    }
}
jQuery(document).ready(function ($) {
    loadGravatars();
    if (!sessionStorage['firstTime']) {
        sessionStorage['firstTime'] = 'yes';
        setTimeout(function () {
            $('.subscribe-popup').modal('show')
        }, 3000);
    }
    $('.char-limit').maxlength({
        maxCharacters: 250,
        status: true,
        statusClass: 'status',
        statusText: 'character left',
        notificationClass: 'notification',
        showAlert: false
    });
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.scrollToTop').fadeIn();
        } else {
            $('.scrollToTop').fadeOut();
        }
    });
    
	/*MS Add scripts for ebook page*/
	
	$(window).scroll(function () {
        if ($(this).scrollTop() > 200) {
            $('.interview-next-previous').fadeIn();
        } else {
            $('.interview-next-previous').fadeOut();
        }
    });
	
	/*MS close scripts for ebook page*/
	
    $('.scrollToTop').click(function () {
        $('html, body').animate({scrollTop: 0}, 800);
        return false;
    });
    $('.carousel-inner li:first').addClass('active');
    $('.carousel').carousel({
        interval: 6000
    });
    $('#content').delay(700).animate({'opacity': '1'}, 900);
    if (jQuery(window).width() > 768) {
        $('.dropdown').find('a.dropdown-toggle').removeAttr('data-toggle');
    }
    if (jQuery(window).width() < 769) {
        $('.dropdown').on('show.bs.dropdown', function () {
            $(this).siblings('.open').removeClass('open').find('a.dropdown-toggle').attr('data-toggle', 'dropdown');
            $(this).find('a.dropdown-toggle').removeAttr('data-toggle');
        });
    }
    if ($('.sticky').length) { // make sure '#sticky' element exists
        var el = $('.sticky');
        var stickyTop = $('.sticky').offset().top; // returns number
        var stickyHeight = $('.sticky').height();
        $(window).scroll(function () { // scroll event
            var limit = $('.footer').offset().top - stickyHeight + 60;
            var windowTop = $(window).scrollTop() + 225; // returns number
            if (stickyTop < windowTop) {
                el.css({position: 'fixed', top: 100});
            } else {
                el.css('position', 'static');
            }
            if (limit < windowTop) {
                var diff = limit - windowTop;
                el.css({top: diff});
            }
        });
    }
});
/* end of as page load scripts */
