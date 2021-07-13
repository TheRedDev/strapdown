/* global jQuery, marked, prettyPrint */
(function( $ ) {
  'use strict';

  var _ = {
    getStrapdownOrigin: function () {
      var scriptEls = document.getElementsByTagName('script'),
          sdOrigin = ''
          ;

      for (var i = 0; i < scriptEls.length; i++) {
        if (scriptEls[i].src.match('strapdown')) {
          sdOrigin = scriptEls[i].src;
          return sdOrigin.substr(0, sdOrigin.lastIndexOf('/'));
        }
      }

      console.warn('Unable to get the strapdown origin. File inclusion will probably fail.');
      return '';
    },

    importLiveReload: function () {
      console.log("Enabling livereload");
      $(document.head).append($('<script src="http://localhost:35729/livereload.js"></script>'));
    },

    importCss: function (settings) {
      var origin = _.getStrapdownOrigin();
      function addStyleSheet(sheet) {
        $(document.head).append($('<link/>', {
          href: origin + '/' + sheet,
          rel: 'stylesheet'}));
      }
      addStyleSheet('themes/' + settings.theme + '.css');
    },

    updateHead: function (settings) {
      // Use <meta> viewport so that Bootstrap is actually responsive on mobile
      $(document.head).prepend($('<meta name="viewport" content="width=device-width, initial-scale=1">')); // why was it 'max/min width = 1'?
      if(settings.importCss) {
        _.importCss(settings);
      }
    },

    createNavbar: function (settings) {
      if (!settings.navbar) {return;}
      console.log("Creating navbar", settings.navbar);
      var navbarCollapseBtn = ' <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">' +
                              '   Table of Contents' +
                              ' </button>',
          tocInsertionPoint = '<div class="toc collapse navbar-collapse"></div>',
          navbarHeader       = ' <div class="navbar-header"><div id="headline" class="navbar-brand">' + settings.navbar.title +'</div></div>'
          ;

      var newNode = document.createElement('div');
      newNode.className = 'navbar navbar-default navbar-fixed-top';
      newNode.innerHTML = '<div class="container">' +
                          (settings.toc ? navbarCollapseBtn + navbarHeader + tocInsertionPoint : navbarHeader) +
                          '</div>';

      if (settings.toc) {
        settings.toc.dest = '.toc';
      }

      document.body.insertBefore(newNode, document.body.firstChild);
    },

    updateBody: function (contentEl, settings) {
      var markdown = contentEl.text(),
          newContentEl = (settings.dest ? $(settings.dest) : null)
          ;

      if (! newContentEl || ! newContentEl.length) {
        newContentEl = $('<div id="content"></div>');
        contentEl.replaceWith($('<div></div>', {
          'class': 'container',
          'html': newContentEl
        }));
      }

      // Generate Markdown
      newContentEl.html(marked(markdown));

      // Prettify
      if (prettyPrint) {
        newContentEl.find('code').each(function () {
          this.className = 'prettyprint lang-' + this.className;
        });
        prettyPrint();
      }

      // Style tables
      newContentEl.find('table').each(function () {
        this.className = 'table table-striped table-bordered';
      });

      // Make the images responsive
      newContentEl.find('img').each(function () {
        this.className = 'img-responsive';
      });

      return newContentEl;
    },

    extractAttributeOptions: function (mdEl) {
      var htmlOptions = {};

      $.each(mdEl.get(0)?.attributes, function (idx, el) {
        switch (el.name) {
        case 'toc':
          if(!htmlOptions.toc) htmlOptions.toc = {};
          break;
        case 'toc-top-link':
          if(!htmlOptions.toc) htmlOptions.toc = {};
          htmlOptions.toc.topLink = el.value ? el.value : 'Back to top';
          break;
        case 'toc-disabled':
          if(!htmlOptions.toc) htmlOptions.toc = {};
          htmlOptions.toc.disabled = true;
          break;
        case 'theme':
          htmlOptions.theme = el.value;
          break;
          }
      });

      return htmlOptions;
    },

    normalizeOptions: function (attributeOptions, jsOptions) {
      var settings =  $.extend(
        true, /* deep merge */
        {}, /* target */
        $.fn.strapdown.defaults, attributeOptions, jsOptions);

      if (settings.navbar) {
        settings.navbar.title = settings.navbar.title || ($('title').length ? $('title').get(0).innerHTML : 'Strapdown');
      }

      return settings;
    },

    mainProcess: function (caller, options) {
      if (!marked) {
        console.warn('Marked not found. Unable to proceed further.');
        return;
      }

      var target;

      if (caller.get(0) === document || caller.get(0) === document.body) {
        target = $('xmp,textarea').eq(0);
      } else {
        target = caller;
      }

      var settings = _.normalizeOptions(_.extractAttributeOptions(target), options);
      var updatedDom = _.updateBody(target, settings);

      if (settings.importLiveReload) {
        _.importLiveReload();
      }
      _.updateHead(settings);

      if (settings.navbar) {
        _.createNavbar(settings);
      }

      if (settings.toc && !settings.toc.disabled) {
        $.fn.strapdown.toc(updatedDom, settings);
      }

      return updatedDom;
    }

  };

  $.fn.strapdown = function (methodOrOptions, optionsIfMethod) {
    if (methodOrOptions === 'toc') {
      return $.fn.strapdown.toc(this, optionsIfMethod);
    } else {
      return _.mainProcess(this, methodOrOptions);
    }
  };

  $.fn.strapdown.importCss = _.importCss;

  $.fn.strapdown.defaults = {
    importCss: false,
    navbar: false,
    toc: false,
    importLiveReload: false,
    theme: 'united',
  };

  // @ifdef DEBUG
  // For testing purposes
  $.fn.strapdown._internals = _;
  // @endif

}( jQuery ));

